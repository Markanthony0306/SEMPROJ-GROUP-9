import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { memberRegistrationRoutes } from './memberRegistration.js'
import { createSessionAuth } from '../middleware/sessionAuth.js'

const account = {
  id: 'test-member', name: 'A Member', email: 'member@example.test',
  role: 'user', status: 'active', plan: 'Monthly', authVersion: 0
}

test('ID verification mode refuses member creation without a verification draft before database writes', async () => {
  let loaded = false
  let created = false
  const app = express()
  app.use(express.json())
  app.use('/api', memberRegistrationRoutes({
    identityVerificationEnabled: true,
    authenticate(req, _res, next) { req.user = { id: 'admin', role: 'admin' }; next() },
    requireRole: () => (_req, _res, next) => next(),
    validAccountInput(body) { return { name: body.name, email: body.email, plan: body.plan } },
    paymentMethod: () => 'Cash',
    loadDatabase() { loaded = true; throw new Error('Should not load') },
    verifiedRegistrationWorkflow: { execute() { created = true; throw new Error('Should not create') } }
  }))
  const server = app.listen(0, '127.0.0.1')
  try {
    await new Promise(resolve => server.once('listening', resolve))
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/members`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email: 'test@example.test', plan: 'Monthly' })
    })
    assert.equal(response.status, 409)
    assert.equal((await response.json()).code, 'ID_VERIFICATION_REQUIRED')
    assert.equal(loaded, false)
    assert.equal(created, false)
  } finally {
    await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()))
  }
})

test('strict identity verification requires a verified face for members when enabled', () => {
  const session = createSessionAuth({
    jwtSecret: 'identity-test-only-secret', loadAccount: async () => account,
    membershipStatus: () => 'active', identityVerificationEnabled: true
  })
  assert.throws(() => session.createSession(account), /verified face/)
  assert.ok(session.createSession(account, { faceVerified: true }).token)
})

test('identity verification defaults off to preserve original member sessions', () => {
  const session = createSessionAuth({
    jwtSecret: 'identity-test-only-secret', loadAccount: async () => account,
    membershipStatus: () => 'active'
  })
  assert.ok(session.createSession(account).token)
})
