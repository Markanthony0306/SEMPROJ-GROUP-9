// Real Supabase query building and Nodemailer templates, with isolated storage.
// No .env is loaded, no network is used, and no real email is sent.
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { setImmediate as nextTurn } from 'node:timers/promises'
import test from 'node:test'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import express from 'express'
import { once } from 'node:events'
import { loadDatabase, saveDatabase } from '../server/lib/database.js'
import { createAdminNotificationService } from '../server/services/adminNotifications.js'
import { notificationRoutes } from '../server/routes/notifications.js'
import {
  checkMembershipReminderSetup,
  createMembershipReminderService,
  reminderType,
  startMembershipReminders
} from '../server/services/membershipReminders.js'

const DAY_MS = 86_400_000
const baseTime = Date.UTC(2026, 9, 21, 16)
const iso = (days) => new Date(baseTime + days * DAY_MS).toISOString()
const memberFixture = (patch = {}) => ({
  id: crypto.randomUUID(),
  role: 'user',
  name: 'Test Member',
  email: 'member@fixture.test',
  status: 'active',
  subscriptionId: crypto.randomUUID(),
  plan: 'Monthly',
  membershipStart: iso(-20),
  membershipEnd: iso(7),
  ...patch
})
const response = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })

function fixture({ smtp = true } = {}) {
  const state = {
    time: baseTime,
    loads: 0,
    messages: [],
    logs: [],
    receipts: new Map(),
    smtpFailure: false,
    rejectRecipient: false,
    claimFailure: false,
    claimError: null,
    tableFailure: null,
    settingsFailure: null,
    claimRequests: [],
    saveFailure: false,
    beforeClaim: null,
    dismissalFailure: false
  }
  const project = {
    roles: [
      { role_id: 1, role_name: 'member' },
      { role_id: 2, role_name: 'admin' }
    ],
    users: [],
    subscriptions: [],
    membership_plans: [
      { plan_id: 1, plan_name: 'Monthly', duration_days: 30, price: 800, is_active: true }
    ],
    gym_settings: [{ id: 1, gym_name: 'FitPulse', reminder_days: 7, email_enabled: true }],
    gym_equipment: [],
    admin_notification_dismissals: []
  }
  const keyFor = (body) =>
    JSON.stringify([body.p_subscription_id, body.p_membership_end, body.p_reminder_type])
  const matches = (row, url) =>
    [...url.searchParams].every(([field, filter]) => {
      if (['select', 'order', 'offset', 'limit'].includes(field)) return true
      if (filter === 'is.null') return row[field] === null
      assert.ok(filter.startsWith('eq.'), `Unexpected filter ${filter}`)
      return String(row[field]) === filter.slice(3)
    })
  const supabase = createClient('https://reminders.fixture.test', 'fixture-service-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, options = {}) => {
        const url = new URL(String(input))
        assert.equal(url.origin, 'https://reminders.fixture.test')
        assert.equal(new Headers(options.headers).get('apikey'), 'fixture-service-key')
        const body = options.body ? JSON.parse(options.body) : {}
        if (url.pathname === '/rest/v1/rpc/claim_membership_reminder') {
          state.claimRequests.push(body)
          if (state.claimFailure)
            return response({ message: 'Missing migration', code: 'PGRST202' }, 404)
          if (state.claimError) return response(state.claimError, state.claimError.status || 500)
          if (body.p_subscription_id !== '00000000-0000-0000-0000-000000000000')
            state.beforeClaim?.()
          const subscription = project.subscriptions.find(
            (row) => row.subscription_id === body.p_subscription_id
          )
          const member = project.users.find((row) => row.id === subscription?.user_id)
          const role = project.roles.find((row) => row.role_id === member?.role_id)?.role_name
          const settings = project.gym_settings[0]
          const currentType = reminderType(
            {
              role,
              status: member?.status,
              email: member?.email,
              subscriptionId: subscription?.subscription_id,
              membershipStart: subscription?.start_date,
              membershipEnd: subscription?.end_date
            },
            settings.reminder_days,
            state.time
          )
          if (
            !settings.email_enabled ||
            currentType !== body.p_reminder_type ||
            subscription.end_date !== body.p_membership_end
          )
            return response(false)
          const key = keyFor(body)
          const prior = state.receipts.get(key)
          if (prior && (prior.sent_at || Date.parse(prior.claimed_until) > state.time))
            return response(false)
          state.receipts.set(key, {
            subscription_id: body.p_subscription_id,
            membership_end: body.p_membership_end,
            reminder_type: body.p_reminder_type,
            claim_token: body.p_claim_token,
            claimed_until: new Date(state.time + 10 * 60_000).toISOString(),
            sent_at: null
          })
          return response(true)
        }
        if (url.pathname === '/rest/v1/membership_reminders') {
          if (state.tableFailure) return response(state.tableFailure, 404)
          if ((options.method || 'GET') === 'GET')
            return response([...state.receipts.values()].filter((row) => matches(row, url)))
          assert.equal(options.method, 'PATCH')
          if (body.sent_at && state.saveFailure)
            return response({ message: 'Database unavailable' }, 503)
          const rows = [...state.receipts.values()].filter((row) => matches(row, url))
          rows.forEach((row) => Object.assign(row, body))
          return response(rows.map((row) => ({ subscription_id: row.subscription_id })))
        }
        if (url.pathname === '/rest/v1/gym_settings' && state.settingsFailure)
          return response(state.settingsFailure, 400)
        if (url.pathname === '/rest/v1/admin_notification_dismissals') {
          if (state.dismissalFailure)
            return response({ code: 'PGRST205', message: 'Missing migration' }, 404)
          if (options.method === 'POST') {
            for (const row of body) {
              if (
                !project.admin_notification_dismissals.some(
                  (existing) =>
                    existing.admin_user_id === row.admin_user_id &&
                    existing.notification_key === row.notification_key
                )
              )
                project.admin_notification_dismissals.push(structuredClone(row))
            }
            return response(null)
          }
        }
        if (url.pathname === '/rest/v1/gym_settings' && options.method === 'POST') {
          Object.assign(project.gym_settings[0], body)
          return response([project.gym_settings[0]])
        }
        assert.equal(options.method || 'GET', 'GET')
        const table = url.pathname.split('/').at(-1)
        assert.ok(project[table], `Unexpected table ${table}`)
        const rows = project[table].filter((row) => matches(row, url))
        return response(rows)
      }
    }
  })
  const transport = nodemailer.createTransport({ jsonTransport: true })
  const mailer = smtp
    ? {
        sendMail: async (mail) => {
          if (state.smtpFailure) throw new Error('Synthetic SMTP outage')
          if (state.rejectRecipient) return { accepted: [], rejected: [mail.to] }
          const result = await transport.sendMail(mail)
          state.messages.push(JSON.parse(result.message))
          return { accepted: [mail.to], rejected: [], messageId: '<reminder@fixture.test>' }
        }
      }
    : null
  const logger = {
    error: (message) => state.logs.push(message),
    info: (message) => state.logs.push(message)
  }
  function createService() {
    return createMembershipReminderService({
      supabase,
      mailer,
      logger,
      now: () => state.time,
      from: 'FitPulse <no-reply@fixture.test>',
      loginUrl: 'https://app.fixture.test',
      loadDatabase: (sections) => {
        state.loads += 1
        return loadDatabase(supabase, sections)
      }
    })
  }
  function addMember(patch = {}) {
    const member = memberFixture(patch)
    project.users.push({
      id: member.id,
      role_id: member.role === 'admin' ? 2 : 1,
      name: member.name,
      email: member.email,
      status: member.status,
      created_at: iso(-20)
    })
    project.subscriptions.push({
      subscription_id: member.subscriptionId,
      user_id: member.id,
      plan_id: 1,
      start_date: member.membershipStart,
      end_date: member.membershipEnd,
      status: 'active',
      created_at: iso(-20)
    })
    return member
  }
  return {
    state,
    project,
    logger,
    supabase,
    mailer,
    addMember,
    createService,
    service: createService()
  }
}

