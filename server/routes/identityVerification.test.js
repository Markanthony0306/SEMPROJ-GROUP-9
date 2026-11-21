import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { identityVerificationRoutes } from './identityVerification.js'
import { issueProof } from '../services/identityProof.js'

const secret = 'test-only-secret-with-good-entropy'
const actorId = 'admin-test'
const memberId = 'member-test'
const image = 'data:image/jpeg;base64,' + Buffer.from('test image bytes').toString('base64')
const embedding = Array.from({ length: 128 }, (_, n) => n === 0 ? 1 : 0)
const frames = { right: image, left: image, front: image }
const motion = { right: { neutral: image, turned: image }, left: { neutral: image, turned: image } }

function setup({ faceTemplate = embedding, role = 'admin' } = {}) {
  const app = express()
  app.use(express.json({ limit: '1mb' }))
  const called = []
  const dependencies = {
    jwtSecret: secret,
    authenticate(req, res, next) { req.user = { id: actorId, role }; next() },
    requireRole: (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'Forbidden' }),
    rateLimit: () => (_req, _res, next) => next(),
    loadAccount: async id => id === memberId ? { id, role: 'user', status: 'active', authVersion: 0 } : null,
    createSession: () => ({ user: { id: memberId }, token: 'session-token' }),
    supabase: { from: table => {
      assert.equal(table, 'fitpulse_face_templates')
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: faceTemplate ? { embedding: faceTemplate } : null, error: null }) }) }) }
    } },
    async engine(input) { called.push(input); return { ok: true, embedding } }
  }
  app.use('/api', identityVerificationRoutes(dependencies))
  return { app, called }
}

async function post(app, endpoint, body) {
  const server = app.listen(0, '127.0.0.1')
  try {
    await new Promise(resolve => server.once('listening', resolve))
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api${endpoint}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    return { status: response.status, data: await response.json() }
  } finally { await new Promise(resolve => server.close(resolve)) }
}

test('ID scan requires explicit member consent before opening the engine', async () => {
  const { app, called } = setup()
  const result = await post(app, '/admin/identity/verify-id', { name: 'Mia Cruz', email: 'mia@example.test', idType: 'philid', image })
  assert.equal(result.status, 400)
  assert.equal(called.length, 0)
})

test('ID and facial scans issue verified enrollment proof tied to member details', async () => {
  const { app, called } = setup()
  const first = await post(app, '/admin/identity/verify-id', { name: 'Mia Cruz', email: 'mia@example.test', idType: 'philid', consent: true, image, backImage: 'data:image/jpeg;base64,' + Buffer.from('different back image bytes').toString('base64') })
  assert.equal(first.status, 200)
  const second = await post(app, '/admin/identity/verify-face', { ticket: first.data.ticket, frames, motion })
  assert.equal(second.status, 200)
  assert.equal(called.length, 2)
  assert.ok(called[0].backImage, 'Card ID verification forwards the separately captured back')
  assert.ok(second.data.enrollmentProof)
  assert.equal(second.data.enrollmentProof.split('.').length, 1, 'Enrollment evidence must be an opaque ticket, never a readable JWT')
})

test('member face-login challenge is required for a session, not a caller-supplied flag', async () => {
  const { app, called } = setup()
  const challenge = issueProof({ purpose: 'face_login', memberId, authVersion: 0 }, secret)
  const noFrames = await post(app, '/auth/face-login', { challenge, frames: {} })
  assert.equal(noFrames.status, 400)
  assert.equal(called.length, 0)
  const valid = await post(app, '/auth/face-login', { challenge, frames, motion })
  assert.equal(valid.status, 200)
  assert.equal(valid.data.token, 'session-token')
  assert.equal(called.length, 1)
  const replay = await post(app, '/auth/face-login', { challenge, frames, motion })
  assert.equal(replay.status, 403)
})

test('face login refuses accounts without an enrolled template', async () => {
  const { app, called } = setup({ faceTemplate: null })
  const challenge = issueProof({ purpose: 'face_login', memberId, authVersion: 0 }, secret)
  const result = await post(app, '/auth/face-login', { challenge, frames, motion })
  assert.equal(result.status, 503)
  assert.equal(called.length, 0)
})

test('card ID verification requires an explicitly captured back-side image', async () => {
  const { app, called } = setup()
  const result = await post(app, '/admin/identity/verify-id', {
    name: 'Mia Cruz', email: 'mia@example.test', idType: 'philid', consent: true, image
  })
  assert.equal(result.status, 400)
  assert.equal(result.data.code, 'INVALID_IMAGE')
  assert.equal(called.length, 0, 'Biometrics must not run without the second capture')
})

test('passport accepts its photo page without an ID-card back', async () => {
  const { app, called } = setup()
  const result = await post(app, '/admin/identity/verify-id', {
    name: 'Mia Cruz', email: 'mia@example.test', idType: 'passport', consent: true, image
  })
  assert.equal(result.status, 200)
  assert.equal(called.length, 1)
  assert.equal(called[0].backImage, undefined)
})

test('live preview requires authenticated admin and only supplies transient guidance', async () => {
  const { app, called } = setup()
  const response = await post(app, '/admin/identity/id-guidance', { image })
  assert.equal(response.status, 200)
  assert.equal(called[0].task, 'id-guidance')
  assert.equal(called[0].image, image)
})

test('facial login rejects static three-photo submission without motion evidence', async () => {
  const { app, called } = setup()
  const challenge = issueProof({ purpose: 'face_login', memberId, authVersion: 0 }, secret)
  const response = await post(app, '/auth/face-login', { challenge, frames })
  assert.equal(response.status, 400)
  assert.equal(response.data.code, 'MOTION_REQUIRED')
  assert.equal(called.length, 0)
})

test('face preview requires signed login challenge before calling the model', async () => {
  const { app, called } = setup()
  const blocked = await post(app, '/auth/face-guidance', { image, challenge: 'fake' })
  assert.equal(blocked.status, 403)
  assert.equal(called.length, 0)
  const challenge = issueProof({ purpose: 'face_login', memberId, authVersion: 0 }, secret)
  const result = await post(app, '/auth/face-guidance', { image, challenge })
  assert.equal(result.status, 200)
  assert.equal(called[0].task, 'face-guidance')
})

test('a single PDF document is accepted without a separate back image', async () => {
  const { app, called } = setup()
  const pdf = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.7\nmock PDF').toString('base64')
  const result = await post(app, '/admin/identity/verify-id', {
    name: 'Mia Cruz', email: 'mia@example.test', idType: 'philid', consent: true, document: pdf
  })
  assert.equal(result.status, 200)
  assert.equal(called[0].document, pdf)
  assert.equal(called[0].backImage, undefined)
  assert.equal(called[0].image, undefined)
})

test('PDF uploads reject non-PDF data and do not reach biometrics', async () => {
  const { app, called } = setup()
  const result = await post(app, '/admin/identity/verify-id', {
    name: 'Mia Cruz', email: 'mia@example.test', idType: 'philid', consent: true, document: image
  })
  assert.equal(result.status, 400)
  assert.equal(result.data.code, 'INVALID_PDF')
  assert.equal(called.length, 0)
})

test('uploaded image IDs still require both front and back', async () => {
  const { app, called } = setup()
  const result = await post(app, '/admin/identity/verify-id', {
    name: 'Mia Cruz', email: 'mia@example.test', idType: 'philid', consent: true, image
  })
  assert.equal(result.status, 400)
  assert.equal(called.length, 0)
})
