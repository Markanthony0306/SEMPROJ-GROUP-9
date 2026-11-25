import test from 'node:test'
import assert from 'node:assert/strict'
import { PasswordRecoveryService, PasswordRecoveryWorkflowError } from './PasswordRecoveryService.js'
import { PasswordRecoveryWorkflow } from './PasswordRecoveryWorkflow.js'

const active = {
  id: 'account-1',
  auth_user_id: 'auth-1',
  auth_version: 2,
  email: 'member@fixture.test',
  status: 'active'
}
const generic = { message: 'If that email exists, a reset link was sent.' }
const passwords = { password: 'NewPassword#1', confirmPassword: 'NewPassword#1' }

function setup({ profile = { ...active }, lookupError, sendError, updateError } = {}) {
  const calls = []
  const urls = []
  let now = 100_000
  let lookupDelay = 0
  const workflow = new PasswordRecoveryWorkflow({
    service: new PasswordRecoveryService({
      emailPattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
      passwordPolicy: value => typeof value === 'string' && value.length >= 8,
      passwordPolicyMessage: 'Invalid password'
    }),
    repository: {
      async findProfileByEmail(email) {
        calls.push(['findProfileByEmail', email])
        return { data: profile && { ...profile }, error: lookupError }
      },
      async sendResetLink(account, url) {
        calls.push(['sendResetLink', account.email])
        urls.push(new URL(url))
        if (sendError) throw sendError
      },
      async findLinkedProfile(id) {
        calls.push(['findLinkedProfile', id])
        now += lookupDelay
        return { data: profile }
      },
      async setAuthPassword(id, password) {
        calls.push(['setAuthPassword', id, password])
        return { error: updateError }
      },
      async updatePasswordState(account) {
        calls.push(['updatePasswordState', account.id])
        account.auth_version += 1
        return {}
      }
    },
    clientUrl: 'http://localhost:5173/fitpulse',
    now: () => now
  })
  return {
    workflow,
    calls,
    urls,
    advance: ms => { now += ms },
    delayLookup: ms => { lookupDelay = ms },
    issue: async () => {
      assert.deepEqual(await workflow.forgotPassword({ email: ' Member@Fixture.Test ' }), generic)
      return new URLSearchParams(urls.at(-1).hash.slice(1)).get('token')
    }
  }
}

const expired = error => error instanceof PasswordRecoveryWorkflowError && error.status === 410

test('forgot-password does not reveal missing or inactive accounts', async () => {
  for (const profile of [null, { ...active, status: 'inactive' }, { ...active, auth_user_id: null }]) {
    const { workflow, urls } = setup({ profile })
    assert.deepEqual(await workflow.forgotPassword({ email: active.email }), generic)
    assert.deepEqual(urls, [])
  }
  const { workflow, calls } = setup()
  assert.deepEqual(await workflow.forgotPassword(undefined), generic)
  assert.deepEqual(calls, [])
})

test('email contains an opaque token and the original expiry survives repeated checks', async () => {
  const { workflow, advance, issue, urls } = setup()
  const token = await issue()
  assert.equal(urls[0].pathname, '/fitpulse/reset-password')
  assert.equal(urls[0].search, '')
  assert.match(token, /^[A-Za-z0-9_-]{43}$/)
  assert.deepEqual(workflow.checkLink({ token }), { expiresAt: 160_000, serverNow: 100_000 })
  advance(59_999)
  assert.deepEqual(workflow.checkLink({ token }), { expiresAt: 160_000, serverNow: 159_999 })
  advance(1)
  assert.throws(() => workflow.checkLink({ token }), expired)
  await assert.rejects(() => workflow.resetPassword({ token, ...passwords }), expired)
})

test('expiry during the database lookup prevents an Auth update', async () => {
  const { workflow, issue, advance, delayLookup, calls } = setup()
  const token = await issue()
  advance(59_999)
  delayLookup(1)
  await assert.rejects(() => workflow.resetPassword({ token, ...passwords }), expired)
  assert.equal(calls.filter(([action]) => action === 'setAuthPassword').length, 0)
})

test('concurrent redemption uses the link once and invalidates older links for the account', async () => {
  const { workflow, issue, calls } = setup()
  const older = await issue()
  const token = await issue()
  assert.notEqual(older, token)
  const results = await Promise.allSettled([
    workflow.resetPassword({ token, ...passwords }),
    workflow.resetPassword({ token, ...passwords })
  ])
  assert.equal(results.filter(({ status }) => status === 'fulfilled').length, 1)
  assert.equal(results.filter(({ status, reason }) => status === 'rejected' && expired(reason)).length, 1)
  assert.equal(calls.filter(([action]) => action === 'setAuthPassword').length, 1)
  await assert.rejects(() => workflow.resetPassword({ token: older, ...passwords }), expired)
})

test('a missing or mismatched confirmation cannot consume a valid link', async () => {
  const { workflow, issue } = setup()
  const token = await issue()
  await assert.rejects(() => workflow.resetPassword({ token, password: passwords.password }), {
    status: 400,
    message: 'The new passwords do not match.'
  })
  assert.doesNotThrow(() => workflow.checkLink({ token }))
  await assert.rejects(() => workflow.resetPassword({ ...passwords }), expired)
})

test('delivery failure invalidates the token immediately', async () => {
  const { workflow, urls } = setup({ sendError: new Error('fixture SMTP rejection') })
  await assert.rejects(() => workflow.forgotPassword({ email: active.email }), /fixture SMTP rejection/)
  const token = new URLSearchParams(urls[0].hash.slice(1)).get('token')
  assert.throws(() => workflow.checkLink({ token }), expired)
})

test('a consumed link cannot be replayed after an uncertain Auth failure', async () => {
  const { workflow, issue } = setup({ updateError: { message: 'fixture Auth failure' } })
  const token = await issue()
  await assert.rejects(() => workflow.resetPassword({ token, ...passwords }), { status: 500 })
  await assert.rejects(() => workflow.resetPassword({ token, ...passwords }), expired)
})
