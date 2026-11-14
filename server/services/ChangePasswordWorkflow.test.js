import test from 'node:test'
import assert from 'node:assert/strict'

import { ChangePasswordService, ChangePasswordError } from './ChangePasswordService.js'
import { ChangePasswordWorkflow } from './ChangePasswordWorkflow.js'

function setup({ profile = { auth_user_id: 'auth-1', email: 'member@example.com' }, profileError = null, authId = 'auth-1', updateError = null, saveError = null } = {}) {
  const calls = []
  const account = { id: 'member-1', authVersion: 3, mustChangePassword: true }
  const repository = {
    async loadAccounts() {
      calls.push('loadAccounts')
      return { accounts: [account] }
    },
    async findLinkedProfile(id) {
      calls.push(['findLinkedProfile', id])
      return { data: profile, error: profileError }
    },
    async updateAuthPassword(id, password) {
      calls.push(['updateAuthPassword', id, password])
      return { error: updateError }
    },
    async save(database) {
      calls.push(['save', database.accounts[0].authVersion])
      if (saveError) throw saveError
    }
  }
  const workflow = new ChangePasswordWorkflow({
    service: new ChangePasswordService({
      passwordPolicy: (value) => typeof value === 'string' && value.length >= 8,
      passwordPolicyMessage: 'Password policy message'
    }),
    repository,
    authenticatePassword: async ({ email, password, createAuthClient }) => {
      calls.push(['authenticatePassword', email, password, createAuthClient()])
      return { id: authId }
    },
    createAuthClient: () => 'auth-client'
  })
  return { workflow, account, calls }
}
const valid = { currentPassword: 'oldpass99', password: 'newpass99', confirmPassword: 'newpass99' }

async function expectRejection(body, message) {
  const { workflow, calls } = setup()
  await assert.rejects(
    workflow.execute({ actorId: 'member-1', body }),
    (err) => err instanceof ChangePasswordError && err.status === 400 && err.message === message
  )
  assert.deepEqual(calls, [], 'input checks should run before database access')
}

test('rejects missing or oversized current passwords before database access', async () => {
  await expectRejection({ ...valid, currentPassword: '' }, 'Enter your current password (up to 72 bytes).')
  await expectRejection({ ...valid, currentPassword: 'a'.repeat(73) }, 'Enter your current password (up to 72 bytes).')
})

test('rejects an invalid, mismatched or unchanged new password', async () => {
  await expectRejection({ ...valid, password: 'short', confirmPassword: 'short' }, 'Password policy message')
  await expectRejection({ ...valid, confirmPassword: 'different' }, 'The new passwords do not match.')
  await expectRejection({ ...valid, password: valid.currentPassword, confirmPassword: valid.currentPassword }, 'Choose a password different from your current password.')
})

test('returns 404 when the authenticated account is absent', async () => {
  const { workflow } = setup()
  await assert.rejects(
    workflow.execute({ actorId: 'unknown-id', body: valid }),
    (err) => err instanceof ChangePasswordError && err.status === 404 && err.message === 'Account not found.'
  )
})

test('rejects an unlinked login profile before updating Auth', async () => {
  const { workflow, calls } = setup({ profile: null })
  await assert.rejects(
    workflow.execute({ actorId: 'member-1', body: valid }),
    (err) => err instanceof ChangePasswordError && err.status === 500 && err.message === 'Unable to verify your account. Please try again.'
  )
  assert.ok(!calls.some(x => Array.isArray(x) && x[0] === 'updateAuthPassword'))
})

test('rejects a mismatched authenticated user ID', async () => {
  const { workflow, calls } = setup({ authId: 'someone-else' })
  await assert.rejects(
    workflow.execute({ actorId: 'member-1', body: valid }),
    (err) => err instanceof ChangePasswordError && err.status === 400 && err.message === 'Current password is incorrect.'
  )
  assert.ok(!calls.some(x => Array.isArray(x) && x[0] === 'updateAuthPassword'))
})

test('propagates Auth update failure without changing the profile snapshot', async () => {
  const { workflow, account, calls } = setup({ updateError: { message: 'Auth unavailable' } })
  await assert.rejects(
    workflow.execute({ actorId: 'member-1', body: valid }),
    (err) => err instanceof ChangePasswordError && err.status === 500 && err.message === 'Unable to update your password. Please try again.'
  )
  assert.equal(account.authVersion, 3)
  assert.equal(account.mustChangePassword, true)
  assert.ok(!calls.some(x => Array.isArray(x) && x[0] === 'save'))
})

test('updates Auth, advances account version, clears flag and saves', async () => {
  const { workflow, calls, account } = setup()
  const result = await workflow.execute({ actorId: 'member-1', body: valid })
  assert.equal(result, account)
  assert.equal(result.authVersion, 4)
  assert.equal(result.mustChangePassword, false)
  assert.deepEqual(calls, [
    'loadAccounts',
    ['findLinkedProfile', 'member-1'],
    ['authenticatePassword', 'member@example.com', 'oldpass99', 'auth-client'],
    ['updateAuthPassword', 'auth-1', 'newpass99'],
    ['save', 4]
  ])
})

test('preserves existing database-save failure behavior after Auth changed', async () => {
  const { workflow, calls } = setup({ saveError: new Error('Database unavailable') })
  await assert.rejects(
    workflow.execute({ actorId: 'member-1', body: valid }),
    /Database unavailable/
  )
  assert.ok(calls.some(x => Array.isArray(x) && x[0] === 'updateAuthPassword'))
})
