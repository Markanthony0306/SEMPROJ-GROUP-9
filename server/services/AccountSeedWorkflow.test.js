import test from 'node:test'
import assert from 'node:assert/strict'
import { AccountSeedWorkflow } from './AccountSeedWorkflow.js'

function makeFakeRepository() {
  const state = {
    accounts: [],
    membershipPlans: [
      { plan_id: 2, plan_name: 'Monthly - Student', duration_days: 30, is_active: true }
    ],
    attendance: [],
    payments: []
  }
  const authUsers = []
  let saves = 0
  const repository = {
    load: async () => state,
    save: async () => { saves += 1 },
    findAuthUsersPage: async () => ({ data: { users: authUsers }, error: null }),
    createAuthUser: async ({ email, name }) => {
      const user = { id: `auth-${authUsers.length + 1}`, email, user_metadata: { name } }
      authUsers.push(user)
      return { data: { user }, error: null }
    }
  }
  return { state, authUsers, repository, getSaves: () => saves }
}

function makeWorkflow(repository, isProduction) {
  return new AccountSeedWorkflow({
    repository,
    isProduction,
    passwordPolicy: (value) => value.length >= 8,
    passwordPolicyMessage: 'At least eight characters required.',
    availablePlan: (plan, name) => plan.plan_name === name && plan.is_active,
    addMembershipDays: (isoDate, days) =>
      new Date(Date.parse(isoDate) + days * 86_400_000).toISOString()
  })
}

test('development startup creates existing demo/admin defaults and sample activity', async () => {
  const { state, authUsers, repository } = makeFakeRepository()
  await makeWorkflow(repository, false).run()
  assert.equal(state.accounts.length, 2)
  assert.deepEqual(state.accounts.map((x) => x.role), ['admin', 'user'])
  assert.equal(authUsers.length, 2)
  assert.equal(state.attendance.length, 4)
  assert.equal(state.payments.length, 2)
  assert.equal(state.accounts[1].plan, 'Monthly - Student')
})

test('development startup does not duplicate existing demo accounts or activity', async () => {
  const { state, authUsers, repository } = makeFakeRepository()
  const workflow = makeWorkflow(repository, false)
  await workflow.run()
  const accountsBefore = state.accounts.map((x) => x.id)
  await workflow.run()
  assert.deepEqual(state.accounts.map((x) => x.id), accountsBefore)
  assert.equal(authUsers.length, 2)
  assert.equal(state.attendance.length, 4)
  assert.equal(state.payments.length, 2)
})

test('production startup does not create demo accounts or demo activity', async () => {
  const { state, authUsers, repository } = makeFakeRepository()
  const previous = process.env.ADMIN_PASSWORD
  process.env.ADMIN_PASSWORD = 'development-test-admin-only'
  try {
    await makeWorkflow(repository, true).run()
  } finally {
    if (previous === undefined) delete process.env.ADMIN_PASSWORD
    else process.env.ADMIN_PASSWORD = previous
  }
  assert.equal(state.accounts.length, 1)
  assert.equal(state.accounts[0].role, 'admin')
  assert.equal(authUsers.length, 1)
  assert.equal(state.attendance.length, 0)
  assert.equal(state.payments.length, 0)
})
