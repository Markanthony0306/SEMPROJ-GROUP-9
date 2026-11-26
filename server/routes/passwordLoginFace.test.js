import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { passwordLoginHandler } from './passwordLogin.js'
import { readProof } from '../services/identityProof.js'
import { MEMBER_TERMS_VERSION } from '../../shared/memberTerms.js'

const secret = 'face-login-test-key'
const fakeAccount = {
  id: 'member-123', role: 'user', status: 'active', authVersion: 0,
  email: 'member@example.test', authUserId: 'auth-1', joined: '2026-12-01T00:00:00Z'
}
function fakeSupabase({ template = true } = {}) {
  return { from(table) {
    if (table === 'users') return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 'member-123', auth_user_id: 'auth-1', role_id: 'role-member', status: 'active', member_terms_version: MEMBER_TERMS_VERSION } }) }) }) }
    if (table === 'roles') return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role_name: 'member' } }) }) }) }
    if (table === 'fitpulse_face_templates') return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: template ? { user_id: fakeAccount.id } : null }) }) }) }
    if (table === 'fitpulse_identity_policy') return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { enforced_from: '2026-11-19T00:00:00Z' } }) }) }) }
    throw new Error(`Unexpected table ${table}`)
  } }
}
async function login({ template = true } = {}) {
  const app = express()
  app.use(express.json())
  app.post('/api/auth/login', passwordLoginHandler({
    createAuthClient: () => ({ auth: { signInWithPassword: async () => ({ data: { user: { id: 'auth-1' } } }) } }),
    supabase: fakeSupabase({ template }),
    loadAccount: async () => fakeAccount,
    createSession: () => ({ token: 'SHOULD_NOT_RETURN_WITH_FACE', user: { role: 'user' } }),
    jwtSecret: secret
  }))
  const server = app.listen(0, '127.0.0.1')
  try {
    await new Promise(resolve => server.once('listening', resolve))
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'member@example.test', password: 'correct-password' })
    })
    return { status: response.status, data: await response.json() }
  } finally { await new Promise(resolve => server.close(resolve)) }
}

test('newly enrolled member password login returns a challenge, NEVER a session token', async () => {
  const result = await login()
  assert.equal(result.status, 200)
  assert.equal(result.data.requiresFace, true)
  assert.equal(result.data.token, undefined)
  const claims = readProof(result.data.challenge, 'face_login', secret)
  assert.equal(claims.memberId, fakeAccount.id)
})

test('new member without enrollment is blocked after biometric policy starts', async () => {
  const result = await login({ template: false })
  assert.equal(result.status, 403)
  assert.equal(result.data.code, 'FACE_ENROLLMENT_REQUIRED')
})