test('timing uses the exact reminder boundary and expiry instant', () => {
  const member = memberFixture()
  assert.equal(reminderType(member, 7, baseTime - 1), null)
  assert.equal(reminderType(member, 7, baseTime), 'upcoming')
  assert.equal(reminderType(member, 3, baseTime), null)
  assert.equal(reminderType(member, 7, Date.parse(member.membershipEnd)), 'expired')
})

test('skips staff, inactive accounts, invalid dates, invalid email and future memberships', () => {
  for (const patch of [
    { role: 'admin' },
    { role: 'staff' },
    { status: 'suspended' },
    { status: 'inactive' },
    { membershipStart: null },
    { membershipEnd: 'invalid' },
    { membershipEnd: iso(-21) },
    { membershipStart: iso(1) },
    { email: '' },
    { email: 'bad-email' },
    { subscriptionId: null }
  ])
    assert.equal(reminderType(memberFixture(patch), 7, baseTime), null)
  assert.equal(reminderType(memberFixture(), 0, baseTime), null)
  assert.equal(reminderType(memberFixture(), 31, baseTime), null)
})

test('worker loads real account mappings, sends branded mail and stores a receipt', async () => {
  const f = fixture()
  f.addMember({ membershipEnd: iso(0.5) })
  f.addMember({ role: 'admin' })
  f.addMember({ membershipEnd: iso(10) })
  assert.deepEqual(await f.service.runDue(), { sent: 1, failed: 0 })
  assert.equal(f.state.messages.length, 1)
  const message = f.state.messages[0]
  assert.match(message.text, /Oct 22, 2026/)
  assert.match(message.html, /View my membership/)
  assert.match(message.text, /https:\/\/app.fixture.test/)
  assert.ok([...f.state.receipts.values()][0].sent_at)
})

