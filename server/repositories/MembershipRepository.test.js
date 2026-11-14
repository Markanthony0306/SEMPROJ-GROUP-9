
import test from 'node:test'
import assert from 'node:assert/strict'
import { MembershipRepository } from './MembershipRepository.js'

const request = {
  previousMember: {
    id: '11111111-1111-4111-8111-111111111111',
    subscriptionId: '22222222-2222-4222-8222-222222222222'
  },

  renewedMember: {
    subscriptionId: '33333333-3333-4333-8333-333333333333',
    membershipStart: '2026-11-01T10:00:00.000Z',
    membershipEnd: '2026-12-31T10:00:00.000Z',
    subscriptionCreatedAt: '2026-11-11T10:00:00.000Z'
  },

  payment: {
    id: '44444444-4444-4444-8444-444444444444',
    method: 'Cash',
    amount: 600
  },

  planRecord: {
    plan_id: 2
  },

  actorId: '55555555-5555-4555-8555-555555555555'
}

test('calls the atomic renewal RPC with the correct fields', async () => {
  let calledName
  let calledPayload

  const fakeSupabase = {
    async rpc(name, payload) {
      calledName = name
      calledPayload = payload

      return {
        data: {
          subscription_id: request.renewedMember.subscriptionId
        },
        error: null
      }
    }
  }

  const repository = new MembershipRepository(fakeSupabase)

  const result = await repository.saveRenewal(request)

  assert.equal(
    calledName,
    'renew_fitpulse_membership_atomic'
  )

  assert.deepEqual(calledPayload, {
    p_member_id: request.previousMember.id,
    p_actor_id: request.actorId,
    p_plan_id: 2,
    p_method_name: 'Cash',
    p_amount: 600,
    p_expected_subscription_id: request.previousMember.subscriptionId,
    p_new_subscription_id: request.renewedMember.subscriptionId,
    p_new_payment_id: request.payment.id,
    p_start_date: request.renewedMember.membershipStart,
    p_end_date: request.renewedMember.membershipEnd,
    p_renewed_at: request.renewedMember.subscriptionCreatedAt
  })

  assert.equal(
    result.subscription_id,
    request.renewedMember.subscriptionId
  )
})

test('reports failed RPC writes without pretending the renewal succeeded', async () => {
  const fakeSupabase = {
    async rpc() {
      return {
        data: null,
        error: { message: 'Database unavailable' }
      }
    }
  }

  const repository = new MembershipRepository(fakeSupabase)

  await assert.rejects(
    repository.saveRenewal(request),
    (error) => {
      assert.equal(error.code, 'MEMBERSHIP_SAVE_FAILED')
      return true
    }
  )
})

test('identifies a concurrency conflict', async () => {
  const fakeSupabase = {
    async rpc() {
      return {
        data: null,
        error: { message: 'MEMBERSHIP_RENEWAL_CONFLICT' }
      }
    }
  }

  const repository = new MembershipRepository(fakeSupabase)

  await assert.rejects(
    repository.saveRenewal(request),
    (error) => {
      assert.equal(error.code, 'MEMBERSHIP_RENEWAL_CONFLICT')
      return true
    }
  )
})
