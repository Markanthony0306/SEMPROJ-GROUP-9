import assert from 'node:assert/strict'
import test from 'node:test'
import {
  accountIdentityFingerprint,
  createAdminIdentityService,
  hashIdentityChallenge
} from '../server/services/adminIdentity.js'

// All verification responses are SDK doubles: no .env, credentials, or network.
function fixture({ production = false, expectedNames, returnUrl } = {}) {
  const account = {
    id: 'fixture-admin-id',
    email: 'admin@fitpulse.test',
    role: 'admin',
    authVersion: 2,
    passwordHash: 'fixture-password-hash'
  }
  const names = expectedNames ?? {
    'admin@fitpulse.test': { first_name: 'José Maria', last_name: 'Dela Cruz' }
  }
  const state = {
    time: Date.UTC(2026, 9, 14),
    createPatch: {},
    retrievePatch: {},
    failCreate: false,
    failRetrieve: false,
    calls: [],
    session: null,
    afterRetrieve: null
  }
  const stripe = {
    identity: {
      verificationSessions: {
        async create(input) {
          state.calls.push({ method: 'create', input: structuredClone(input) })
          if (state.failCreate) throw new Error('secret-key-and-sensitive-document-data')
          state.session = {
            id: 'vs_fixture_admin',
            object: 'identity.verification_session',
            status: 'requires_input',
            type: input.type,
            options: structuredClone(input.options),
            metadata: structuredClone(input.metadata),
            livemode: production,
            redaction: null,
            url: 'https://verify.stripe.com/start/fixture',
            client_secret: 'fixture-secret-never-store',
            ...structuredClone(state.createPatch)
          }
          return structuredClone(state.session)
        },
        async retrieve(id, input) {
          state.calls.push({ method: 'retrieve', id, input: structuredClone(input) })
          if (state.failRetrieve) throw new Error('secret-key-and-sensitive-document-data')
          state.afterRetrieve?.()
          return {
            ...structuredClone(state.session),
            status: 'verified',
            url: null,
            verified_outputs: { first_name: 'Jose Maria', last_name: 'Dela Cruz' },
            ...structuredClone(state.retrievePatch)
          }
        }
      }
    }
  }
  const service = createAdminIdentityService({
    stripe,
    production,
    returnUrl: returnUrl ?? 'https://fitpulse.test/',
    expectedNames: names,
    now: () => state.time
  })
  return { account, names, state, stripe, service }
}

async function started(context) {
  const result = await context.service.start(context.account)
  return { ...result.record, challengeToken: result.response.challengeToken }
}

function hasStatus(status, code) {
  return (error) => {
    assert.equal(error.status, status)
    if (code) assert.equal(error.code, code)
    assert.ok(!error.message.includes('secret-key-and-sensitive-document-data'))
    assert.equal(error.cause, undefined)
    return true
  }
}

test('start binds a random opaque challenge and requests ID camera capture plus matching selfie', async () => {
  const context = fixture()
  const { response, record } = await context.service.start(context.account)
  assert.equal(response.verificationRequired, true)
  assert.match(response.challengeToken, /^[A-Za-z0-9_-]{43}$/)
  assert.equal(record.tokenHash, hashIdentityChallenge(response.challengeToken))
  assert.equal(record.accountFingerprint, accountIdentityFingerprint(context.account))
  assert.equal(record.accountId, context.account.id)
  assert.equal(record.verificationSessionId, 'vs_fixture_admin')
  assert.equal(record.expiresAt, context.state.time + 20 * 60 * 1000)
  assert.equal(response.expiresAt, new Date(record.expiresAt).toISOString())
  assert.equal(Date.parse(response.expiresAt), record.expiresAt)
  assert.equal(response.verificationUrl, 'https://verify.stripe.com/start/fixture')
  assert.deepEqual(context.state.calls[0].input, {
    type: 'document',
    options: { document: { require_matching_selfie: true, require_live_capture: true } },
    metadata: {
      fitpulse_account_id: context.account.id,
      fitpulse_challenge_hash: record.tokenHash
    },
    return_url: 'https://fitpulse.test/'
  })
  const persisted = JSON.stringify(record)
  for (const forbidden of [
    response.challengeToken,
    response.verificationUrl,
    'fixture-secret',
    'José'
  ])
    assert.ok(!persisted.includes(forbidden))
  assert.equal(response.token, undefined)
  assert.equal(response.user, undefined)
  assert.equal(response.client_secret, undefined)
})

test('new login attempts receive distinct challenges', async () => {
  const context = fixture()
  const first = await context.service.start(context.account)
  const second = await context.service.start(context.account)
  assert.notEqual(first.response.challengeToken, second.response.challengeToken)
  assert.notEqual(first.record.tokenHash, second.record.tokenHash)
})

