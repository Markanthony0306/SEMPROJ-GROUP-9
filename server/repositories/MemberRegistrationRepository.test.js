
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  MemberRegistrationRepository,
  MemberRegistrationPersistenceError
} from './MemberRegistrationRepository.js'

const request = {
  actorId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  authUserId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',

  input: {
    name: 'Mia Cruz',
    email: 'mia@example.test',
    phone: '09170000000'
  },

  planRecord: {
    plan_id: 2,
    plan_name: 'Monthly'
  },

  recordPayment: true,
  method: 'GCash'
}

// TEST 1: Correct RPC parameters.
test('sends the correct registration parameters to Supabase', async () => {
  let calledName
  let calledPayload

  const fakeSupabase = {
    async rpc(name, payload) {
      calledName = name
      calledPayload = payload

      return {
        data: {
          member_id: 'member-id',
          member_code: 'FP-ABC12345',
          subscription_id: 'subscription-id',
          payment_id: 'payment-id'
        },
        error: null
      }
    }
  }

  const repository = new MemberRegistrationRepository(fakeSupabase)

  const result = await repository.register(request)

  assert.equal(
    calledName,
    'register_fitpulse_member_atomic'
  )

  assert.deepEqual(calledPayload, {
    p_actor_id: request.actorId,
    p_auth_user_id: request.authUserId,
    p_name: 'Mia Cruz',
    p_email: 'mia@example.test',
    p_phone: '09170000000',
    p_plan_id: 2,
    p_record_payment: true,
    p_method_name: 'GCash'
  })

  assert.equal(result.member_code, 'FP-ABC12345')
  assert.equal(result.payment_id, 'payment-id')
})

// TEST 2: Registration without payment.
test('does not request a payment when recordPayment is false', async () => {
  let calledPayload

  const fakeSupabase = {
    async rpc(name, payload) {
      calledPayload = payload

      return {
        data: {
          member_id: 'member-id',
          subscription_id: 'subscription-id',
          payment_id: null
        },
        error: null
      }
    }
  }

  const repository = new MemberRegistrationRepository(fakeSupabase)

  await repository.register({
    ...request,
    recordPayment: false,
    method: 'Cash'
  })

  assert.equal(calledPayload.p_record_payment, false)
  assert.equal(calledPayload.p_method_name, null)
})

// TEST 3: Database failure.
test('handles a failed registration RPC', async () => {
  const rawError = {
    code: 'XX000',
    message: 'Internal SQL details'
  }

  const fakeSupabase = {
    async rpc() {
      return {
        data: null,
        error: rawError
      }
    }
  }

  const repository = new MemberRegistrationRepository(fakeSupabase)

  await assert.rejects(
    repository.register(request),
    (error) => {
      assert.ok(
        error instanceof MemberRegistrationPersistenceError
      )

      assert.equal(error.code, 'REGISTRATION_SAVE_FAILED')

      assert.doesNotMatch(
        error.message,
        /Internal SQL details/
      )

      assert.equal(error.cause, rawError)

      return true
    }
  )
})

// TEST 4: Duplicate database record.
test('identifies database uniqueness conflicts', async () => {
  const fakeSupabase = {
    async rpc() {
      return {
        data: null,
        error: {
          code: '23505',
          message: 'Duplicate key value'
        }
      }
    }
  }

  const repository = new MemberRegistrationRepository(fakeSupabase)

  await assert.rejects(
    repository.register(request),
    (error) => {
      assert.equal(
        error.code,
        'REGISTRATION_CONFLICT'
      )

      return true
    }
  )
})

// TEST 5: Missing database result.
test('rejects an unexpectedly empty RPC response', async () => {
  const fakeSupabase = {
    async rpc() {
      return {
        data: null,
        error: null
      }
    }
  }

  const repository = new MemberRegistrationRepository(fakeSupabase)

  await assert.rejects(
    repository.register(request),
    (error) => {
      assert.equal(
        error.code,
        'REGISTRATION_INVALID_RESULT'
      )

      return true
    }
  )
})
