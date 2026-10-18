// Real FitPulse API + real Supabase SDK against a fully isolated provider fixture.
// The fixture blocks external requests and .env reads. No real passwords change.
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { once } from 'node:events'
import { test } from 'node:test'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'

const providerOrigin = 'https://login-fixture.test'
const now = Date.now()
const iso = (days) => new Date(now + days * 86400000).toISOString()
const originalFetch = globalThis.fetch
const originalReadFileSync = fs.readFileSync
const originalCreateTransport = nodemailer.createTransport
const roles = [
  { role_id: 1, role_name: 'admin' },
  { role_id: 2, role_name: 'member' },
  { role_id: 3, role_name: 'staff' }
]
const credentials = new Map()
const tokens = new Map()
const recoveryLinks = new Map()
const sentEmails = []
const project = {
  roles,
  users: [],
  subscriptions: [],
  membership_plans: [
    { plan_id: 1, plan_name: 'Unlimited Monthly', price: 800, duration_days: 30, is_active: true }
  ],
  payment_methods: [{ method_id: 1, method_name: 'Cash' }],
  payments: [],
  attendance_logs: [],
  face_enrollments: [],
  gym_equipment: [],
  gym_maintenance: [],
  gym_settings: []
}
function account(email, role, password = 'Fixture-before-reset-123!') {
  const user = {
    id: crypto.randomUUID(),
    email,
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    email_confirmed_at: iso(-30)
  }
  credentials.set(email, { user, password })
  const profile = {
    id: crypto.randomUUID(),
    auth_user_id: user.id,
    role_id: roles.find((row) => row.role_name === role).role_id,
    name: `Fixture ${role}`,
    email,
    status: 'active',
    auth_version: 0,
    created_at: iso(-30)
  }
  project.users.push(profile)
  if (role === 'member')
    project.subscriptions.push({
      subscription_id: crypto.randomUUID(),
      user_id: profile.id,
      plan_id: 1,
      start_date: iso(-10),
      end_date: iso(20),
      created_at: iso(-10)
    })
  return profile
}
const administrator = account('admin@fitpulse.com', 'admin')
const member = account('member@fitpulse.com', 'member')
const staff = account('staff@fixture.test', 'staff')
const otherMember = account('another-member@fixture.test', 'member')
project.attendance_logs.push({
  attendance_id: crypto.randomUUID(),
  user_id: member.id,
  member_name: member.name,
  check_in_time: iso(-1),
  entry_type: 'Staff'
})
project.payments.push({
  payment_id: crypto.randomUUID(),
  subscription_id: project.subscriptions[0].subscription_id,
  method_id: 1,
  amount_paid: 800,
  created_at: iso(-1)
})
function session(user, method = 'password') {
  const accessToken = jwt.sign(
    { sub: user.id, amr: [{ method }] },
    'isolated-provider-signing-key',
    { expiresIn: '1h' }
  )
  tokens.set(accessToken, { user, method })
  return {
    access_token: accessToken,
    refresh_token: crypto.randomUUID(),
    expires_in: 3600,
    token_type: 'bearer',
    user
  }
}
const response = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'X-Supabase-Api-Version': '2024-01-01' }
  })
const providerError = (code, status = 400) =>
  response({ code, error_code: code, msg: 'Synthetic provider failure.' }, status)
let providerFailure = null
let apiOrigin = ''

Object.assign(process.env, {
  PORT: '0',
  NODE_ENV: 'development',
  SUPABASE_URL: providerOrigin,
  SUPABASE_PUBLISHABLE_KEY: 'fixture-publishable-key',
  SUPABASE_SECRET_KEY: 'fixture-admin-key',
  JWT_SECRET: 'isolated-login-regression-secret',
  FACE_LOGIN_ENABLED: 'true',
  FACE_ENCRYPTION_KEY: 'ab'.repeat(32),
  FACE_MATCH_THRESHOLD: '0.5',
  SMTP_HOST: 'smtp.fixture.test',
  SMTP_USER: 'fixture',
  SMTP_PASS: 'fixture',
  SMTP_FROM: 'FitPulse <no-reply@fixture.test>',
  CLIENT_URL: 'https://app.fixture.test',
  ADMIN_PASSWORD: 'Fixture-before-reset-123!',
  SCANNER_API_KEY: '',
  SCANNER_DEVICE_ID: ''
})
fs.readFileSync = function (file, ...options) {
  if (path.resolve(String(file)) === path.resolve('.env')) return ''
  return originalReadFileSync.call(this, file, ...options)
}
nodemailer.createTransport = () => ({
  sendMail: async (mail) => {
    sentEmails.push(mail)
    return { messageId: 'fixture' }
  }
})

