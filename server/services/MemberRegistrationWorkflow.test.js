
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  MemberRegistrationWorkflow
} from './MemberRegistrationWorkflow.js'

const ACTOR_ID = 'admin-id'
const AUTH_ID = 'created-auth-id'

const prepared = {
  input: {
    name: 'Mia Cruz',
    email: 'mia@example.test',
    phone: ''
  },
  planRecord: {
    plan_id: 2,
    plan_name: 'Monthly',
    price: 600
  },
  recordPayment: false,
  method: 'Cash'
}

function makeWorkflow({
  dbError = null,
  authError = null,
  cleanupError = null
} = {}) {
  const calls = {
    created: [],
    registered: [],
    deleted: []
  }

  const authAdmin = {
    async createUser(input) {
      calls.created.push(input)

      if (authError) {
        return { data: null, error: authError }
      }

      return {
        data: { user: { id: AUTH_ID } },
        error: null
      }
    },

    async deleteUser(id) {
      calls.deleted.push(id)

      return { error: cleanupError }
    }
  }

  const repository = {
    async register(input) {
      calls.registered.push(input)

      if (dbError) throw dbError

      return {
        member_id: 'member-1',
        subscription_id: 'sub-1',
        payment_id: input.recordPayment ? 'pay-1' : null
      }
    }
  }

  const workflow = new MemberRegistrationWorkflow({
    authAdmin,
    repository,
    generateTemporaryPassword: () => 'Temp!1234'
  })

  return { workflow, calls }
}

// TEST 1
test('creates Auth and saves member without payment', async () => {
  const { workflow, calls } = makeWorkflow()

  const result = await workflow.execute({
    actorId: ACTOR_ID,
    prepared
  })

  assert.equal(result.persisted.member_id, 'member-1')
  assert.equal(result.temporaryPassword, 'Temp!1234')

  assert.equal(calls.created.length, 1)
  assert.equal(calls.registered.length, 1)
  assert.equal(calls.registered[0].authUserId, AUTH_ID)
  assert.equal(calls.registered[0].recordPayment, false)
  assert.equal(calls.deleted.length, 0)
})

// TEST 2
test('passes optional payment to the repository', async () => {
  const { workflow, calls } = makeWorkflow()

  const result = await workflow.execute({
    actorId: ACTOR_ID,
    prepared: {
      ...prepared,
      recordPayment: true,
      method: 'GCash'
    }
  })

  assert.equal(calls.registered[0].method, 'GCash')
  assert.equal(calls.registered[0].recordPayment, true)
  assert.equal(result.persisted.payment_id, 'pay-1')
})

// TEST 3
test('does not save if Auth creation fails', async () => {
  const { workflow, calls } = makeWorkflow({
    authError: { message: 'Auth unavailable' }
  })

  await assert.rejects(
    () => workflow.execute({
      actorId: ACTOR_ID,
      prepared
    }),
    (error) => {
      assert.equal(error.code, 'AUTH_CREATION_UNCONFIRMED')
      return true
    }
  )

  assert.equal(calls.registered.length, 0)
  assert.equal(calls.deleted.length, 0)
})

// TEST 4
test('cleans up Auth after a confirmed SQL conflict', async () => {
  const dbError = Object.assign(new Error('Duplicate'), {
    code: 'REGISTRATION_CONFLICT',
    cause: { code: '23505' }
  })

  const { workflow, calls } = makeWorkflow({ dbError })

  await assert.rejects(
    () => workflow.execute({
      actorId: ACTOR_ID,
      prepared
    }),
    (error) => {
      assert.equal(error.code, 'REGISTRATION_CONFLICT')
      assert.equal(error.status, 409)
      return true
    }
  )

  assert.deepEqual(calls.deleted, [AUTH_ID])
})

// TEST 5
test('cleans up Auth after confirmed SQL validation rejection', async () => {
  const dbError = Object.assign(new Error('Rejected'), {
    code: 'REGISTRATION_SAVE_FAILED',
    cause: {
      code: 'P0001',
      message: 'REGISTRATION_PLAN_UNAVAILABLE'
    }
  })

  const { workflow, calls } = makeWorkflow({ dbError })

  await assert.rejects(
    () => workflow.execute({
      actorId: ACTOR_ID,
      prepared
    }),
    (error) => {
      assert.equal(error.code, 'REGISTRATION_REJECTED')
      assert.equal(error.status, 400)
      return true
    }
  )

  assert.deepEqual(calls.deleted, [AUTH_ID])
})

// TEST 6
test('preserves Auth when database outcome is uncertain', async () => {
  const dbError = Object.assign(new Error('Timeout'), {
    code: 'REGISTRATION_SAVE_FAILED',
    cause: { code: 'ETIMEDOUT' }
  })

  const { workflow, calls } = makeWorkflow({ dbError })

  await assert.rejects(
    () => workflow.execute({
      actorId: ACTOR_ID,
      prepared
    }),
    (error) => {
      assert.equal(error.code, 'REGISTRATION_OUTCOME_UNCERTAIN')
      assert.equal(error.status, 503)
      return true
    }
  )

  // The account might already have a committed profile.
  assert.equal(calls.deleted.length, 0)
})

// TEST 7
test('reports a failure when Auth cleanup cannot be confirmed', async () => {
  const dbError = Object.assign(new Error('Duplicate'), {
    code: 'REGISTRATION_CONFLICT',
    cause: { code: '23505' }
  })

  const { workflow, calls } = makeWorkflow({
    dbError,
    cleanupError: { message: 'Cleanup failed' }
  })

  await assert.rejects(
    () => workflow.execute({
      actorId: ACTOR_ID,
      prepared
    }),
    (error) => {
      assert.equal(error.code, 'AUTH_CLEANUP_UNCONFIRMED')
      assert.equal(error.status, 503)
      return true
    }
  )

  assert.deepEqual(calls.deleted, [AUTH_ID])
})
