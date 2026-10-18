// Exercise the real API and Stripe identity service using synthetic SDK responses.
// Run: node scripts/smoke-admin-identity.mjs. No real .env, ID, cloud, or email is used.
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Stripe from 'stripe'

const port = 3997
const origin = `http://127.0.0.1:${port}`
const temporaryRoot = path.resolve(tmpdir())
const temporaryDirectory = await mkdtemp(path.join(temporaryRoot, 'fitpulse-identity-smoke-'))
const dataFile = path.join(temporaryDirectory, 'data.json')
const administratorId = crypto.randomUUID()
const adminEmail = 'fixture-admin@fitpulse.test'
const adminPassword = 'Fixture-admin-password-123'
let currentAdminPassword = adminPassword
const expectedName = { first_name: 'Tessa', last_name: 'Example' }
const privateSentinel = 'SYNTHETIC_PROVIDER_DATA_MUST_STAY_PRIVATE'

Object.assign(process.env, {
  PORT: String(port),
  NODE_ENV: 'development',
  ACCOUNT_PROVIDER: 'local',
  FACE_LOGIN_ENABLED: 'false',
  FACE_ENCRYPTION_KEY: '',
  ADMIN_IDENTITY_VERIFICATION: 'true',
  ADMIN_IDENTITY_NAMES: JSON.stringify({ [adminEmail]: expectedName }),
  STRIPE_SECRET_KEY: 'sk_test_fixture',
  JWT_SECRET: 'isolated-fitpulse-identity-session-signing-key',
  DATA_FILE: dataFile,
  AVATAR_DIR: path.join(temporaryDirectory, 'avatars'),
  SCANNER_API_KEY: '',
  CLIENT_URL: 'http://127.0.0.1:5173/fitpulse',
  SMTP_HOST: '',
  SMTP_USER: '',
  SMTP_PASS: '',
  ADMIN_EMAIL: adminEmail,
  ADMIN_PASSWORD: adminPassword
})

const results = []
const providerSessions = new Map()
const providerRequests = []
const originalFetch = globalThis.fetch
const originalReadFileSync = fs.readFileSync
// stripe v23 exposes Identity as a namespace constructor. The instantiated
// resource shares its prototype with all subsequently created SDK clients.
const fixtureStripe = new Stripe('sk_test_fixture')
const sessionPrototype = Object.getPrototypeOf(fixtureStripe.identity.verificationSessions)
const originalCreate = sessionPrototype.create
const originalRetrieve = sessionPrototype.retrieve
const originalMakeRequest = Stripe.StripeResource.prototype._makeRequest
let providerSequence = 0
let retrievalDelay = 0
let retrievalBarrier

sessionPrototype.create = async function (parameters) {
  providerRequests.push({ operation: 'create', parameters: structuredClone(parameters) })
  const id = `vs_fixture${++providerSequence}`
  const session = {
    id,
    object: 'identity.verification_session',
    type: parameters.type,
    options: structuredClone(parameters.options),
    metadata: structuredClone(parameters.metadata),
    livemode: false,
    redaction: null,
    status: 'requires_input',
    url: `https://verify.stripe.com/start/${id}`,
    client_secret: privateSentinel,
    verified_outputs: {
      ...expectedName,
      address: { line1: privateSentinel },
      dob: { year: 1990, month: 1, day: 1 },
      id_number: privateSentinel
    }
  }
  providerSessions.set(id, session)
  return structuredClone(session)
}
sessionPrototype.retrieve = async function (id, parameters) {
  providerRequests.push({ operation: 'retrieve', id, parameters: structuredClone(parameters) })
  const barrier = retrievalBarrier
  if (barrier?.sessionId === id) {
    barrier.notifyEntered()
    await barrier.released
  }
  if (retrievalDelay) await sleep(retrievalDelay)
  assert.ok(providerSessions.has(id), 'Requested an unknown synthetic Stripe session.')
  return structuredClone(providerSessions.get(id))
}
// Fail closed if implementation adds any unmocked Stripe API operation.
Stripe.StripeResource.prototype._makeRequest = function () {
  throw new Error('This test blocks all unmocked Stripe network requests.')
}
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url)
  if (url.origin !== origin) throw new Error('This test blocks all external network origins.')
  return originalFetch(input, options)
}
// Mask only .env loading; real application/temporary database reads still work.
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
    // Assertions do not include provider credentials or real personal data.
    console.error(`FAIL ${name}: ${error.message}`)
  }
}
function assertPrivate(payload) {
  const serialized = JSON.stringify(payload)
  for (const forbidden of [
    privateSentinel,
    'sk_test_fixture',
    'verified_outputs',
    'client_secret',
    'fitpulse_challenge_hash',
    'passwordHash'
  ])
    assert.equal(serialized.includes(forbidden), false, `Response exposed ${forbidden}.`)
}
async function request(method, route, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${origin}/api${route}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000)
  })
  const payload = await response.json()
  assertPrivate(payload)
  return { status: response.status, payload, cacheControl: response.headers.get('cache-control') }
}
const signIn = (email = adminEmail, password = currentAdminPassword) =>
  request('POST', '/auth/login', { body: { email, password } })