globalThis.fetch = async (input, options = {}) => {
  const url = new URL(String(input))
  if (apiOrigin && url.origin === apiOrigin) return originalFetch(input, options)
  assert.equal(url.origin, providerOrigin, 'External network requests are blocked in this test.')
  const method = options.method || 'GET'
  const headers = new Headers(options.headers)
  const body = options.body ? JSON.parse(options.body) : {}
  if (url.pathname === '/auth/v1/token') {
    assert.equal(headers.get('apikey'), 'fixture-publishable-key')
    if (providerFailure) return providerError(providerFailure.code, providerFailure.status)
    const saved = credentials.get(body.email)
    if (!saved || body.password !== saved.password) return providerError('invalid_credentials')
    if (!saved.user.email_confirmed_at) return providerError('email_not_confirmed')
    return response(session(saved.user))
  }
  if (url.pathname === '/auth/v1/user') {
    const saved = tokens.get(headers.get('authorization')?.replace(/^Bearer\s+/i, ''))
    return saved ? response(saved.user) : providerError('bad_jwt', 401)
  }
  if (url.pathname === '/auth/v1/admin/generate_link') {
    const saved = credentials.get(body.email)
    if (!saved) return providerError('user_not_found', 404)
    const token = crypto.randomUUID()
    const redirectTo = url.searchParams.get('redirect_to') || body.redirect_to || body.redirectTo
    const actionLink = `${providerOrigin}/auth/v1/verify?token=${token}&type=recovery&redirect_to=${encodeURIComponent(redirectTo)}`
    recoveryLinks.set(token, { user: saved.user, redirectTo })
    return response({
      ...saved.user,
      action_link: actionLink,
      hashed_token: token,
      redirect_to: redirectTo,
      verification_type: 'recovery'
    })
  }
  if (url.pathname === '/auth/v1/verify') {
    const link = recoveryLinks.get(url.searchParams.get('token'))
    if (!link) return providerError('otp_expired', 403)
    recoveryLinks.delete(url.searchParams.get('token'))
    const verified = session(link.user, 'recovery')
    const redirect = `${link.redirectTo}#access_token=${verified.access_token}&refresh_token=${verified.refresh_token}&type=recovery`
    return new Response(null, { status: 302, headers: { Location: redirect } })
  }
  if (url.pathname.startsWith('/auth/v1/admin/users/')) {
    const saved = [...credentials.values()].find(
      ({ user }) => user.id === url.pathname.split('/').pop()
    )
    if (!saved) return providerError('user_not_found', 404)
    if (method === 'PUT' && body.password) saved.password = body.password
    return response(saved.user)
  }
  if (url.pathname.startsWith('/rest/v1/')) {
    assert.equal(headers.get('apikey'), 'fixture-admin-key')
    const table = url.pathname.split('/').pop()
    assert.ok(Object.hasOwn(project, table), `Unexpected table: ${table}`)
    const matches = (row) =>
      [...url.searchParams].every(([key, value]) => {
        if (value.startsWith('eq.')) return String(row[key]) === value.slice(3)
        if (value.startsWith('ilike.'))
          return String(row[key]).toLowerCase() === value.slice(6).toLowerCase()
        return true
      })
    let rows = project[table].filter(matches)
    if (method === 'PATCH') rows.forEach((row) => Object.assign(row, body))
    if (method === 'POST') {
      const key = url.searchParams.get('on_conflict') || 'id'
      rows = Array.isArray(body) ? body : [body]
      for (const row of rows) {
        const existing = project[table].find((item) => item[key] === row[key])
        if (existing) Object.assign(existing, row)
        else project[table].push(structuredClone(row))
      }
    }
    return response(headers.get('accept')?.includes('vnd.pgrst.object') ? rows[0] || null : rows)
  }
  throw new Error(`Unexpected fixture request: ${method} ${url.pathname}`)
}