test('repeated checks and a restarted worker do not repeat an accepted reminder', async () => {
  const f = fixture()
  f.addMember()
  assert.equal((await f.service.runDue()).sent, 1)
  assert.equal((await f.service.runDue()).sent, 0)
  assert.equal((await f.createService().runDue()).sent, 0)
  assert.equal(f.state.messages.length, 1)
})

test('overlapping worker instances share the atomic claim', async () => {
  const f = fixture()
  f.addMember()
  const results = await Promise.all([f.service.runDue(), f.createService().runDue()])
  assert.equal(
    results.reduce((sum, result) => sum + result.sent, 0),
    1
  )
  assert.equal(f.state.messages.length, 1)
})

test('overlapping runs in one process share a single database load', async () => {
  const f = fixture()
  f.addMember()
  await Promise.all([f.service.runDue(), f.service.runDue()])
  assert.equal(f.state.loads, 1)
})

test('sends one expired reminder and a renewal starts a new reminder period', async () => {
  const f = fixture()
  const member = f.addMember({ membershipEnd: iso(1) })
  await f.service.runDue()
  f.state.time = baseTime + DAY_MS
  assert.equal((await f.service.runDue()).sent, 1)
  assert.equal((await f.service.runDue()).sent, 0)
  assert.match(f.state.messages[1].text, /has ended/)
  const subscription = f.project.subscriptions.find(
    (row) => row.subscription_id === member.subscriptionId
  )
  subscription.end_date = iso(6)
  assert.equal((await f.service.runDue()).sent, 1)
  assert.equal(f.state.messages.length, 3)
})

test('missing SMTP or disabled preferences send no mail', async () => {
  const missing = fixture({ smtp: false })
  missing.addMember()
  assert.deepEqual(await missing.service.runDue(), { sent: 0, failed: 0 })
  assert.equal(missing.state.loads, 0)
  const disabled = fixture()
  disabled.addMember()
  disabled.project.gym_settings[0].email_enabled = false
  await disabled.service.runDue()
  assert.equal(disabled.state.messages.length, 0)
  assert.equal(disabled.state.receipts.size, 0)
})

test('a changed preference or renewal before claiming suppresses stale reminders', async () => {
  for (const change of ['disable', 'renew']) {
    const f = fixture()
    f.addMember()
    f.state.beforeClaim = () => {
      if (change === 'disable') f.project.gym_settings[0].email_enabled = false
      else f.project.subscriptions[0].end_date = iso(30)
    }
    assert.equal((await f.service.runDue()).sent, 0)
    assert.equal(f.state.messages.length, 0)
  }
})