const complete = (challengeToken, extras = {}) =>
  request('POST', '/auth/admin-identity/complete', { body: { challengeToken, ...extras } })
const readDatabase = async () => JSON.parse(await readFile(dataFile, 'utf8'))
async function changeAccount(changes) {
  const database = await readDatabase()
  Object.assign(
    database.accounts.find((account) => account.id === administratorId),
    changes
  )
  await writeFile(dataFile, JSON.stringify(database))
}
async function sessionFor(challengeToken) {
  const tokenHash = crypto.createHash('sha256').update(challengeToken).digest('hex')
  const database = await readDatabase()
  const challenge = database.adminIdentityChallenges.find((entry) => entry.tokenHash === tokenHash)
  assert.ok(challenge, 'Challenge must be persisted before login returns.')
  assert.equal(challenge.accountId, administratorId)
  assert.equal(
    database.adminIdentityChallenges.some((entry) => entry.challengeToken),
    false
  )
  assert.equal(JSON.stringify(database).includes(challengeToken), false)
  return providerSessions.get(challenge.verificationSessionId)
}

try {
  const start = new Date().toISOString()
  await writeFile(
    dataFile,
    JSON.stringify({
      accounts: [
        {
          id: administratorId,
          name: 'Fixture Administrator',
          email: adminEmail,
          role: 'admin',
          status: 'active',
          passwordHash: await bcrypt.hash(adminPassword, 4),
          must_change_password: false
        },
        {
          id: crypto.randomUUID(),
          name: 'Fixture Missing Legal Name',
          email: 'unconfigured-admin@fitpulse.test',
          role: 'admin',
          status: 'active',
          passwordHash: await bcrypt.hash(adminPassword, 4),
          must_change_password: false
        },
        {
          id: crypto.randomUUID(),
          name: 'Fixture Staff',
          email: 'fixture-staff@fitpulse.test',
          role: 'staff',
          status: 'active',
          passwordHash: await bcrypt.hash('Fixture-staff-password-123', 4),
          must_change_password: false
        },
        {
          id: crypto.randomUUID(),
          name: 'Fixture Member',
          email: 'fixture-member@fitpulse.test',
          role: 'member',
          status: 'active',
          plan: 'Monthly',
          joined: start,
          membershipStart: start,
          passwordHash: await bcrypt.hash('Fixture-member-password-123', 4),
          must_change_password: false
        }
      ],
      attendance: [],
      payments: []
    })
  )
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
  assert.equal(ready, true, 'Isolated identity API did not become ready.')

  await check('Wrong password creates no Stripe verification session', async () => {
    assert.equal((await signIn(adminEmail, 'Invalid-password-123')).status, 401)
    assert.equal(providerSessions.size, 0)
  })
  const pending = await signIn()
  await check('Admin password login returns a private challenge without app access', async () => {
    assert.equal(pending.status, 200)
    assert.equal(pending.payload.verificationRequired, true)
    assert.match(pending.payload.challengeToken, /^[A-Za-z0-9_-]{43}$/)
    assert.match(pending.payload.verificationUrl, /^https:\/\/verify\.stripe\.com\//)
    assert.equal(pending.payload.token, undefined)
    assert.equal(pending.payload.user, undefined)
    assert.equal(pending.cacheControl, 'no-store')
    assert.equal(typeof pending.payload.expiresAt, 'string')
    const expiresAt = Date.parse(pending.payload.expiresAt)
    assert.ok(expiresAt > Date.now())
    assert.ok(expiresAt <= Date.now() + 20 * 60 * 1000)
  })
  const firstSession = await sessionFor(pending.payload.challengeToken)
  await check('Stripe session requires a live ID capture and matching selfie', async () => {
    const created = providerRequests.find((entry) => entry.operation === 'create').parameters
    assert.equal(created.type, 'document')
    assert.equal(created.options.document.require_matching_selfie, true)
    assert.equal(created.options.document.require_live_capture, true)
    assert.equal(created.return_url, 'http://127.0.0.1:5173/fitpulse/?identity=return')
    assert.equal(created.metadata.fitpulse_account_id, administratorId)
    assert.equal(created.metadata.first_name, undefined)
  })
  await check('Challenge token cannot authorize protected admin or session routes', async () => {
    for (const route of ['/me', '/members'])
      assert.equal(
        (await request('GET', route, { token: pending.payload.challengeToken })).status,
        401
      )
  })
  await check('Unknown or malformed challenges cannot obtain an app session', async () => {
    for (const token of ['invalid', crypto.randomBytes(32).toString('base64url')])
      assert.equal((await complete(token)).status, 401)
  })
  await check('Client success claims cannot bypass Stripe requires_input', async () => {
    const result = await complete(pending.payload.challengeToken, {
      verified: true,
      status: 'verified',
      verified_outputs: expectedName
    })
    assert.equal(result.status, 200)
    assert.equal(result.payload.status, 'requires_input')
    assert.equal(result.payload.token, undefined)
    assert.equal(result.payload.verificationUrl, firstSession.url)
    assert.equal(result.cacheControl, 'no-store')
  })
  firstSession.status = 'processing'
  await check('Stripe processing grants no FitPulse session', async () => {
    const result = await complete(pending.payload.challengeToken)
    assert.equal(result.status, 200)
    assert.equal(result.payload.status, 'processing')
    assert.equal(result.payload.token, undefined)
    assert.equal(result.payload.user, undefined)
  })
  firstSession.status = 'verified'
  firstSession.url = null
  const verified = await complete(pending.payload.challengeToken)
  await check('Verified Stripe ID and trusted legal name issue an admin session', async () => {
    assert.equal(verified.status, 200)
    assert.equal(verified.payload.role, 'admin')
    assert.equal(verified.payload.user.id, administratorId)
    assert.equal(typeof verified.payload.token, 'string')
    assert.equal((await request('GET', '/members', { token: verified.payload.token })).status, 200)
    assert.equal((await request('GET', '/me', { token: verified.payload.token })).status, 200)
    assert.ok(
      providerRequests.some((entry) => entry.parameters?.expand?.includes('verified_outputs'))
    )
  })
  await check('Consumed challenge cannot issue another admin session', async () => {
    const result = await complete(pending.payload.challengeToken)
    assert.equal(result.status, 401)
    assert.equal(result.payload.token, undefined)
  })
  await check('Pre-verification admin JWT is denied even with a valid signature', async () => {
    const legacyToken = jwt.sign(
      { id: administratorId, role: 'admin', authVersion: 0 },
      process.env.JWT_SECRET,
      { expiresIn: '1h', algorithm: 'HS256' }
    )
    for (const route of ['/me', '/members']) {
      const result = await request('GET', route, { token: legacyToken })
      assert.equal(result.status, 401)
      assert.equal(result.payload.code, 'ADMIN_IDENTITY_REQUIRED')
    }
  })
  await check(
    'Admin password change preserves trusted proof and ignores browser proof',
    async () => {
      const nextPassword = 'Updated-admin-password-789'
      const originalProof = jwt.decode(verified.payload.token).adminIdentity
      const result = await request('POST', '/profile/change-password', {
        token: verified.payload.token,
        body: {
          currentPassword: currentAdminPassword,
          password: nextPassword,
          confirmPassword: nextPassword,
          adminIdentity: {
            provider: 'stripe',
            sessionId: 'vs_browseroverride',
            verifiedAt: new Date().toISOString()
          }
        }
      })
      assert.equal(result.status, 200)
      currentAdminPassword = nextPassword
      const refreshedToken = result.payload.session.token
      assert.deepEqual(jwt.decode(refreshedToken).adminIdentity, originalProof)
      assert.equal((await request('GET', '/me', { token: refreshedToken })).status, 200)
      assert.equal((await request('GET', '/members', { token: refreshedToken })).status, 200)
      assert.equal((await request('GET', '/me', { token: verified.payload.token })).status, 401)
    }
  )
  await check('Staff retains password login and staff API permissions', async () => {
    const result = await signIn('fixture-staff@fitpulse.test', 'Fixture-staff-password-123')
    assert.equal(result.status, 200)
    assert.equal(result.payload.user.role, 'staff')
    assert.equal(result.payload.verificationRequired, undefined)
    assert.equal((await request('GET', '/members', { token: result.payload.token })).status, 200)
  })
  await check('Member retains password login without admin permissions', async () => {
    const result = await signIn('fixture-member@fitpulse.test', 'Fixture-member-password-123')
    assert.equal(result.status, 200)
    assert.equal(result.payload.user.role, 'member')
    assert.equal(result.payload.verificationRequired, undefined)
    assert.equal((await request('GET', '/me', { token: result.payload.token })).status, 200)
    assert.equal((await request('GET', '/members', { token: result.payload.token })).status, 403)
  })
  await check('Concurrent completion consumes a verified challenge exactly once', async () => {
    const login = await signIn()
    assert.equal(login.status, 200)
    const session = await sessionFor(login.payload.challengeToken)
    session.status = 'verified'
    session.url = null
    retrievalDelay = 75
    let responses
    try {
      responses = await Promise.all([
        complete(login.payload.challengeToken),
        complete(login.payload.challengeToken)
      ])
    } finally {
      retrievalDelay = 0
    }
    assert.deepEqual(responses.map((result) => result.status).sort(), [200, 401])
    assert.equal(responses.filter((result) => result.payload.token).length, 1)
  })
  await check('Verified ID with another legal name is denied', async () => {
    const login = await signIn()
    assert.equal(login.status, 200)
    const session = await sessionFor(login.payload.challengeToken)
    session.status = 'verified'
    session.url = null
    session.verified_outputs.first_name = 'Someone Else'
    const result = await complete(login.payload.challengeToken, {
      expectedName: { first_name: 'Someone Else', last_name: expectedName.last_name },
      adminIdentity: { provider: 'stripe', status: 'verified' }
    })
    assert.equal(result.status, 403)
    assert.equal(result.payload.code, 'ADMIN_IDENTITY_MISMATCH')
    assert.equal(result.payload.token, undefined)
  })
  await check('Password mutation while Stripe is retrieving blocks session issuance', async () => {
    const login = await signIn()
    assert.equal(login.status, 200)
    const session = await sessionFor(login.payload.challengeToken)
    session.status = 'verified'
    session.url = null
    let notifyEntered
    let releaseRetrieval
    const entered = new Promise((resolve) => {
      notifyEntered = resolve
    })
    const released = new Promise((resolve) => {
      releaseRetrieval = resolve
    })
    retrievalBarrier = { sessionId: session.id, notifyEntered, released }
    const completion = complete(login.payload.challengeToken)
    let result
    try {
      await Promise.race([
        entered,
        sleep(3000).then(() => {
          throw new Error('Completion did not reach the synthetic Stripe retrieval barrier.')
        })
      ])
      await changeAccount({ passwordHash: await bcrypt.hash('Changed-admin-password-456', 4) })
    } finally {
      retrievalBarrier = undefined
      releaseRetrieval()
      result = await completion
    }
    assert.equal(result.status, 401)
    assert.equal(result.payload.token, undefined)
  })
  await check('Admin without trusted legal name fails closed', async () => {
    const result = await signIn('unconfigured-admin@fitpulse.test', adminPassword)
    assert.equal(result.status, 503)
    assert.equal(result.payload.token, undefined)
    assert.equal(result.payload.challengeToken, undefined)
  })
  await check('Raw provider responses and verification PII stay out of saved records', async () => {
    const serialized = JSON.stringify(await readDatabase())
    assert.equal(serialized.includes(privateSentinel), false)
    assert.equal(serialized.includes('verified_outputs'), false)
    assert.equal(serialized.includes('sk_test_fixture'), false)
  })
} catch (error) {
  results.push(false)
  console.error(`FAIL identity API suite setup: ${error.message}`)
} finally {
  globalThis.fetch = originalFetch
  fs.readFileSync = originalReadFileSync
  sessionPrototype.create = originalCreate
  sessionPrototype.retrieve = originalRetrieve
  Stripe.StripeResource.prototype._makeRequest = originalMakeRequest
  // Delete only this script's verified, newly-created temporary directory.
  if (
    path.dirname(path.resolve(temporaryDirectory)) === temporaryRoot &&
    path.basename(temporaryDirectory).startsWith('fitpulse-identity-smoke-')
  )
    await rm(temporaryDirectory, { recursive: true, force: true })
  const passed = results.filter(Boolean).length
  console.log(`Identity API smoke checks: ${passed}/${results.length} passed.`)
  process.exit(passed === results.length ? 0 : 1)
}
