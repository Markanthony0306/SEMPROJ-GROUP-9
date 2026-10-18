// Isolated integration checks: real Express routes + Supabase SDK + in-memory REST.
// No .env, cloud accounts, camera, or email recipients are used.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { once } from 'node:events'
import { test } from 'node:test'
import express from 'express'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'
import { reportRoutes } from '../server/routes/reports.js'
import { reportRecordInput } from '../server/services/reportRecords.js'
import { loadDatabase } from '../server/lib/database.js'
import { welcomeEmail, expiryEmail, recoveryEmail } from '../server/services/emailTemplates.js'
import { sendPasswordRecovery } from '../server/services/passwordRecovery.js'
import { activityBuckets } from '../src/utils/activityChart.js'
import { buildReport } from '../src/utils/reports.js'

const now = Date.now()
const iso = (days) => new Date(now + days * 86400000).toISOString()
const memberId = randomUUID()
const adminId = randomUUID()
const equipmentId = randomUUID()
const originalSubscription = randomUUID()
const renewalSubscription = randomUUID()
const scannerRecordId = randomUUID()
const project = {
  roles: [
    { role_id: 1, role_name: 'admin' },
    { role_id: 2, role_name: 'member' }
  ],
  users: [
    {
      id: memberId,
      role_id: 2,
      name: 'Test Member',
      email: 'member@example.test',
      status: 'active',
      created_at: iso(-60)
    },
    { id: adminId, role_id: 1, name: 'Test Admin', email: 'admin@example.test', status: 'active' }
  ],
  membership_plans: [
    { plan_id: 1, plan_name: 'Monthly', is_active: true, duration_days: 30, price: 800 }
  ],
  subscriptions: [
    {
      subscription_id: originalSubscription,
      user_id: memberId,
      plan_id: 1,
      start_date: iso(-60),
      end_date: iso(-30),
      created_at: iso(-60)
    },
    {
      subscription_id: renewalSubscription,
      user_id: memberId,
      plan_id: 1,
      start_date: iso(-30),
      end_date: iso(30),
      created_at: iso(-30)
    }
  ],
  payment_methods: [
    { method_id: 1, method_name: 'Cash' },
    { method_id: 2, method_name: 'GCash' }
  ],
  payments: [],
  attendance_logs: [
    {
      attendance_id: scannerRecordId,
      user_id: memberId,
      member_name: 'Test Member',
      check_in_time: iso(-1),
      entry_type: 'ESP32-CAM',
      device_id: 'fixture-device',
      request_id: 'private-request',
      qr_token_id: 'private-token'
    }
  ],
  gym_equipment: [{ id: equipmentId, name: 'Treadmill', category: 'Cardio', condition: 'Good' }],
  gym_maintenance: []
}
let failNextWrite = false
const supabase = createClient('https://isolated-project.test', 'fixture-key', {
  auth: { persistSession: false },
  global: {
    fetch: async (input, options = {}) => {
      const url = new URL(String(input))
      const table = url.pathname.split('/').pop()
      assert.ok(Object.hasOwn(project, table), `Unexpected table: ${table}`)
      const method = options.method || 'GET'
      const primaryKey =
        {
          payments: 'payment_id',
          attendance_logs: 'attendance_id',
          subscriptions: 'subscription_id',
          membership_plans: 'plan_id',
          payment_methods: 'method_id',
          roles: 'role_id'
        }[table] || 'id'
      const matches = (row) =>
        [...url.searchParams].every(
          ([key, value]) => !value.startsWith('eq.') || String(row[key]) === value.slice(3)
        )
      let data = project[table].filter(matches)
      if (method !== 'GET') {
        if (failNextWrite) {
          failNextWrite = false
          return new Response(
            JSON.stringify({ code: 'fixture_failure', message: 'Synthetic database failure' }),
            { status: 500 }
          )
        }
        const body = options.body ? JSON.parse(options.body) : null
        if (method === 'POST') {
          data = Array.isArray(body) ? body : [body]
          project[table].push(...structuredClone(data))
        } else if (method === 'PATCH') {
          data.forEach((row) => Object.assign(row, body))
        } else if (method === 'DELETE') {
          project[table] = project[table].filter((row) => !matches(row))
        }
      }
      if (url.searchParams.get('select') === primaryKey)
        data = data.map((row) => ({ [primaryKey]: row[primaryKey] }))
      return new Response(JSON.stringify(data), {
        status: method === 'POST' ? 201 : 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
})

const app = express()
app.use(express.json())
const authenticate = (req, res, next) => {
  const role = req.headers.authorization?.replace('Bearer ', '')
  if (!['admin', 'staff', 'member'].includes(role))
    return res.status(401).json({ message: 'Sign in.' })
  req.user = { id: adminId, role }
  next()
}
const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Denied.' })
app.use(
  '/api',
  reportRoutes({
    authenticate,
    requireRole,
    supabase,
    loadDatabase: (sections) => loadDatabase(supabase, sections),
    rateLimit: () => (req, res, next) => next()
  })
)
app.use((error, req, res, next) => res.status(500).json({ message: error.message }))
const server = app.listen(0, '127.0.0.1')
await once(server, 'listening')
const origin = `http://127.0.0.1:${server.address().port}/api/admin/reports`
const request = async (kind, { method = 'GET', role = 'admin', body } = {}) => {
  const response = await fetch(`${origin}/${kind}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(role ? { Authorization: `Bearer ${role}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  })
  return { status: response.status, body: await response.json() }
}

try {
  await test('Report endpoints enforce sign-in, role, kind, and identifier checks', async () => {
    assert.equal((await request('payments', { role: null })).status, 401)
    assert.equal((await request('payments', { role: 'member' })).status, 403)
    assert.equal((await request('payments')).status, 200)
    assert.equal((await request('__proto__')).status, 404)
    assert.equal((await request('payments/not-a-uuid', { method: 'DELETE' })).status, 400)
    assert.equal(
      (await request(`payments/${randomUUID()}`, { method: 'DELETE', role: 'staff' })).status,
      403
    )
  })

  await test('Payment CRUD persists, refreshes totals, and keeps subscription identity', async () => {
    const created = await request('payments', {
      method: 'POST',
      body: { memberId, amount: '800.25', method: 'Cash', date: iso(-1) }
    })
    assert.equal(created.status, 201)
    const id = created.body.id
    const read = await request('payments')
    assert.equal(read.body.records[0].amount, 800.25)
    assert.equal(read.body.records[0].type, 'Renewal')
    const updated = await request(`payments/${id}`, {
      method: 'PATCH',
      body: { memberId: adminId, amount: '900', method: 'GCash', date: iso(-1) }
    })
    assert.equal(updated.status, 200)
    assert.equal(project.payments[0].subscription_id, renewalSubscription)
    assert.equal(project.payments[0].method_id, 2)
    const database = await loadDatabase(supabase, ['accounts', 'payments'])
    assert.equal(
      buildReport('renewals', { members: database.accounts, ...database }).records.length,
      1
    )
    assert.equal((await request(`payments/${id}`, { method: 'DELETE' })).status, 200)
    assert.equal((await request('payments')).body.records.length, 0)
    assert.equal(project.subscriptions.length, 2)
    assert.equal((await request(`payments/${id}`, { method: 'DELETE' })).status, 404)
    assert.equal(
      (await request(`payments/${id}`, { method: 'PATCH', body: { amount: 1, method: 'Cash' } }))
        .status,
      404
    )
  })

  await test('Invalid payments, dates, and unknown members cannot write records', async () => {
    for (const amount of [0, -1, 'bad', '', true, '1.001', 100000001]) {
      assert.equal(
        (await request('payments', { method: 'POST', body: { memberId, amount, method: 'Cash' } }))
          .status,
        400
      )
    }
    for (const extra of [
      { method: 'Card' },
      { memberId: adminId },
      { date: 'invalid' },
      { date: iso(1) }
    ]) {
      assert.equal(
        (
          await request('payments', {
            method: 'POST',
            body: { memberId, amount: 800, method: 'Cash', ...extra }
          })
        ).status,
        400
      )
    }
    assert.equal(project.payments.length, 0)
  })

  await test('Attendance CRUD preserves scanner provenance and hides scanner credentials', async () => {
    const read = await request('attendance')
    assert.equal(read.body.records[0].qrTokenId, undefined)
    assert.equal(read.body.records[0].scannerRequestId, undefined)
    assert.equal(
      (await request(`attendance/${scannerRecordId}`, { method: 'PATCH', body: { date: iso(-2) } }))
        .status,
      200
    )
    assert.equal(project.attendance_logs[0].entry_type, 'ESP32-CAM')
    assert.equal(project.attendance_logs[0].request_id, 'private-request')
    const created = await request('attendance', {
      method: 'POST',
      body: { memberId, date: iso(-1) }
    })
    assert.equal(created.status, 201)
    assert.equal((await request('attendance')).body.records.length, 2)
    assert.equal((await request(`attendance/${created.body.id}`, { method: 'DELETE' })).status, 200)
    assert.equal(
      (await request('attendance', { method: 'POST', body: { memberId, date: iso(-90) } })).status,
      400
    )
  })

  await test('Maintenance CRUD refreshes log reports without deleting equipment', async () => {
    assert.equal(
      (await request('maintenance', { method: 'POST', body: { equipmentId, note: ' ' } })).status,
      400
    )
    const created = await request('maintenance', {
      method: 'POST',
      body: { equipmentId, note: 'Belt inspected', date: iso(-1) }
    })
    assert.equal(created.status, 201)
    assert.equal(
      (
        await request(`maintenance/${created.body.id}`, {
          method: 'PATCH',
          body: { equipmentId, note: 'Belt replaced' }
        })
      ).status,
      200
    )
    const database = await loadDatabase(supabase, ['maintenance', 'equipment'])
    const report = buildReport('maintenance', { members: [], ...database })
    assert.equal(report.rows[0][1], 'Belt replaced')
    assert.equal(report.records[0].id, created.body.id)
    assert.equal(
      (await request(`maintenance/${created.body.id}`, { method: 'DELETE' })).status,
      200
    )
    assert.equal(project.gym_equipment.length, 1)
  })

  await test('Database failures do not report a successful save', async () => {
    failNextWrite = true
    const result = await request('payments', {
      method: 'POST',
      body: { memberId, amount: 800, method: 'Cash' }
    })
    assert.equal(result.status, 500)
    assert.equal(project.payments.length, 0)
  })

  await test('Charts use Manila calendar boundaries, ignore future/invalid data, and sum real amounts', () => {
    const now = new Date('2026-10-16T01:00:00Z')
    const records = [
      { date: '2026-10-15T15:59:00Z', amount: 100 },
      { date: '2026-10-15T16:01:00Z', amount: 250.5 },
      { date: 'invalid', amount: 100 },
      { date: '2026-10-17T00:00:00Z', amount: 900 }
    ]
    const week = activityBuckets(records, 'week', 'attendance', now)
    assert.equal(week.at(-1).value, 1)
    assert.equal(week.at(-2).value, 1)
    assert.equal(
      week.reduce((sum, row) => sum + row.value, 0),
      2
    )
    assert.equal(activityBuckets(records, 'months', 'revenue', now).at(-1).value, 350.5)
  })

  await test('Branded emails escape input and embed a real PNG with a text fallback', async () => {
    const email = welcomeEmail({
      name: '<script>alert(1)</script>',
      email: 'test@example.test',
      temporaryPassword: 'private-fixture',
      loginUrl: 'https://fitpulse.test'
    })
    assert.ok(email.html.includes('&lt;script&gt;'))
    assert.ok(!email.html.includes('<script>'))
    assert.ok(email.text.includes('private-fixture'))
    const logo = await readFile(email.attachments[0].path)
    assert.deepEqual([...logo.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
    const transport = nodemailer.createTransport({ streamTransport: true, buffer: true })
    const result = await transport.sendMail({
      from: 'test@fitpulse.test',
      to: 'nobody@example.test',
      ...email
    })
    const mime = result.message.toString()
    assert.ok(mime.includes('Content-ID: <fitpulse-brand>'))
    assert.ok(mime.includes('Content-Type: image/png'))
    assert.ok(mime.includes('multipart/alternative'))
    assert.ok(
      expiryEmail({
        name: 'Test',
        plan: 'Monthly',
        expiryDate: 'Oct 16, 2026',
        expired: true,
        loginUrl: 'https://fitpulse.test'
      }).text.includes('Oct 16, 2026')
    )
    assert.throws(() => recoveryEmail({ name: 'Test', recoveryUrl: 'javascript:alert(1)' }))
    transport.close()
  })

  await test('Recovery uses Supabase one-time links, branded SMTP delivery, and provider fallback', async () => {
    let delivered
    const parameters = {
      email: 'member@example.test',
      name: 'Test Member',
      redirectTo: 'https://fitpulse.test/reset-password',
      from: 'FitPulse <test@fitpulse.test>'
    }
    const supabaseAdmin = {
      auth: {
        admin: {
          generateLink: async (input) => {
            assert.deepEqual(input, {
              type: 'recovery',
              email: parameters.email,
              options: { redirectTo: parameters.redirectTo }
            })
            return {
              data: {
                properties: {
                  action_link:
                    'https://isolated-project.test/auth/v1/verify?token=fixture&type=recovery'
                }
              },
              error: null
            }
          }
        }
      }
    }
    await sendPasswordRecovery({
      ...parameters,
      supabaseAdmin,
      mailer: {
        sendMail: async (email) => {
          delivered = email
        }
      }
    })
    assert.equal(delivered.to, parameters.email)
    assert.ok(delivered.html.includes('cid:fitpulse-brand'))
    assert.ok(delivered.text.includes('token=fixture'))
    let fallback = false
    await sendPasswordRecovery({
      ...parameters,
      supabaseAuth: {
        auth: {
          resetPasswordForEmail: async () => {
            fallback = true
            return { error: null }
          }
        }
      }
    })
    assert.equal(fallback, true)
    await assert.rejects(
      sendPasswordRecovery({
        ...parameters,
        mailer: {},
        supabaseAdmin: {
          auth: {
            admin: {
              generateLink: async () => ({ data: null, error: new Error('Provider unavailable') })
            }
          }
        }
      }),
      /Provider unavailable/
    )
  })
} finally {
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
}
