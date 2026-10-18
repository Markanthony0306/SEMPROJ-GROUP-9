// Exercise the real API and Supabase SDK against an in-memory HTTP project.
// Run: node scripts/smoke-supabase-server.mjs. No real .env, cloud, or email is used.
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const port = 3998
const origin = `http://127.0.0.1:${port}`
const projectOrigin = 'https://supabase.test'
const scannerKey = 'isolated-cloud-scanner-key-at-least-32-characters'
const temporaryRoot = path.resolve(tmpdir())
const temporaryDirectory = await mkdtemp(path.join(temporaryRoot, 'fitpulse-cloud-smoke-'))
const dataFile = path.join(temporaryDirectory, 'data.json')
Object.assign(process.env, {
  PORT: String(port),
  NODE_ENV: 'development',
  ACCOUNT_PROVIDER: 'supabase',
  FACE_LOGIN_ENABLED: 'true',
  FACE_ENCRYPTION_KEY: 'ab'.repeat(32),
  ADMIN_IDENTITY_VERIFICATION: 'false',
  STRIPE_SECRET_KEY: '',
  ADMIN_IDENTITY_NAMES: '{}',
  SUPABASE_URL: projectOrigin,
  SUPABASE_PUBLISHABLE_KEY: 'fake-publishable-test-key',
  SUPABASE_SECRET_KEY: 'fake-secret-test-key',
  JWT_SECRET: 'isolated-fitpulse-session-signing-key',
  DATA_FILE: dataFile,
  AVATAR_DIR: path.join(temporaryDirectory, 'avatars'),
  SCANNER_API_KEY: scannerKey,
  SCANNER_DEVICE_ID: 'cloud-test-entrance',
  CLIENT_URL: 'http://127.0.0.1:5173',
  SMTP_HOST: '',
  SMTP_USER: '',
  SMTP_PASS: '',
  ADMIN_EMAIL: 'fixture-admin@fitpulse.test',
  ADMIN_PASSWORD: 'Fixture-admin-password-123'
})

const project = {
  users: [],
  profiles: [],
  faceEnrollments: [],
  roles: [
    { role_id: 1, role_name: 'admin' },
    { role_id: 2, role_name: 'member' },
    { role_id: 5, role_name: 'staff' }
  ],
  accessTokens: new Map(),
  recoveryTokens: new Map(),
  requests: [],
  emails: 0
}
const results = []
let cloudSignInBarrier
const originalFetch = globalThis.fetch
const originalReadFileSync = fs.readFileSync
const clone = (value) => structuredClone(value)

function response(payload, status = 200, headers = {}) {
  return new Response(status === 204 ? null : JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Supabase-Api-Version': '2024-01-01',
      ...headers
    }
  })
}
const authError = (code) =>
  response({ code, error_code: code, msg: 'Fixture authentication denied.' }, 400)
function publicAuthUser(user) {
  const { passwordHash, ...safe } = user
  return clone(safe)
}
function providerSession(user, { method = 'password', sessionId = crypto.randomUUID() } = {}) {
  const accessToken = jwt.sign(
    { sub: user.id, session_id: sessionId, amr: [{ method }], role: 'authenticated' },
    'fake-provider-signing-key',
    { expiresIn: '1h', jwtid: crypto.randomUUID() }
  )
  project.accessTokens.set(accessToken, user.id)
  return {
    access_token: accessToken,
    refresh_token: crypto.randomUUID(),
    token_type: 'bearer',
    expires_in: 3600,
    user: publicAuthUser(user)
  }
}
async function addCloudAccount({
  id = crypto.randomUUID(),
  email,
  password,
  role = 'member',
  name = 'Cloud fixture'
}) {
  const user = {
    id,
    email,
    passwordHash: await bcrypt.hash(password, 4),
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { fitpulse_role: role },
    user_metadata: { name },
    created_at: new Date().toISOString()
  }
  project.users.push(user)
  project.profiles.push({
    id,
    auth_user_id: id,
    name,
    email,
    member_code: role === 'member' ? 'FP-CLOUD1' : null,
    role_id: role === 'admin' ? 1 : role === 'staff' ? 5 : 2,
    phone_number: null,
    status: 'active',
    must_change_password: false
  })
  return user
}

