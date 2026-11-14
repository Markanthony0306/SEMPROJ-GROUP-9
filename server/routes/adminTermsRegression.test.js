import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { faceVerificationRoutes } from './faceVerification.js'
import { createFaceChallenges } from '../services/faceVerification.js'

async function requestTerms({ role = 'admin', identityVerificationEnabled = false, status = 'active', authVersion = 3, challengeVersion = 3, challengeRole = role }) {
  const account = {
    id: 'test-account', role, status, authVersion, name: 'Test account', email: 'test@example.invalid'
  }
  const challenges = createFaceChallenges()
  const { termsToken } = challenges.issueTerms({ userId: account.id, authVersion: challengeVersion, role: challengeRole })
  const app = express()
  app.use(express.json())
  app.use('/api', faceVerificationRoutes({
    supabase: {},
    authenticate: (_req, _res, next) => next(),
    requireRole: () => (_req, _res, next) => next(),
    rateLimit: () => (_req, _res, next) => next(),
    loadAccount: async () => account,
    createSession: (a) => ({ token: 'test-only-token', user: { id: a.id, role: a.role } }),
    staffFaceEnabled: false,
    identityVerificationEnabled,
    key: null,
    memberIdKey: null,
    challenges,
    createAuthClient: () => { throw new Error('Not expected') }
  }))
  const server = app.listen(0, '127.0.0.1')
  try {
    await new Promise((resolve) => server.once('listening', resolve))
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/accept-terms`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accepted: true, termsToken })
    })
    return { statusCode: response.status, body: await response.json() }
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
}

test('admin can accept terms when strict ID verification is disabled', async () => {
  const result = await requestTerms({ role: 'admin', identityVerificationEnabled: false })
  assert.equal(result.statusCode, 200)
  assert.equal(result.body.user?.role, 'admin')
  assert.equal(result.body.token, 'test-only-token')
})

test('member can still accept terms when strict ID verification is disabled', async () => {
  const result = await requestTerms({ role: 'user', identityVerificationEnabled: false })
  assert.equal(result.statusCode, 200)
  assert.equal(result.body.user?.role, 'user')
})

test('an admin cannot use the terms endpoint to bypass strict ID verification', async () => {
  const result = await requestTerms({ role: 'admin', identityVerificationEnabled: true })
  assert.equal(result.statusCode, 403)
  assert.match(result.body.message, /account is unavailable/i)
})

test('inactive account and mismatched terms challenges remain denied', async () => {
  const inactive = await requestTerms({ role: 'admin', status: 'inactive' })
  assert.equal(inactive.statusCode, 403)
  const wrongVersion = await requestTerms({ role: 'admin', authVersion: 4, challengeVersion: 3 })
  assert.equal(wrongVersion.statusCode, 403)
  const wrongRole = await requestTerms({ role: 'admin', challengeRole: 'user' })
  assert.equal(wrongRole.statusCode, 403)
})