test('SMTP failures and rejected recipients remain eligible for a later retry', async () => {
  for (const failure of ['smtpFailure', 'rejectRecipient']) {
    const f = fixture()
    f.addMember()
    f.state[failure] = true
    assert.equal((await f.service.runDue()).failed, 1)
    assert.equal([...f.state.receipts.values()][0].sent_at, null)
    f.state[failure] = false
    assert.equal((await f.service.runDue()).sent, 1)
  }
})

test('missing migration stops the whole batch before any real reminder is reserved', async () => {
  const f = fixture()
  f.addMember()
  f.addMember()
  f.addMember()
  f.state.claimFailure = true
  await assert.rejects(f.service.runDue(), /setup is missing \(PGRST202\)/)
  assert.equal(f.state.messages.length, 0)
  assert.equal(f.state.receipts.size, 0)
  assert.equal(f.state.claimRequests.length, 1)
  assert.equal(f.state.claimRequests[0].p_subscription_id, '00000000-0000-0000-0000-000000000000')
  assert.match(f.service.getStatus().lastError, /005_admin_notifications.sql/)
  assert.equal(f.service.getStatus().lastCounts, null)
  assert.equal(f.service.getStatus().running, false)
  f.state.claimFailure = false
  assert.equal((await f.service.runDue()).sent, 3)
  assert.equal(f.service.getStatus().lastError, null)
})

test('setup checks validate schema and permissions without sending or reserving reminders', async () => {
  const f = fixture()
  f.addMember()
  await checkMembershipReminderSetup(f.supabase)
  assert.equal(f.state.receipts.size, 0)
  assert.equal(f.state.messages.length, 0)
  for (const [flag, code] of [
    ['tableFailure', 'PGRST205'],
    ['settingsFailure', '42703']
  ]) {
    f.state[flag] = { code, message: 'Provider details must stay private' }
    await assert.rejects(checkMembershipReminderSetup(f.supabase), (error) => {
      assert.ok(error.message.includes(code))
      assert.ok(!error.message.includes('Provider details'))
      return true
    })
    f.state[flag] = null
  }
  f.state.claimError = { code: '42501', status: 403, message: 'Private permission details' }
  await assert.rejects(checkMembershipReminderSetup(f.supabase), /access is denied \(42501\)/)
  f.state.claimError = { code: 'XX000', message: 'Private internal database details' }
  await assert.rejects(checkMembershipReminderSetup(f.supabase), (error) => {
    assert.match(error.message, /setup could not be verified \(XX000\)/)
    assert.ok(!error.message.includes('Apply '))
    assert.ok(!error.message.includes('Private internal'))
    return true
  })
})

test('scheduler reports one setup error for three due subscriptions and retries later', async () => {
  const f = fixture()
  for (let index = 0; index < 3; index += 1) f.addMember()
  f.state.claimFailure = true
  let scheduled
  let resolveScheduled
  const ready = new Promise((resolve) => {
    resolveScheduled = resolve
  })
  const stop = startMembershipReminders({
    runDue: f.service.runDue,
    logger: { error: (message) => f.state.logs.push(message), info: () => {} },
    setTimer: (callback, delay) => {
      scheduled = { callback, delay }
      resolveScheduled()
      return scheduled
    },
    clearTimer: () => {}
  })
  await ready
  assert.equal(f.state.logs.length, 1)
  assert.match(f.state.logs[0], /005_admin_notifications.sql/)
  assert.equal(f.state.claimRequests.length, 1)
  assert.equal(scheduled.delay, 60 * 60 * 1000)
  stop()
})

test('a failed receipt keeps its lease; another member still receives a reminder', async () => {
  const f = fixture()
  const first = f.addMember({ email: 'first@fixture.test' })
  f.addMember({ email: 'second@fixture.test' })
  f.state.saveFailure = true
  assert.equal((await f.service.runDue()).failed, 2)
  assert.equal(f.state.messages.length, 2)
  f.state.saveFailure = false
  assert.equal((await f.service.runDue()).sent, 0)
  assert.equal(f.state.messages.length, 2)
  // Simulate a worker that crashed before sending: its lease eventually expires.
  const receipt = [...f.state.receipts.values()].find(
    (row) => row.subscription_id === first.subscriptionId
  )
  receipt.claimed_until = new Date(baseTime - 1).toISOString()
  assert.equal((await f.service.runDue()).sent, 1)
})

