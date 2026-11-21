import test from 'node:test'
import assert from 'node:assert/strict'
import { AccountSeedWorkflow } from './AccountSeedWorkflow.js'
import { passwordPolicy, passwordPolicyMessage } from '../../shared/passwordPolicy.js'

const seedEnv = { ADMIN_EMAIL: 'Coach@Example.com', ADMIN_PASSWORD: 'Coach123' }

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

function makeWorkflow(repository) {
  return new AccountSeedWorkflow({
    repository,
    passwordPolicy,
    passwordPolicyMessage,
    availablePlan: (plan, name) => plan.plan_name === name && plan.is_active,
    addMembershipDays: (isoDate, days) =>
      new Date(Date.parse(isoDate) + days * 86_400_000).toISOString()
  })
}

test('development startup creates the admin without a demo member or sample activity', async () => {
  const { state, authUsers, repository } = makeFakeRepository()
  await makeWorkflow(repository).run(seedEnv)
  assert.equal(state.accounts.length, 1)
  assert.deepEqual(state.accounts.map((x) => x.role), ['admin'])
  assert.equal(authUsers.length, 1)
  assert.equal(state.accounts[0].email, 'coach@example.com')
  assert.equal(authUsers[0].email, state.accounts[0].email)
  assert.equal(state.attendance.length, 0)
  assert.equal(state.payments.length, 0)
})

test('development startup does not duplicate the admin or create demo activity', async () => {
  const { state, authUsers, repository } = makeFakeRepository()
  const workflow = makeWorkflow(repository)
  await workflow.run(seedEnv)
  const accountsBefore = state.accounts.map((x) => x.id)
  await workflow.run({ ADMIN_EMAIL: seedEnv.ADMIN_EMAIL })
  await workflow.run({})
  assert.deepEqual(state.accounts.map((x) => x.id), accountsBefore)
  assert.equal(authUsers.length, 1)
  assert.equal(state.attendance.length, 0)
  assert.equal(state.payments.length, 0)
})

test('a fresh database requires a valid private admin password', async () => {
  const { state, authUsers, repository } = makeFakeRepository()
  await assert.rejects(makeWorkflow(repository).run({}), /ADMIN_PASSWORD/)
  assert.equal(state.accounts.length, 0)
  assert.equal(authUsers.length, 0)
  assert.equal(state.attendance.length, 0)
  assert.equal(state.payments.length, 0)
})

test('an email match alone cannot promote a member or claim an unlinked Auth user', async () => {
  const { state, authUsers, repository } = makeFakeRepository()
  authUsers.push({ id: 'existing-user', email: 'coach@example.com' })
  await assert.rejects(makeWorkflow(repository).run(seedEnv), /without a linked/)
  state.accounts.push({ email: 'coach@example.com', authUserId: 'existing-user', role: 'user' })
  await assert.rejects(makeWorkflow(repository).run(seedEnv), /non-admin/)
  assert.equal(state.accounts[0].role, 'user')
})