test('completion retrieves trusted Stripe session and returns limited verification evidence', async () => {
  const context = fixture()
  const challenge = await started(context)
  const result = await context.service.complete(challenge, context.account)
  assert.deepEqual(context.state.calls[1], {
    method: 'retrieve',
    id: 'vs_fixture_admin',
    input: { expand: ['verified_outputs'] }
  })
  assert.deepEqual(result, {
    status: 'verified',
    verification: {
      provider: 'stripe',
      sessionId: 'vs_fixture_admin',
      verifiedAt: new Date(context.state.time).toISOString()
    }
  })
  assert.equal(result.token, undefined)
  assert.equal(result.verified_outputs, undefined)
})

test('matching legal names normalizes Unicode accents, casing, and spaces', async () => {
  const context = fixture()
  const challenge = await started(context)
  context.state.retrievePatch.verified_outputs = {
    first_name: '  JOSE\u0301   MARIA  ',
    last_name: ' DELA  CRUZ '
  }
  assert.equal((await context.service.complete(challenge, context.account)).status, 'verified')
})

for (const outputs of [
  { first_name: 'Jose', last_name: 'Dela Cruz' },
  { first_name: 'Jose Maria', last_name: 'Cruz' },
  { first_name: 'Different Person', last_name: 'Dela Cruz' }
]) {
  test(`different or partial legal name is rejected: ${outputs.first_name} ${outputs.last_name}`, async () => {
    const context = fixture()
    const challenge = await started(context)
    context.state.retrievePatch.verified_outputs = outputs
    await assert.rejects(
      context.service.complete(challenge, context.account),
      hasStatus(403, 'ADMIN_IDENTITY_MISMATCH')
    )
  })
}

for (const outputs of [
  null,
  'unexpanded-output',
  {},
  { first_name: null, last_name: 'Dela Cruz' }
]) {
  test(`missing or malformed verified names deny access: ${JSON.stringify(outputs)}`, async () => {
    const context = fixture()
    const challenge = await started(context)
    context.state.retrievePatch.verified_outputs = outputs
    await assert.rejects(context.service.complete(challenge, context.account), hasStatus(503))
  })
}

for (const [status, expected] of [
  ['processing', { status: 'processing' }],
  [
    'requires_input',
    { status: 'requires_input', verificationUrl: 'https://verify.stripe.com/retry' }
  ]
]) {
  test(`${status} gives progress without verification evidence`, async () => {
    const context = fixture()
    const challenge = await started(context)
    context.state.retrievePatch = { status, url: 'https://verify.stripe.com/retry' }
    assert.deepEqual(await context.service.complete(challenge, context.account), expected)
  })
}

test('a canceled verification fails closed', async () => {
  const context = fixture()
  const challenge = await started(context)
  context.state.retrievePatch.status = 'canceled'
  await assert.rejects(
    context.service.complete(challenge, context.account),
    hasStatus(403, 'ADMIN_IDENTITY_FAILED')
  )
})

for (const changes of [
  { id: 'different-admin' },
  { email: 'different@fitpulse.test' },
  { role: 'staff' },
  { authVersion: 3 },
  { passwordHash: 'changed-password-hash' }
]) {
  test(`changed account binding is rejected: ${Object.keys(changes)[0]}`, async () => {
    const context = fixture()
    const challenge = await started(context)
    await assert.rejects(
      context.service.complete(challenge, { ...context.account, ...changes }),
      hasStatus(401)
    )
    assert.equal(context.state.calls.length, 1)
  })
}

test('trusted legal-name configuration rotation invalidates an existing challenge', async () => {
  const context = fixture()
  const challenge = await started(context)
  context.names[context.account.email].last_name = 'Changed Name'
  await assert.rejects(context.service.complete(challenge, context.account), hasStatus(401))
  assert.equal(context.state.calls.length, 1)
})

for (const changes of [
  { challengeToken: 'invalid-token' },
  { challengeToken: 'A'.repeat(43) },
  { tokenHash: 'bad' },
  { accountFingerprint: '0'.repeat(64) },
  { expectedNameFingerprint: '0'.repeat(64) },
  { verificationSessionId: 'browser-provided-session' },
  { expiresAt: 'future' }
]) {
  test(`tampered challenge is rejected: ${Object.keys(changes)[0]} ${Object.values(changes)[0]}`, async () => {
    const context = fixture()
    const challenge = await started(context)
    await assert.rejects(
      context.service.complete({ ...challenge, ...changes }, context.account),
      hasStatus(401)
    )
    assert.equal(context.state.calls.length, 1)
  })
}

test('expiry is checked before and after the provider request', async () => {
  for (const duringRequest of [false, true]) {
    const context = fixture()
    const challenge = await started(context)
    if (duringRequest)
      context.state.afterRetrieve = () => (context.state.time = challenge.expiresAt)
    else context.state.time = challenge.expiresAt
    await assert.rejects(context.service.complete(challenge, context.account), hasStatus(401))
    assert.equal(context.state.calls.length, duringRequest ? 2 : 1)
  }
})

const malformedSessions = [
  { object: 'other-object' },
  { type: 'id_number' },
  { options: null },
  { options: { document: { require_live_capture: true, require_matching_selfie: false } } },
  { options: { document: { require_live_capture: false, require_matching_selfie: true } } },
  { status: 'unknown' },
  { livemode: 'true' },
  { redaction: { status: 'processing' } },
  { redaction: { status: 'redacted' } }
]

