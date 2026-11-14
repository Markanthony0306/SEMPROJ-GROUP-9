import test from 'node:test'
import assert from 'node:assert/strict'
import { PasswordRecoveryService, PasswordRecoveryWorkflowError } from './PasswordRecoveryService.js'
import { PasswordRecoveryWorkflow } from './PasswordRecoveryWorkflow.js'

function setup({ profile = { email: 'member@example.com', status: 'active' }, lookupError = null, sendError = null, exchangeError = null, exchangeToken = 'recovery-token', authError = null, authUser = { id: 'auth-1' }, linkedProfile = { id: 'member-1', auth_user_id: 'auth-1', auth_version: 2 }, linkedError = null, updateError = null, stateError = null } = {}) {
  const calls = []
  const repository = {
    async findProfileByEmail(email) {
      calls.push(['findProfileByEmail', email])
      return { data: profile, error: lookupError }
    },
    async sendResetLink(email, redirectTo) {
      calls.push(['sendResetLink', email, redirectTo])
      return { error: sendError }
    },
    async exchangeCode(code) {
      calls.push(['exchangeCode', code])
      return { data: { session: exchangeToken ? { access_token: exchangeToken } : null }, error: exchangeError }
    },
    async getAuthUser(token) {
      calls.push(['getAuthUser', token])
      return { data: { user: authUser }, error: authError }
    },
    async findLinkedProfile(authId) {
      calls.push(['findLinkedProfile', authId])
      return { data: linkedProfile, error: linkedError }
    },
    async setAuthPassword(authId, password) {
      calls.push(['setAuthPassword', authId, password])
      return { error: updateError }
    },
    async updatePasswordState(state) {
      calls.push(['updatePasswordState', state.id, state.auth_version])
      return { error: stateError }
    }
  }
  const workflow = new PasswordRecoveryWorkflow({
    service: new PasswordRecoveryService({
      emailPattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
      passwordPolicy: value => typeof value === 'string' && value.length >= 8,
      passwordPolicyMessage: 'Invalid password'
    }),
    repository,
    clientUrl: 'http://localhost:5173'
  })
  return { workflow, calls }
}
const generic = { message: 'If that email exists, a reset link was sent.' }
const resetArgs = { body: { password: 'newpassword123' }, authorization: 'Bearer user-session-token' }

async function checkRejection(thunk, status, message) {
  await assert.rejects(thunk, err =>
    err instanceof PasswordRecoveryWorkflowError && err.status === status && err.message === message
  )
}

test('forgot-password never reveals invalid, missing, or inactive email accounts', async () => {
  const invalid = setup()
  assert.deepEqual(await invalid.workflow.forgotPassword({ email: 'invalid' }), generic)
  assert.deepEqual(invalid.calls, [])
  const missing = setup({ profile: null })
  assert.deepEqual(await missing.workflow.forgotPassword({ email: 'missing@example.com' }), generic)
  const inactive = setup({ profile: { email: 'member@example.com', status: 'inactive' } })
  assert.deepEqual(await inactive.workflow.forgotPassword({ email: 'member@example.com' }), generic)
  assert.ok(!inactive.calls.some(call => call[0] === 'sendResetLink'))
})

test('forgot-password sends the same Supabase reset link for active profiles', async () => {
  const { workflow, calls } = setup()
  assert.deepEqual(await workflow.forgotPassword({ email: ' Member@Example.com ' }), generic)
  assert.deepEqual(calls, [
    ['findProfileByEmail', 'member@example.com'],
    ['sendResetLink', 'member@example.com', 'http://localhost:5173/reset-password']
  ])
})

test('forgot-password retains its database-lookup error response', async () => {
  const { workflow } = setup({ lookupError: { message: 'DB down' } })
  await checkRejection(
    () => workflow.forgotPassword({ email: 'member@example.com' }),
    500,
    'Unable to process your request. Please try again.'
  )
})

test('session exchange requires an authorization code and returns the existing access token', async () => {
  const { workflow, calls } = setup()
  await checkRejection(() => workflow.exchangeSession({}), 400, 'The reset authorization code is missing.')
  assert.deepEqual(calls, [])
  assert.deepEqual(await workflow.exchangeSession({ code: 'test-code' }), { accessToken: 'recovery-token' })
})

test('session exchange rejects expired or invalid codes', async () => {
  const { workflow } = setup({ exchangeError: { message: 'invalid' } })
  await checkRejection(
    () => workflow.exchangeSession({ code: 'old-code' }),
    401,
    'This reset link is invalid or expired. Request a new one.'
  )
})

test('reset rejects invalid password, token, and recovery session before updates', async () => {
  const bad = setup()
  await checkRejection(() => bad.workflow.resetPassword({ body: { password: 'short' }, authorization: '' }), 400, 'Invalid password')
  await checkRejection(() => bad.workflow.resetPassword({ body: { password: 'newpassword123' }, authorization: '' }), 401, 'Your reset link is invalid or expired. Request a new one.')
  assert.deepEqual(bad.calls, [])
  const auth = setup({ authError: { message: 'invalid token' } })
  await checkRejection(() => auth.workflow.resetPassword(resetArgs), 401, 'Your reset link is invalid or expired. Request a new one.')
})

test('reset rejects missing linked user before updating password', async () => {
  const { workflow, calls } = setup({ linkedProfile: null })
  await checkRejection(() => workflow.resetPassword(resetArgs), 400, 'Unable to find your FitPulse account.')
  assert.ok(!calls.some(x => x[0] === 'setAuthPassword'))
})

test('reset persists both Auth password and increased token version in the original order', async () => {
  const { workflow, calls } = setup()
  assert.deepEqual(await workflow.resetPassword(resetArgs), {
    message: 'Password reset successfully. Please log in with your new password.'
  })
  assert.deepEqual(calls, [
    ['getAuthUser', 'user-session-token'],
    ['findLinkedProfile', 'auth-1'],
    ['setAuthPassword', 'auth-1', 'newpassword123'],
    ['updatePasswordState', 'member-1', 2]
  ])
})

test('reset preserves the existing Auth-update failure behavior', async () => {
  const { workflow, calls } = setup({ updateError: { message: 'Auth down' } })
  await checkRejection(() => workflow.resetPassword(resetArgs), 500, 'Unable to reset your password. Please try again.')
  assert.ok(!calls.some(call => call[0] === 'updatePasswordState'))
})

test('reset preserves the existing profile-update failure behavior after Auth changed', async () => {
  const { workflow, calls } = setup({ stateError: { message: 'Profile update down' } })
  await checkRejection(() => workflow.resetPassword(resetArgs), 500, 'Unable to reset your password. Please try again.')
  assert.ok(calls.some(call => call[0] === 'setAuthPassword'))
})