let server
try {
  const { serverReady } = await import('../server/server.js')
  server = await serverReady
  if (!server.listening) await once(server, 'listening')
  apiOrigin = `http://127.0.0.1:${server.address().port}`
  let sequence = 0
  const request = async (route, body, token) => {
    const result = await fetch(
      `${apiOrigin}/api${route}${route.includes('?') ? '&' : '?'}fixture=${++sequence}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
      }
    )
    return { status: result.status, body: await result.json() }
  }
  const login = (email, password) => request('/auth/login', { email, password })

  await test('Admin, member, staff, and another member can sign in with their own credentials', async () => {
    for (const account of [administrator, member, staff, otherMember]) {
      const result = await login(account.email, credentials.get(account.email).password)
      assert.equal(result.status, 200)
      assert.equal(result.body.user.id, account.id)
      assert.ok(result.body.token)
    }
  })
  await test('Wrong passwords are rejected without weakening authentication', async () => {
    const result = await login(member.email, 'wrong-fixture-password')
    assert.equal(result.status, 401)
    assert.equal(result.body.code, 'INVALID_CREDENTIALS')
    assert.equal(result.body.token, undefined)
  })
  await test('Email normalization preserves the exact password, including significant spaces', async () => {
    const saved = credentials.get(staff.email)
    const previousPassword = saved.password
    saved.password = '  Case-sensitive-Fixture-Password!  '
    const result = await login(`  ${staff.email.toUpperCase()}  `, saved.password)
    assert.equal(result.status, 200)
    assert.equal(result.body.user.id, staff.id)
    assert.equal((await login(staff.email, saved.password.trim())).status, 401)
    saved.password = previousPassword
  })
  await test('Provider outages, invalid API keys, and rate limits are not reported as bad passwords', async () => {
    for (const failure of [
      { code: 'unexpected_failure', status: 500, expected: 503 },
      { code: 'bad_jwt', status: 401, expected: 503 },
      { code: 'over_request_rate_limit', status: 429, expected: 429 }
    ]) {
      providerFailure = failure
      const result = await login(member.email, credentials.get(member.email).password)
      assert.equal(result.status, failure.expected)
      assert.ok(!result.body.message.includes('Invalid email or password'))
      assert.equal(result.body.token, undefined)
    }
    providerFailure = null
  })
  await test('Email confirmation problems retain a specific actionable error', async () => {
    const saved = credentials.get(otherMember.email)
    const confirmedAt = saved.user.email_confirmed_at
    saved.user.email_confirmed_at = null
    const result = await login(otherMember.email, saved.password)
    assert.equal(result.status, 403)
    assert.equal(result.body.code, 'EMAIL_NOT_CONFIRMED')
    saved.user.email_confirmed_at = confirmedAt
  })
  await test('Email recovery changes the real login password, invalidates the old password, and preserves other accounts', async () => {
    const oldPassword = credentials.get(member.email).password
    const before = await login(member.email, oldPassword)
    const reset = await request('/auth/forgot-password', { email: member.email })
    assert.equal(reset.status, 200)
    const email = sentEmails.at(-1)
    assert.equal(email.to, member.email)
    assert.ok(email.html.includes('cid:fitpulse-brand'))
    const recoveryUrl = email.text.match(/Reset password: (\S+)/)[1]
    const clicked = await fetch(recoveryUrl)
    assert.equal(clicked.status, 302)
    const redirect = new URL(clicked.headers.get('location'))
    assert.equal(redirect.origin, 'https://app.fixture.test')
    const accessToken = new URLSearchParams(redirect.hash.slice(1)).get('access_token')
    const newPassword = 'Newly-reset-Fixture-password-456!'
    const updated = await request('/auth/reset-password', { password: newPassword }, accessToken)
    assert.equal(updated.status, 200)
    assert.equal((await login(member.email, oldPassword)).status, 401)
    const after = await login(member.email, newPassword)
    assert.equal(after.status, 200)
    assert.equal(after.body.user.id, member.id)
    assert.notEqual(before.body.token, after.body.token)
    const other = await login(otherMember.email, credentials.get(otherMember.email).password)
    assert.equal(other.status, 200)
    const oldSession = await originalFetch(`${apiOrigin}/api/me`, {
      headers: { Authorization: `Bearer ${before.body.token}` }
    })
    assert.equal(oldSession.status, 401)
  })
  await test('Changing a password in Settings also works on the next login', async () => {
    const oldPassword = credentials.get(otherMember.email).password
    const loggedIn = await login(otherMember.email, oldPassword)
    const password = 'Settings-fixture-password-789!'
    const changed = await request(
      '/profile/change-password',
      { currentPassword: oldPassword, password, confirmPassword: password },
      loggedIn.body.token
    )
    assert.equal(changed.status, 200)
    assert.equal((await login(otherMember.email, oldPassword)).status, 401)
    assert.equal((await login(otherMember.email, password)).status, 200)
  })
  await test('Concurrent sign-ins return the right account and keep the privileged key separate', async () => {
    const results = await Promise.all(
      [member, otherMember, administrator].map((account) =>
        login(account.email, credentials.get(account.email).password)
      )
    )
    assert.deepEqual(
      results.map((result) => result.body.user.id),
      [member.id, otherMember.id, administrator.id]
    )
    assert.ok(results.every((result) => result.status === 200))
  })
  await test('Face-enrolled members still receive a challenge before any application session', async () => {
    project.face_enrollments.push({
      enrollment_id: crypto.randomUUID(),
      user_id: member.id,
      status: 'active',
      created_at: iso(-1)
    })
    const result = await login(member.email, credentials.get(member.email).password)
    assert.equal(result.status, 200)
    assert.equal(result.body.requiresFaceVerification, true)
    assert.ok(result.body.challengeToken)
    assert.equal(result.body.token, undefined)
  })
} finally {
  if (server) {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
  globalThis.fetch = originalFetch
  fs.readFileSync = originalReadFileSync
  nodemailer.createTransport = originalCreateTransport
}
