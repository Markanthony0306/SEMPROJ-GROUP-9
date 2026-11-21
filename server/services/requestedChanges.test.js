import assert from 'node:assert/strict'
import test from 'node:test'
import { createSessionAuth } from '../middleware/sessionAuth.js'
import { AttendanceService } from './AttendanceService.js'
import { AttendanceWorkflow } from './AttendanceWorkflow.js'
import { MemberDeletionWorkflow } from './MemberDeletionWorkflow.js'
import { MemberDeletionService } from './MemberDeletionService.js'
import { memberRegistrationRoutes } from '../routes/memberRegistration.js'
import { accountRoutes } from '../routes/accounts.js'

test('member password session works with identity verification enabled', async () => {
  const account = { id: 'member', role: 'user', status: 'active', authVersion: 0 }
  const auth = createSessionAuth({ jwtSecret: 'test-secret', loadAccount: async () => account,
    membershipStatus: () => 'active', supabase: {}, identityVerificationEnabled: true })
  const session = auth.createSession(account)
  const req = { headers: { authorization: `Bearer ${session.token}` }, method: 'GET', path: '/api/me' }
  let passed = false
  await auth.authenticate(req, { status() { throw new Error('Session rejected') } }, () => { passed = true })
  assert.equal(passed, true)
  assert.throws(() => auth.createSession({ ...account, role: 'admin' }), /verified face/)
})

test('attendance only succeeds when storage confirms a record', () => {
  const service = new AttendanceService({ qrSecret: 'test' })
  assert.equal(service.formatResult({ result_code: 'CHECK_IN_RECORDED', attendance_id: 'one' }, { name: 'Member' }).status, 201)
  assert.throws(() => service.formatResult({ result_code: 'UNKNOWN' }, { name: 'Member' }), { code: 'CHECK_IN_UNAVAILABLE' })
  assert.throws(() => service.formatResult({ result_code: 'CHECK_IN_RECORDED' }, { name: 'Member' }), { code: 'CHECK_IN_UNAVAILABLE' })
})

test('a notification failure cannot hide a saved attendance record', async () => {
  const workflow = new AttendanceWorkflow({
    service: { validateScan() {}, verifyQr: () => ({ sub: 'member', jti: 'qr' }),
      validateMembership() {}, formatResult: () => ({ status: 201, body: { allowed: true } }) },
    repository: { findMember: async () => ({ id: 'member' }), recordCheckIn: async () => ({}) },
    onRecorded() { throw new Error('notification failed') }
  })
  assert.equal((await workflow.execute({})).body.allowed, true)
})

test('manual deletion validates the target while automatic deletion stays disabled', async () => {
  const calls = []
  const workflow = new MemberDeletionWorkflow({ service: new MemberDeletionService(), repository: {
    checkDeletionReady: async () => calls.push('ready'), listAvatarPaths: async () => [],
    deleteAuthUser: async (id) => calls.push(id)
  } })
  const member = { id: 'member', authUserId: 'auth-member', role: 'user' }
  await assert.rejects(workflow.execute({ account: member }), { code: 'PERMANENT_MEMBER_DELETION_DISABLED' })
  await assert.rejects(workflow.execute({ account: { ...member, role: 'admin' }, manual: true }), { status: 403 })
  await workflow.execute({ account: member, manual: true })
  assert.deepEqual(calls, ['ready', 'auth-member'])
})

test('member registration fails closed when identity verification is disabled', async () => {
  const router = memberRegistrationRoutes({ authenticate() {}, requireRole: () => () => {},
    identityVerificationEnabled: false })
  const handler = router.stack.find((layer) => layer.route?.path === '/admin/members').route.stack.at(-1).handle
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this } }
  await handler({ body: {} }, response)
  assert.equal(response.statusCode, 503)
  assert.equal(response.body.code, 'ID_VERIFICATION_UNAVAILABLE')
})

test('admin deletion checks Mia Cruz’s login and removes the fixture records after password confirmation', async () => {
  const admin = { id: 'admin', role: 'admin', status: 'active', email: 'admin@test.local', authUserId: 'auth-admin' }
  const member = { id: '11111111-1111-4111-8111-111111111111', name: 'Mia Cruz', role: 'user', authUserId: 'auth-member' }
  const records = new Set(['login', 'profile', 'ID', 'face', 'subscriptions', 'payments', 'attendance', 'avatar'])
  const calls = []
  let readiness = 'login_missing'
  const supabase = {
    rpc: async (name, ids) => {
      assert.equal(name, 'fitpulse_member_deletion_readiness')
      assert.deepEqual(ids, { p_user_id: member.id, p_auth_user_id: member.authUserId })
      return { data: readiness }
    },
    storage: { from: () => ({
      list: async () => ({ data: [{ name: 'profile.jpg' }] }),
      remove: async (paths) => {
        assert.deepEqual(paths, [`${member.id}/profile.jpg`])
        calls.push('avatar')
        records.delete('avatar')
        return {}
      }
    }) },
    auth: { admin: { deleteUser: async (id) => {
      assert.equal(id, member.authUserId)
      calls.push('login')
      // Stand in for the database trigger and cascades in this API fixture.
      records.clear()
      return {}
    } } }
  }
  const createAuthClient = () => ({ auth: { signInWithPassword: async ({ password }) =>
    password === 'correct' ? { data: { user: { id: 'auth-admin' } } } : { error: { code: 'invalid_credentials' } } } })
  const router = accountRoutes({ authenticate() {}, requireRole: () => () => {}, rateLimit: () => () => {},
    loadAccount: async (id) => id === admin.id ? admin : member, supabase, createAuthClient,
    emitEvent: ({ to }, alert) => { assert.equal(to, 'admins'); calls.push(alert.title) } })
  const handler = router.stack.find((layer) => layer.route?.path === '/admin/members/:id').route.stack.at(-1).handle
  const run = async (body) => {
    const response = { statusCode: 200, status(code) { this.statusCode = code; return this },
      json(value) { this.body = value; return this } }
    await handler({ body, params: { id: member.id }, user: { id: admin.id } }, response)
    return response
  }
  assert.equal((await run({ confirmation: 'wrong', currentPassword: 'correct' })).statusCode, 400)
  assert.equal((await run({ confirmation: 'DELETE', currentPassword: 'wrong' })).statusCode, 401)
  const rejected = await run({ confirmation: 'DELETE', currentPassword: 'correct' })
  assert.equal(rejected.statusCode, 409)
  assert.match(rejected.body.message, /login that no longer exists/)
  assert.deepEqual(calls, [])
  assert.equal(records.size, 8)

  readiness = 'ready'
  const removed = await run({ confirmation: 'DELETE', currentPassword: 'correct' })
  assert.equal(removed.statusCode, 200)
  assert.equal(removed.body.message, 'Member account deleted.')
  assert.deepEqual(calls, ['avatar', 'login', 'Member account deleted'])
  assert.equal(records.size, 0)
})