for (const [index, patch] of malformedSessions.entries()) {
  test(`malformed or redacted Stripe session fails closed at creation and completion: ${index}`, async () => {
    const createContext = fixture()
    createContext.state.createPatch = patch
    await assert.rejects(createContext.service.start(createContext.account), hasStatus(503))
    const completeContext = fixture()
    const challenge = await started(completeContext)
    completeContext.state.retrievePatch = patch
    await assert.rejects(
      completeContext.service.complete(challenge, completeContext.account),
      hasStatus(503)
    )
  })
}

for (const patch of [
  { id: 'vs_wrong_session' },
  { metadata: { fitpulse_account_id: 'wrong-admin', fitpulse_challenge_hash: '0'.repeat(64) } },
  { metadata: { fitpulse_account_id: 'fixture-admin-id', fitpulse_challenge_hash: '0'.repeat(64) } }
]) {
  test(`Stripe session binding mismatch fails closed: ${JSON.stringify(patch)}`, async () => {
    const context = fixture()
    const challenge = await started(context)
    context.state.retrievePatch = patch
    await assert.rejects(context.service.complete(challenge, context.account), hasStatus(401))
  })
}

for (const url of [
  null,
  'http://verify.stripe.com/start/unsafe',
  'https://verify.stripe.com.evil.test/start/unsafe',
  'https://verify.stripe.com@evil.test/start/unsafe',
  'https://username@verify.stripe.com/start/unsafe',
  'https://verify.stripe.com:444/start/unsafe',
  'javascript:alert(1)'
]) {
  test(`unsafe hosted verification URL is rejected: ${url}`, async () => {
    const context = fixture()
    context.state.createPatch.url = url
    await assert.rejects(context.service.start(context.account), hasStatus(503))
    context.state.createPatch = {}
    const challenge = await started(context)
    context.state.retrievePatch = { status: 'requires_input', url }
    await assert.rejects(context.service.complete(challenge, context.account), hasStatus(503))
  })
}

test('production accepts live sessions and rejects test sessions', async () => {
  const context = fixture({ production: true })
  const challenge = await started(context)
  assert.equal((await context.service.complete(challenge, context.account)).status, 'verified')
  context.state.retrievePatch.livemode = false
  await assert.rejects(context.service.complete(challenge, context.account), hasStatus(503))
  context.state.createPatch.livemode = false
  await assert.rejects(context.service.start(context.account), hasStatus(503))
})

test('HTTP production return URL is rejected before provider access', async () => {
  const context = fixture({ production: true, returnUrl: 'http://fitpulse.test/' })
  await assert.rejects(context.service.start(context.account), hasStatus(503))
  assert.equal(context.state.calls.length, 0)
})

for (const names of [
  {},
  { 'admin@fitpulse.test': {} },
  { 'admin@fitpulse.test': { first_name: 'Jose' } }
]) {
  test(`missing trusted name configuration denies access: ${JSON.stringify(names)}`, async () => {
    const context = fixture({ expectedNames: names })
    await assert.rejects(context.service.start(context.account), hasStatus(503))
    assert.equal(context.state.calls.length, 0)
  })
}

test('missing provider configuration returns a recoverable unavailable error', async () => {
  const context = fixture()
  const service = createAdminIdentityService({
    returnUrl: 'https://fitpulse.test/',
    expectedNames: context.names
  })
  await assert.rejects(service.start(context.account), hasStatus(503))
})

test('provider exceptions never expose sensitive data', async () => {
  const context = fixture()
  context.state.failCreate = true
  await assert.rejects(context.service.start(context.account), hasStatus(503))
  context.state.failCreate = false
  const challenge = await started(context)
  context.state.failRetrieve = true
  await assert.rejects(context.service.complete(challenge, context.account), hasStatus(503))
})

test('service has no in-memory challenge dependency after process restart', async () => {
  const context = fixture()
  const challenge = await started(context)
  const restarted = createAdminIdentityService({
    stripe: context.stripe,
    returnUrl: 'https://fitpulse.test/',
    expectedNames: context.names,
    now: () => context.state.time
  })
  assert.equal((await restarted.complete(challenge, context.account)).status, 'verified')
})

test('fingerprint includes each security-sensitive account property', () => {
  const { account } = fixture()
  const original = accountIdentityFingerprint(account)
  assert.match(original, /^[a-f0-9]{64}$/)
  for (const changes of [
    { id: 'other-id' },
    { email: 'other@fitpulse.test' },
    { role: 'staff' },
    { authVersion: 3 },
    { passwordHash: 'other-hash' }
  ])
    assert.notEqual(accountIdentityFingerprint({ ...account, ...changes }), original)
  assert.throws(
    () => accountIdentityFingerprint({ ...account, passwordHash: null }),
    hasStatus(401)
  )
  assert.throws(() => hashIdentityChallenge('not-an-opaque-token'), hasStatus(401))
})