async function fakeProjectFetch(url, options) {
  const method = options.method || 'GET'
  const headers = new Headers(options.headers)
  const body = options.body ? JSON.parse(options.body) : {}
  const pathname = url.pathname
  project.requests.push({ method, pathname, key: headers.get('apikey') })
  if (pathname.startsWith('/rest/v1/')) {
    assert.equal(headers.get('apikey'), process.env.SUPABASE_SECRET_KEY)
    assert.equal(headers.get('Authorization'), `Bearer ${process.env.SUPABASE_SECRET_KEY}`)
    const table = pathname.split('/').at(-1)
    const collection =
      table === 'users'
        ? project.profiles
        : table === 'roles'
          ? project.roles
          : table === 'face_enrollments'
            ? project.faceEnrollments
            : null
    if (!collection) return response({ code: '42P01', message: 'Unknown fixture table.' }, 404)
    let matches = collection.filter((row) =>
      [...url.searchParams].every(([column, filter]) => {
        if (['select', 'order', 'limit'].includes(column)) return true
        if (filter.startsWith('eq.')) return String(row[column]) === filter.slice(3)
        if (filter.startsWith('ilike.')) {
          const literal = filter.slice(6).replace(/\\([\\%_])/g, '$1')
          return String(row[column] || '').toLowerCase() === literal.toLowerCase()
        }
        throw new Error(`Unsupported fixture filter: ${column}`)
      })
    )
    if (method === 'POST') {
      const created =
        table === 'face_enrollments'
          ? {
              enrollment_id: crypto.randomUUID(),
              created_at: new Date().toISOString(),
              ...clone(body)
            }
          : { member_code: 'FP-CREATED1', ...clone(body) }
      collection.push(created)
      matches = [created]
    } else if (method === 'PATCH') {
      matches.forEach((row) => Object.assign(row, clone(body)))
    } else if (method === 'DELETE') {
      for (let index = collection.length - 1; index >= 0; index -= 1) {
        if (matches.includes(collection[index])) collection.splice(index, 1)
      }
      return response(null, 204)
    } else if (method !== 'GET') {
      throw new Error(`Unsupported fixture method: ${method}`)
    }
    const single = headers.get('Accept')?.includes('application/vnd.pgrst.object+json')
    if (single && matches.length !== 1)
      return response(
        { code: 'PGRST116', details: `${matches.length} rows`, message: 'Expected one row.' },
        406
      )
    return response(clone(single ? matches[0] : matches))
  }
  if (pathname === '/auth/v1/admin/users' && method === 'GET') {
    const page = Number(url.searchParams.get('page') || 1)
    const perPage = Number(url.searchParams.get('per_page') || 500)
    return response({
      users: project.users.slice((page - 1) * perPage, page * perPage).map(publicAuthUser),
      aud: 'authenticated'
    })
  }
  if (pathname === '/auth/v1/admin/users' && method === 'POST') {
    if (project.users.some((user) => user.id === body.id || user.email === body.email))
      return authError('email_exists')
    const { password, password_hash: passwordHash, ...safe } = body
    const user = {
      ...safe,
      id: body.id || crypto.randomUUID(),
      passwordHash: passwordHash || (await bcrypt.hash(password, 4)),
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString()
    }
    project.users.push(user)
    return response(publicAuthUser(user))
  }
  if (pathname.startsWith('/auth/v1/admin/users/')) {
    const id = pathname.split('/').at(-1)
    const user = project.users.find((entry) => entry.id === id)
    if (!user) return authError('user_not_found')
    if (method === 'PUT') {
      const { password, ...safe } = body
      Object.assign(user, clone(safe))
      if (password !== undefined) user.passwordHash = await bcrypt.hash(password, 4)
    } else if (method === 'DELETE') {
      project.users = project.users.filter((entry) => entry.id !== id)
    } else if (method !== 'GET') throw new Error('Unsupported fixture admin method.')
    return response(publicAuthUser(user))
  }
  if (pathname === '/auth/v1/token' && method === 'POST') {
    const barrier = cloudSignInBarrier
    if (barrier?.email === body.email) {
      barrier.notifyEntered()
      await barrier.released
    }
    const user = project.users.find(
      (entry) => entry.email?.toLowerCase() === body.email?.toLowerCase()
    )
    if (!user || !(await bcrypt.compare(body.password || '', user.passwordHash)))
      return authError('invalid_credentials')
    return response(providerSession(user))
  }
  if (pathname === '/auth/v1/verify' && method === 'POST') {
    const id = body.type === 'recovery' && project.recoveryTokens.get(body.token_hash)
    const user = project.users.find((entry) => entry.id === id)
    if (!user) return authError('otp_expired')
    project.recoveryTokens.delete(body.token_hash)
    return response(providerSession(user, { method: 'recovery' }))
  }
  if (pathname === '/auth/v1/user' && method === 'GET') {
    const token = headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
    const user = project.users.find((entry) => entry.id === project.accessTokens.get(token))
    return user ? response(publicAuthUser(user)) : authError('bad_jwt')
  }
  if (pathname === '/auth/v1/recover' && method === 'POST') {
    project.emails += 1 // SDK delivery is simulated; no email ever leaves this process.
    return response({})
  }
  throw new Error(`Unsupported fake Supabase route: ${method} ${pathname}`)
}

