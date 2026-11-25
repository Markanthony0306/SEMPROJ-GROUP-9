import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { acceptMemberTermsHandler, passwordLoginHandler } from './passwordLogin.js'
import { readProof } from '../services/identityProof.js'
import { MEMBER_TERMS_VERSION } from '../../shared/memberTerms.js'

const secret = 'face-login-test-key'
const fakeAccount = {
  id: 'member-123', role: 'user', status: 'active', authVersion: 0,
  email: 'member@example.test', authUserId: 'auth-1', joined: '2026-12-01T00:00:00Z'
}
function fakeSupabase({ template = true, role = 'member' } = {}) {
  return { from(table) {
    if (table === 'users') return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 'member-123', auth_user_id: 'auth-1', role_id: 'role-member', status: 'active' } }) }) }) }
    if (table === 'roles') return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role_name: role } }) }) }) }
    if (table === 'fitpulse_face_templates' && role === 'member') return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: template ? { user_id: fakeAccount.id } : null }) }) }) }
    throw new Error(`Unexpected table ${table}`)
  } }
}
async function exerciseLogin(run, { template = true, role = 'member', joined = fakeAccount.joined } = {}) {
  const app = express()
  const account = { ...fakeAccount, joined, role: role === 'member' ? 'user' : role }
  app.use(express.json())
  app.post('/api/auth/login', passwordLoginHandler({
    createAuthClient: () => ({ auth: { signInWithPassword: async ({ password }) => password === 'correct-password'
      ? { data: { user: { id: 'auth-1' } } }
      : { error: { code: 'invalid_credentials' } } } }),
    supabase: fakeSupabase({ template, role }),
    loadAccount: async () => account,
    createSession: () => ({ token: 'fixture-session', user: { role: account.role } })
  }))
  app.post('/api/auth/member-terms', acceptMemberTermsHandler({ jwtSecret: secret }))
  const server = app.listen(0, '127.0.0.1')
  try {
    await new Promise(resolve => server.once('listening', resolve))
    const post = async (path, body) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
      return { status: response.status, data: await response.json() }
    }
    await run(post)
  } finally { await new Promise(resolve => server.close(resolve)) }
}

const credentials = { email: fakeAccount.email, password: 'correct-password' }

test('member credentials require acceptance of the current terms before issuing a face challenge', () =>
  exerciseLogin(async (post) => {
    const result = await post('login', credentials)
    assert.equal(result.status, 200)
    assert.equal(result.data.requiresTerms, true)
    assert.equal(result.data.token, undefined)
    assert.equal(result.data.challenge, undefined)
    const termsTicket = result.data.termsTicket
    const version = MEMBER_TERMS_VERSION
    assert.equal((await post('member-terms', { termsTicket, accepted: false, version })).status, 400)
    assert.equal((await post('member-terms', { termsTicket, accepted: true, version: '2020-01-01' })).status, 400)
    const accepted = await post('member-terms', { termsTicket, accepted: true, version })
    assert.equal(accepted.status, 200)
    assert.equal(accepted.data.token, undefined)
    const claims = readProof(accepted.data.challenge, 'face_login', secret)
    assert.equal(claims.memberId, fakeAccount.id)
    assert.equal(claims.termsVersion, version)
    assert.equal((await post('member-terms', { termsTicket, accepted: true, version })).status, 403)
  }))

test('legacy member without enrollment is blocked from password-only sign-in', () =>
  exerciseLogin(async (post) => {
    const result = await post('login', credentials)
    assert.equal(result.status, 403)
    assert.equal(result.data.code, 'FACE_ENROLLMENT_REQUIRED')
  }, { template: false, joined: '2020-01-01T00:00:00Z' }))

test('administrator receives a session after credentials without looking up biometric enrollment', () =>
  exerciseLogin(async (post) => {
    const result = await post('login', credentials)
    assert.equal(result.status, 200)
    assert.equal(result.data.user.role, 'admin')
    assert.equal(result.data.token, 'fixture-session')
    assert.equal(result.data.termsTicket, undefined)
  }, { role: 'admin', template: false }))

for (const role of ['admin', 'member']) {
  test(`${role} cannot sign in after five wrong passwords`, () =>
    exerciseLogin(async (post) => {
      for (let attempt = 1; attempt < 5; attempt++) {
        const result = await post('login', { ...credentials, password: 'wrong' })
        assert.equal(result.status, 401)
        assert.equal(result.data.remainingAttempts, 5 - attempt)
      }
      assert.equal((await post('login', { ...credentials, password: 'wrong' })).data.code, 'LOGIN_LOCKED')
      const result = await post('login', credentials)
      assert.equal(result.status, 429)
      assert.equal(result.data.code, 'LOGIN_LOCKED')
    }, { role }))
}