test('scheduler checks at startup, waits an hour, recovers from errors and stops', async () => {
  let checks = 0
  let scheduled
  let cleared
  const logs = []
  const stop = startMembershipReminders({
    runDue: async () => {
      checks += 1
      if (checks === 1) throw new Error('Synthetic database outage')
      return { sent: 1, failed: 0 }
    },
    logger: { error: (message) => logs.push(message), info: () => {} },
    setTimer: (callback, delay) => {
      scheduled = { callback, delay }
      return scheduled
    },
    clearTimer: (timer) => {
      cleared = timer
    }
  })
  await nextTurn()
  assert.equal(checks, 1)
  assert.equal(scheduled.delay, 60 * 60 * 1000)
  assert.equal(logs.length, 1)
  await scheduled.callback()
  assert.equal(checks, 2)
  stop()
  assert.equal(cleared, scheduled)
})

const notificationsFor = (f) =>
  createAdminNotificationService({
    supabase: f.supabase,
    loadDatabase: (sections) => loadDatabase(f.supabase, sections),
    smtpConfigured: true,
    reminders: f.service,
    now: () => f.state.time
  })

test('legacy email_notifications preference is read and saved without changing its column', async () => {
  const f = fixture()
  const settings = f.project.gym_settings[0]
  settings.email_notifications = true
  delete settings.email_enabled
  const database = await loadDatabase(f.supabase, ['settings'])
  assert.equal(database.settings.emailOn, true)
  database.settings.emailOn = false
  await saveDatabase(f.supabase, database)
  assert.equal(settings.email_notifications, false)
  assert.equal(Object.hasOwn(settings, 'email_enabled'), false)
})

test('delivery status distinguishes failed attempts from SMTP acceptance and preserves receipts', async () => {
  const f = fixture()
  f.addMember()
  const service = notificationsFor(f)
  assert.equal((await service.list('admin-a')).notifications[0].delivery.state, 'not_sent')
  f.state.smtpFailure = true
  await f.service.runDue()
  let list = await service.list('admin-a')
  assert.equal(list.notifications[0].delivery.state, 'failed')
  assert.equal(list.notifications[0].delivery.errorCode, 'SMTP_ERROR')
  assert.ok(list.notifications[0].delivery.attemptedAt)
  f.state.smtpFailure = false
  await f.service.runDue()
  list = await service.list('admin-a')
  assert.equal(list.notifications[0].delivery.state, 'sent')
  assert.equal(list.notifications[0].delivery.messageId, '<reminder@fixture.test>')
  assert.equal(list.notifications[0].delivery.sentAt, new Date(baseTime).toISOString())
  assert.equal(list.email.lastCheckedAt, new Date(baseTime).toISOString())
  assert.deepEqual(list.email.lastCounts, { sent: 1, failed: 0 })
  const receipts = structuredClone([...f.state.receipts])
  await service.dismiss('admin-a', list.notifications[0].id)
  assert.deepEqual([...f.state.receipts], receipts)
  assert.equal((await f.service.runDue()).sent, 0)
})

test('notification dismissal persists per administrator and clear-all affects only its group', async () => {
  const f = fixture()
  f.addMember()
  f.project.gym_equipment.push({
    id: crypto.randomUUID(),
    name: 'Treadmill',
    condition: 'Good',
    last_inspected: iso(-40)
  })
  const service = notificationsFor(f)
  const before = structuredClone(f.project)
  assert.equal((await service.list('admin-a')).notifications.length, 2)
  assert.equal(await service.dismiss('admin-a', undefined, 'membership'), 1)
  assert.equal((await notificationsFor(f).list('admin-a')).notifications[0].kind, 'equipment')
  assert.equal((await service.list('admin-b')).notifications.length, 2)
  assert.equal(await service.dismiss('admin-a'), 1)
  assert.equal((await service.list('admin-a')).notifications.length, 0)
  assert.deepEqual(f.project.users, before.users)
  assert.deepEqual(f.project.subscriptions, before.subscriptions)
  assert.deepEqual(f.project.gym_equipment, before.gym_equipment)
  f.project.subscriptions[0].end_date = iso(6)
  assert.equal((await service.list('admin-a')).notifications[0].kind, 'membership')
})