globalThis.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url)
  if (url.origin === projectOrigin) return fakeProjectFetch(url, options)
  if (url.origin === origin) return originalFetch(input, options)
  throw new Error('This test blocks all other network origins.')
}
// Mask only .env reads during the server import; real filesystem records stay untouched.
fs.readFileSync = function (file, ...options) {
  if (typeof file === 'string' && path.basename(file) === '.env') return ''
  return originalReadFileSync.call(this, file, ...options)
}

async function check(name, action) {
  try {
    await action()
    results.push(true)
    console.log(`PASS ${name}`)
  } catch (error) {
    results.push(false)
    console.error(`FAIL ${name}: ${error.message}`)
  }
}
async function request(method, route, { token, body, scanner = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (scanner) headers['X-Scanner-Key'] = scannerKey
  const result = await fetch(`${origin}/api${route}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000)
  })
  return { status: result.status, payload: await result.json() }
}
let signInSequence = 0
const signIn = (email, password) =>
  request('POST', `/auth/login?fixture=${++signInSequence}`, { body: { email, password } })
const readDatabase = async () => JSON.parse(await readFile(dataFile, 'utf8'))
async function changeLocalAccount(id, changes) {
  const database = await readDatabase()
  Object.assign(
    database.accounts.find((account) => account.id === id),
    changes
  )
  await writeFile(dataFile, JSON.stringify(database))
}
const scannerBody = (qrToken) => ({
  qrToken,
  deviceId: 'cloud-test-entrance',
  requestId: crypto.randomUUID()
})

try {
  const administratorId = crypto.randomUUID()
  const staffId = crypto.randomUUID()
  const collisionId = crypto.randomUUID()
  const collisionPassword = 'Existing-local-password-123'
  const cloudCollisionPassword = 'Existing-cloud-password-456'
  const collisionEmail = 'collision@fitpulse.test'
  const linkingRaceId = crypto.randomUUID()
  const linkingRaceEmail = 'linking-race@fitpulse.test'
  const linkingRacePassword = 'Race-local-password-123'
  const linkingRaceCloudPassword = 'Race-cloud-password-456'
  const start = new Date().toISOString()
  await writeFile(
    dataFile,
    JSON.stringify({
      accounts: [
        {
          id: administratorId,
          name: 'Fixture Admin',
          email: process.env.ADMIN_EMAIL,
          role: 'admin',
          status: 'active',
          passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 4),
          must_change_password: false
        },
        {
          id: staffId,
          name: 'Fixture Staff',
          email: 'fixture-staff@fitpulse.test',
          role: 'staff',
          status: 'active',
          passwordHash: await bcrypt.hash('Fixture-staff-password-123', 4),
          must_change_password: false
        },
        {
          id: collisionId,
          name: 'Collision Member',
          email: collisionEmail,
          role: 'member',
          status: 'active',
          plan: 'Weekly',
          joined: start,
          membershipStart: start,
          passwordHash: await bcrypt.hash(collisionPassword, 4),
          must_change_password: false
        },
        {
          id: linkingRaceId,
          name: 'Linking Race Member',
          email: linkingRaceEmail,
          role: 'member',
          status: 'active',
          plan: 'Weekly',
          joined: start,
          membershipStart: start,
          passwordHash: await bcrypt.hash(linkingRacePassword, 4),
          must_change_password: false
        }
      ],
      attendance: [],
      payments: []
    })
  )
  const collisionUser = await addCloudAccount({
    email: collisionEmail,
    password: cloudCollisionPassword
  })
  const linkingRaceUser = await addCloudAccount({
    email: linkingRaceEmail,
    password: linkingRaceCloudPassword
  })
  await addCloudAccount({ email: 'member@fitpulse.com', password: 'Fixture-only-demo-password' })
  await import('../server/server.js')
  fs.readFileSync = originalReadFileSync
  let ready = false
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      if ((await fetch(`${origin}/api/me`)).status === 401) {
        ready = true
        break
      }
    } catch {
      /* Waiting for the isolated server to listen. */
    }
    await sleep(100)
  }
  assert.equal(ready, true, 'Isolated cloud API did not become ready.')

  const admin = await signIn(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD)
  await check('Existing administrator imports its hash and retains API access', async () => {
    assert.equal(admin.status, 200)
    assert.equal(admin.payload.user.id, administratorId)
    assert.equal((await request('GET', '/members', { token: admin.payload.token })).status, 200)
    assert.equal(
      await bcrypt.compare(
        process.env.ADMIN_PASSWORD,
        project.users.find((user) => user.id === administratorId).passwordHash
      ),
      true
    )
  })
  const staff = await signIn('fixture-staff@fitpulse.test', 'Fixture-staff-password-123')
  await check(
    'Staff role lookup preserves staff access without administrator promotion',
    async () => {
      assert.equal(staff.status, 200)
      assert.equal(staff.payload.user.role, 'staff')
      assert.equal(project.profiles.find((profile) => profile.id === staffId).role_id, 5)
      assert.equal((await request('GET', '/members', { token: staff.payload.token })).status, 200)
    }
  )
  const created = await request('POST', '/admin/members', {
    token: admin.payload.token,
    body: {
      name: 'Created Cloud Member',
      email: 'created-member@fitpulse.test',
      phone: '09123456789',
      plan: 'Weekly',
      recordPayment: false,
      role: 'admin',
      must_change_password: false
    }
  })
  const memberId = created.payload.member?.id
  const cloudMember = project.users.find((user) => user.id === memberId)
  const cloudProfile = project.profiles.find((profile) => profile.id === memberId)
  await check('Member creation wires Auth and profile with hashed one-time password', async () => {
    assert.equal(created.status, 201)
    assert.match(created.payload.temporaryPassword, /^[A-Za-z0-9_-]{24}$/)
    assert.equal(created.payload.member.role, 'member')
    assert.equal(created.payload.member.must_change_password, true)
    assert.equal(created.payload.emailSent, false)
    assert.equal(cloudProfile.role_id, 2)
    assert.equal(cloudProfile.must_change_password, true)
    assert.equal(
      await bcrypt.compare(created.payload.temporaryPassword, cloudMember.passwordHash),
      true
    )
    assert.equal(
      JSON.stringify(await readDatabase()).includes(created.payload.temporaryPassword),
      false
    )
  })
  await check('Weekly timing and short member code survive cloud provisioning', async () => {
    assert.equal(
      Date.parse(created.payload.member.valid_until) -
        Date.parse(created.payload.member.membershipStart),
      7 * 86400000
    )
    assert.equal(created.payload.member.memberCode, cloudProfile.member_code)
    assert.match(created.payload.member.memberCode, /^FP-/)
  })
  const temporarySession = await signIn(
    'created-member@fitpulse.test',
    created.payload.temporaryPassword
  )
  await check('Temporary-password login returns the required change flag', async () => {
    assert.equal(temporarySession.status, 200)
    assert.equal(temporarySession.payload.user.must_change_password, true)
    assert.equal(
      (await request('GET', '/me', { token: temporarySession.payload.token })).status,
      200
    )
  })
  await check('First-login API gate blocks member QR and attendance', async () => {
    for (const route of ['/me/qr', '/attendance']) {
      const result = await request('GET', route, { token: temporarySession.payload.token })
      assert.equal(result.status, 403)
      assert.equal(result.payload.code, 'PASSWORD_CHANGE_REQUIRED')
    }
  })
  const localMember = (await readDatabase()).accounts.find((account) => account.id === memberId)
  await check('Entrance scanner checks cloud first-login state on the server', async () => {
    const result = await request('POST', '/scanner/check-in', {
      scanner: true,
      body: scannerBody(localMember.qr_token)
    })
    assert.equal(result.status, 403)
    assert.equal(result.payload.code, 'PASSWORD_CHANGE_REQUIRED')
  })
  const memberPassword = 'New-member-password-789'
  const changed = await request('POST', '/profile/change-password', {
    token: temporarySession.payload.token,
    body: {
      currentPassword: created.payload.temporaryPassword,
      password: memberPassword,
      confirmPassword: memberPassword
    }
  })
  const memberToken = changed.payload.session?.token
  await check(
    'Password change updates cloud/local hashes and clears both first-login flags',
    async () => {
      assert.equal(changed.status, 200)
      assert.equal(changed.payload.session.user.must_change_password, false)
      assert.equal(cloudProfile.must_change_password, false)
      assert.equal(await bcrypt.compare(memberPassword, cloudMember.passwordHash), true)
      const saved = (await readDatabase()).accounts.find((account) => account.id === memberId)
      assert.equal(saved.must_change_password, false)
      assert.equal(await bcrypt.compare(memberPassword, saved.passwordHash), true)
      assert.equal(
        (await request('GET', '/me', { token: temporarySession.payload.token })).status,
        401
      )
    }
  )
  await check('Member role cannot use administrator member-management routes', async () => {
    assert.equal((await request('GET', '/members', { token: memberToken })).status, 403)
    assert.equal(
      (await request('POST', '/admin/members', { token: memberToken, body: {} })).status,
      403
    )
  })
  const qr = await request('GET', '/me/qr', { token: memberToken })
  await check('Changed-password member can view its existing membership QR', async () => {
    assert.equal(qr.status, 200)
    assert.equal(qr.payload.status, 'Active')
    assert.equal(qr.payload.qrToken, localMember.qr_token)
    assert.equal(qr.payload.timeZone, 'Asia/Manila')
  })
  await check(
    'Public account responses never contain hashes or provider mapping secrets',
    async () => {
      const serialized = JSON.stringify(
        (await request('GET', '/members', { token: admin.payload.token })).payload
      )
      for (const forbidden of [
        'passwordHash',
        'supabaseAuthId',
        'supabaseProfileId',
        'qr_token',
        'fake-secret-test-key'
      ])
        assert.equal(serialized.includes(forbidden), false)
    }
  )
  const retainedCloudHash = cloudMember.passwordHash
  cloudMember.passwordHash = await bcrypt.hash('Cloud-only-password-111', 4)
  await check(
    'Linked cloud password rejection never falls back to a matching local hash',
    async () => {
      assert.equal((await signIn('created-member@fitpulse.test', memberPassword)).status, 401)
    }
  )
  cloudMember.passwordHash = retainedCloudHash
  cloudProfile.status = 'suspended'
  await check(
    'Suspended cloud account rejects login and existing authenticated sessions',
    async () => {
      assert.equal((await signIn('created-member@fitpulse.test', memberPassword)).status, 403)
      assert.equal((await request('GET', '/me', { token: memberToken })).status, 403)
    }
  )
  await check('Admin listing remains readable when a linked member is suspended', async () => {
    const result = await request('GET', '/members', { token: admin.payload.token })
    assert.equal(result.status, 200)
    assert.equal(
      result.payload.members.find((member) => member.id === memberId).status,
      'suspended'
    )
  })
  cloudProfile.status = 'active'
  await changeLocalAccount(memberId, { status: 'inactive' })
  await check(
    'Active cloud profile cannot reactivate an inactive local QR membership',
    async () => {
      const result = await request('POST', '/scanner/check-in', {
        scanner: true,
        body: scannerBody(qr.payload.qrToken)
      })
      assert.equal(result.status, 403)
      assert.equal(result.payload.code, 'MEMBERSHIP_INACTIVE')
      assert.equal(
        (await request('GET', '/me/qr', { token: memberToken })).payload.status,
        'Inactive'
      )
    }
  )
  await changeLocalAccount(memberId, { status: 'active' })
  await check(
    'Eligible linked member scan records attendance against the original UUID',
    async () => {
      const result = await request('POST', '/scanner/check-in', {
        scanner: true,
        body: scannerBody(qr.payload.qrToken)
      })
      assert.equal(result.status, 201)
      assert.equal((await readDatabase()).attendance[0].memberId, memberId)
    }
  )
  const changedEmail = 'updated-member@fitpulse.test'
  await check(
    'Profile edit synchronizes cloud Auth, cloud profile and local contact data',
    async () => {
      const result = await request('PATCH', '/profile', {
        token: memberToken,
        body: { name: 'Updated Member', email: changedEmail, phone: '09987654321', role: 'admin' }
      })
      assert.equal(result.status, 200)
      assert.equal(result.payload.user.role, 'member')
      assert.equal(cloudMember.email, changedEmail)
      assert.equal(cloudProfile.email, changedEmail)
      assert.equal(cloudProfile.phone_number, '09987654321')
      assert.equal(
        (await readDatabase()).accounts.find((account) => account.id === memberId).email,
        changedEmail
      )
    }
  )
  await check('Forgot-password uses isolated SDK delivery with generic response', async () => {
    const result = await request('POST', '/auth/forgot-password', { body: { email: changedEmail } })
    assert.equal(result.status, 200)
    assert.equal(project.emails, 1)
    assert.equal(result.payload.token, undefined)
  })
  const tokenHash = crypto.randomUUID()
  project.recoveryTokens.set(tokenHash, memberId)
  const resetPassword = 'Recovery-hash-password-123'
  await check(
    'Fixed token-hash recovery changes both providers and invalidates FitPulse sessions',
    async () => {
      const result = await request('POST', '/auth/reset-password', {
        body: { tokenHash, password: resetPassword, confirmPassword: resetPassword }
      })
      assert.equal(result.status, 200)
      assert.equal(await bcrypt.compare(resetPassword, cloudMember.passwordHash), true)
      assert.equal((await request('GET', '/me', { token: memberToken })).status, 401)
      assert.equal(project.recoveryTokens.has(tokenHash), false)
    }
  )
  await check('Used recovery hash cannot change the password twice', async () => {
    const result = await request('POST', '/auth/reset-password', {
      body: { tokenHash, password: 'Replay-password-123' }
    })
    assert.equal(result.status, 400)
    assert.equal(await bcrypt.compare(resetPassword, cloudMember.passwordHash), true)
  })
  const recoverySessionId = crypto.randomUUID()
  const bearerRecovery = providerSession(cloudMember, {
    method: 'recovery',
    sessionId: recoverySessionId
  }).access_token
  const refreshedRecovery = providerSession(cloudMember, {
    method: 'recovery',
    sessionId: recoverySessionId
  }).access_token
  await check('Verified recovery bearer can reset the account once', async () => {
    const result = await request('POST', '/auth/reset-password', {
      token: bearerRecovery,
      body: { password: 'Recovery-bearer-password-456' }
    })
    assert.equal(result.status, 200)
  })
  await check(
    'Refreshed bearer from the same recovery session is rejected as a replay',
    async () => {
      const result = await request('POST', '/auth/reset-password', {
        token: refreshedRecovery,
        body: { password: 'Refreshed-replay-password-123' }
      })
      assert.equal(result.status, 400)
      assert.equal(
        await bcrypt.compare('Recovery-bearer-password-456', cloudMember.passwordHash),
        true
      )
    }
  )
  await check('Ordinary cloud sign-in bearer cannot perform password recovery', async () => {
    const ordinary = providerSession(cloudMember).access_token
    assert.equal(
      (
        await request('POST', '/auth/reset-password', {
          token: ordinary,
          body: { password: 'Invalid-reset-password-123' }
        })
      ).status,
      400
    )
  })
  await check('Cloud-only demo account is not authorized to sign in to FitPulse', async () => {
    assert.equal((await signIn('member@fitpulse.com', 'Fixture-only-demo-password')).status, 401)
  })
  const collisionHash = collisionUser.passwordHash
  const collision = await signIn(collisionEmail, collisionPassword)
  await check(
    'Existing cloud email collision preserves local access and remote password',
    async () => {
      assert.equal(collision.status, 200)
      assert.equal(collision.payload.user.id, collisionId)
      assert.equal(collisionUser.passwordHash, collisionHash)
      const saved = (await readDatabase()).accounts.find((account) => account.id === collisionId)
      assert.equal(saved.supabaseLinkPending, true)
      assert.equal(saved.supabaseAuthId, undefined)
      assert.equal((await request('GET', '/me', { token: collision.payload.token })).status, 200)
    }
  )
  const linked = await request('POST', '/profile/link-supabase', {
    token: collision.payload.token,
    body: { currentPassword: collisionPassword, cloudPassword: cloudCollisionPassword }
  })
  await check(
    'Explicit owner linking preserves local UUID and existing cloud credentials',
    async () => {
      assert.equal(linked.status, 200)
      assert.equal(linked.payload.session.user.id, collisionId)
      assert.equal(collisionUser.passwordHash, collisionHash)
      const saved = (await readDatabase()).accounts.find((account) => account.id === collisionId)
      assert.equal(saved.supabaseAuthId, collisionUser.id)
      assert.equal(saved.supabaseLinkPending, false)
      assert.equal((await request('GET', '/me', { token: collision.payload.token })).status, 401)
      assert.equal(
        (await request('GET', '/me', { token: linked.payload.session.token })).status,
        200
      )
    }
  )
  await check('Linked collision account now requires its verified cloud password', async () => {
    assert.equal((await signIn(collisionEmail, collisionPassword)).status, 401)
    assert.equal((await signIn(collisionEmail, cloudCollisionPassword)).status, 200)
  })
  await check('Real SDK exercised both provider interfaces with no real network', async () => {
    assert.equal(
      project.requests.some((request) => request.pathname === '/auth/v1/token'),
      true
    )
    assert.equal(
      project.requests.some(
        (request) => request.pathname === '/rest/v1/users' && request.method === 'PATCH'
      ),
      true
    )
    assert.equal(
      project.requests.some((request) => request.pathname === '/auth/v1/verify'),
      true
    )
  })
  await check('In-flight account linking rejects a concurrent local email change', async () => {
    const session = await signIn(linkingRaceEmail, linkingRacePassword)
    assert.equal(session.status, 200)
    const before = (await readDatabase()).accounts.find((account) => account.id === linkingRaceId)
    let notifyEntered
    let releaseSignIn
    const entered = new Promise((resolve) => {
      notifyEntered = resolve
    })
    const released = new Promise((resolve) => {
      releaseSignIn = resolve
    })
    cloudSignInBarrier = { email: linkingRaceEmail, notifyEntered, released }
    const linkingAttempt = request('POST', '/profile/link-supabase', {
      token: session.payload.token,
      body: {
        currentPassword: linkingRacePassword,
        cloudPassword: linkingRaceCloudPassword
      }
    })
    const editedEmail = 'edited-linking-race@fitpulse.test'
    let result
    try {
      await Promise.race([
        entered,
        sleep(3000).then(() => {
          throw new Error('Linking request did not reach the isolated Auth barrier.')
        })
      ])
      const edited = await request('PATCH', '/profile', {
        token: session.payload.token,
        body: { name: before.name, email: editedEmail, phone: '' }
      })
      assert.equal(edited.status, 200)
    } finally {
      cloudSignInBarrier = undefined
      releaseSignIn()
      result = await linkingAttempt
    }
    assert.equal(result.status, 409)
    const saved = (await readDatabase()).accounts.find((account) => account.id === linkingRaceId)
    assert.equal(saved.email, editedEmail)
    assert.equal(saved.passwordHash, before.passwordHash)
    assert.equal(saved.authVersion || 0, before.authVersion || 0)
    assert.equal(saved.supabaseAuthId, undefined)
    assert.equal(saved.supabaseProfileId, undefined)
    assert.equal(linkingRaceUser.email, linkingRaceEmail)
    assert.equal(await bcrypt.compare(linkingRaceCloudPassword, linkingRaceUser.passwordHash), true)
  })
  await check(
    'Login rate limits share a bucket across query, slash and case variations',
    async () => {
      // Ten earlier login attempts have used this IP's bucket. Run this last so
      // exhausting that bucket cannot hide failures in the account-flow checks.
      assert.equal(signInSequence, 10)
      for (const route of [
        '/auth/login',
        '/auth/login?attempt=eleven',
        '/auth/login/?attempt=twelve',
        '/AUTH/LOGIN?attempt=thirteen',
        '/Auth/Login/?attempt=fourteen'
      ]) {
        const result = await request('POST', route, {
          body: { email: 'unknown-account@fitpulse.test', password: 'Invalid-password-123' }
        })
        assert.equal(result.status, 429, `Rate limit was bypassed through ${route}`)
      }
    }
  )
  // Expire the exercised login throttle before testing the separate face flow.
  const originalNow = Date.now
  Date.now = () => originalNow() + 16 * 60 * 1000
  try {
    // Older local accounts use `user`; the cloud profile represents the same member role.
    await changeLocalAccount(memberId, { role: 'user' })
    const faceSignIn = () => signIn(changedEmail, 'Recovery-bearer-password-456')
    const faceMemberSession = await faceSignIn()
    const faceMemberToken = faceMemberSession.payload.token
    const faceDescriptor = Array(128).fill(0.1)
    await check(
      'Face enrollment requires consent, staff authorization, and encrypted storage',
      async () => {
        assert.equal(
          (
            await request('POST', `/admin/members/${memberId}/face-enrollment`, {
              token: faceMemberToken,
              body: { descriptor: faceDescriptor, consent: true, idChecked: true }
            })
          ).status,
          403
        )
        assert.equal(
          (
            await request('POST', `/admin/members/${memberId}/face-enrollment`, {
              token: admin.payload.token,
              body: { descriptor: faceDescriptor, consent: false, idChecked: true }
            })
          ).status,
          400
        )
        assert.equal(
          (
            await request('POST', `/admin/members/${memberId}/face-enrollment`, {
              token: admin.payload.token,
              body: { descriptor: faceDescriptor, consent: true, idChecked: true }
            })
          ).status,
          201
        )
        assert.equal(project.faceEnrollments.length, 1)
        assert.equal(project.faceEnrollments[0].user_id, cloudProfile.id)
        assert.notEqual(
          project.faceEnrollments[0].descriptor_encrypted,
          JSON.stringify(faceDescriptor)
        )
        assert.equal(
          (await request('GET', '/profile/face-enrollment', { token: faceMemberToken })).payload
            .enrolled,
          true
        )
      }
    )
    const faceLogin = await faceSignIn()
    await check(
      'Enrolled password login requires face proof and its challenge grants no API access',
      async () => {
        assert.equal(faceLogin.payload.requiresFaceVerification, true)
        assert.equal(faceLogin.payload.token, undefined)
        assert.equal(
          (await request('GET', '/me', { token: faceLogin.payload.challengeToken })).status,
          401
        )
      }
    )
    const verifyFace = (challengeToken, descriptor = faceDescriptor) =>
      request('POST', '/auth/face-verify', { body: { challengeToken, descriptor } })
    await check('Face mismatch fails and consumes its one-time challenge', async () => {
      assert.equal(
        (await verifyFace(faceLogin.payload.challengeToken, Array(128).fill(1))).status,
        401
      )
      assert.equal((await verifyFace(faceLogin.payload.challengeToken)).status, 401)
    })
    const matchingFaceLogin = await faceSignIn()
    await check(
      'A matching face supports legacy member roles and issues a session exactly once',
      async () => {
        const verified = await verifyFace(matchingFaceLogin.payload.challengeToken)
        assert.equal(verified.status, 200)
        assert.equal(verified.payload.user.id, memberId)
        assert.equal((await request('GET', '/me', { token: verified.payload.token })).status, 200)
        assert.equal((await verifyFace(matchingFaceLogin.payload.challengeToken)).status, 401)
      }
    )
    const revokedFaceLogin = await faceSignIn()
    await check(
      'Revoking face enrollment blocks pending proof and restores password login',
      async () => {
        assert.equal(
          (await request('DELETE', '/profile/face-enrollment', { token: faceMemberToken })).status,
          200
        )
        assert.equal(
          (await request('GET', '/profile/face-enrollment', { token: faceMemberToken })).payload
            .enrolled,
          false
        )
        assert.equal((await verifyFace(revokedFaceLogin.payload.challengeToken)).status, 401)
        assert.equal((await faceSignIn()).payload.user.id, memberId)
      }
    )
  } finally {
    Date.now = originalNow
  }
} catch (error) {
  results.push(false)
  console.error(`FAIL cloud API suite setup: ${error.message}`)
} finally {
  globalThis.fetch = originalFetch
  fs.readFileSync = originalReadFileSync
  // This script deletes only its own verified, newly-created temporary directory.
  if (
    path.dirname(path.resolve(temporaryDirectory)) === temporaryRoot &&
    path.basename(temporaryDirectory).startsWith('fitpulse-cloud-smoke-')
  ) {
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
  const passed = results.filter(Boolean).length
  console.log(`Cloud API smoke checks: ${passed}/${results.length} passed.`)
  process.exit(passed === results.length ? 0 : 1)
}