test('an expired claim with an unacknowledged SMTP attempt never claims that no email was sent', async () => {
  const f = fixture()
  f.addMember()
  f.state.saveFailure = true
  await f.service.runDue()
  assert.equal(f.state.messages.length, 1)
  f.state.time += 11 * 60_000
  const list = await notificationsFor(f).list('admin-a')
  assert.equal(list.notifications[0].delivery.state, 'unconfirmed')
  assert.ok(list.notifications[0].delivery.attemptedAt)
  assert.equal(list.notifications[0].delivery.sentAt, undefined)
})

test('missing dismissal migration is visible and cannot report a successful clear', async () => {
  const f = fixture()
  f.addMember()
  f.state.dismissalFailure = true
  const service = notificationsFor(f)
  const list = await service.list('admin-a')
  assert.equal(list.notifications.length, 1)
  assert.equal(list.canDismiss, false)
  assert.match(list.issue, /005_admin_notifications.sql/)
  await assert.rejects(service.dismiss('admin-a'), /005_admin_notifications.sql/)
  assert.equal(f.project.admin_notification_dismissals.length, 0)
})

test('notification API enforces roles, confirmation, group scope and SMTP checks without real mail', async () => {
  const f = fixture()
  f.addMember()
  const notifications = notificationsFor(f)
  let verifications = 0
  const app = express()
  app.use(express.json())
  app.use(
    '/api',
    notificationRoutes({
      notifications,
      reminders: f.service,
      mailer: {
        verify: async () => {
          verifications += 1
        }
      },
      authenticate: (req, res, next) => {
        const role = req.headers.authorization
        if (!role) return res.status(401).json({ message: 'Sign in.' })
        req.user = { id: 'admin-a', role }
        next()
      },
      requireRole:
        (...roles) =>
        (req, res, next) =>
          roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Denied.' }),
      rateLimit: () => (req, res, next) => next()
    })
  )
  app.use((error, req, res, next) => res.status(500).json({ message: error.message }))
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const origin = `http://127.0.0.1:${server.address().port}/api/admin/notifications`
  const request = async (method, suffix = '', role = 'admin', body) => {
    const result = await fetch(origin + suffix, {
      method,
      headers: { 'Content-Type': 'application/json', ...(role ? { Authorization: role } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    })
    return { status: result.status, body: await result.json() }
  }
  try {
    assert.equal((await request('GET', '', null)).status, 401)
    assert.equal((await request('GET', '', 'member')).status, 403)
    assert.equal((await request('GET', '', 'staff')).status, 200)
    assert.equal((await request('DELETE', '', 'staff', { confirmation: 'CLEAR' })).status, 403)
    assert.equal((await request('DELETE', '', 'admin', { confirmation: 'clear' })).status, 400)
    assert.equal(
      (await request('DELETE', '', 'admin', { confirmation: 'CLEAR', group: 'users' })).status,
      400
    )
    assert.equal((await request('DELETE', '/invalid')).status, 400)
    assert.equal((await request('POST', '/check-smtp', 'staff')).status, 403)
    assert.equal((await request('POST', '/check-smtp')).status, 200)
    assert.equal(verifications, 1)
    assert.equal(f.state.messages.length, 0)
    assert.equal((await request('POST', '/check-email', 'staff')).status, 403)
    assert.equal((await request('POST', '/check-email')).body.sent, 1)
    assert.equal((await request('POST', '/check-email')).body.sent, 0)
    const list = await request('GET')
    assert.equal(list.body.notifications[0].delivery.state, 'sent')
    const id = list.body.notifications[0].id
    assert.equal((await request('DELETE', `/${id}`)).body.deleted, 1)
    assert.equal((await request('DELETE', `/${id}`)).status, 404)
    assert.equal((await request('GET')).body.notifications.length, 0)
    assert.equal(f.state.messages.length, 1)
  } finally {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
})
