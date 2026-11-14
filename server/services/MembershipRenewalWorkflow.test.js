
import test from 'node:test'
import assert from 'node:assert/strict'

import { MembershipService } from './MembershipService.js'
import { MembershipRenewalWorkflow } from './MembershipRenewalWorkflow.js'

const NOW = '2026-11-11T10:00:00.000Z'
const ACTOR_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

function makeMember() {
  return {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    name: 'Test Member',
    role: 'user',
    status: 'active',
    membershipStart: '2026-11-01T10:00:00.000Z',
    membershipEnd: '2026-12-01T10:00:00.000Z',
    subscriptionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  }
}

const planRecord = {
  plan_id: 2,
  plan_name: 'Monthly',
  duration_days: 30,
  price: 600,
  is_active: true
}

const paymentDetails = {
  method: 'Cash',
  paymentMethods: [{ method_name: 'Cash' }],
  amount: 600
}

function makeService() {
  let number = 0

  return new MembershipService({
    now: () => new Date(NOW),
    createId: () =>
      `00000000-0000-4000-8000-${String(++number).padStart(12, '0')}`
  })
}

// TEST 1: Successful workflow
test('saves one renewal and preserves the original subscription ID', async () => {
  const member = makeMember()
  const original = structuredClone(member)
  let callCount = 0

  const repository = {
    async saveRenewal(request) {
      callCount++

      assert.equal(
        request.previousMember.subscriptionId,
        original.subscriptionId
      )

      assert.notEqual(
        request.renewedMember.subscriptionId,
        original.subscriptionId
      )

      assert.equal(
        request.payment.subscriptionId,
        request.renewedMember.subscriptionId
      )

      assert.equal(request.actorId, ACTOR_ID)

      return {
        subscription_id: request.renewedMember.subscriptionId
      }
    }
  }

  const workflow = new MembershipRenewalWorkflow({
    service: makeService(),
    repository
  })

  const result = await workflow.execute({
    member,
    planRecord,
    paymentDetails,
    actorId: ACTOR_ID
  })

  assert.equal(callCount, 1)
  assert.deepEqual(member, original)
  assert.equal(
    result.member.membershipEnd,
    '2026-12-31T10:00:00.000Z'
  )
  assert.equal(result.payment.processedByUserId, ACTOR_ID)
})

// TEST 2: Database failure
test('does not modify the original member when saving fails', async () => {
  const member = makeMember()
  const original = structuredClone(member)

  const repository = {
    async saveRenewal() {
      throw new Error('Simulated database failure')
    }
  }

  const workflow = new MembershipRenewalWorkflow({
    service: makeService(),
    repository
  })

  await assert.rejects(
    workflow.execute({
      member,
      planRecord,
      paymentDetails,
      actorId: ACTOR_ID
    }),
    /Simulated database failure/
  )

  assert.deepEqual(member, original)
})

// TEST 3: Validation failure
test('does not call the repository for invalid renewal details', async () => {
  const member = makeMember()
  let calls = 0

  const repository = {
    async saveRenewal() {
      calls++
    }
  }

  const workflow = new MembershipRenewalWorkflow({
    service: makeService(),
    repository
  })

  await assert.rejects(
    workflow.execute({
      member,
      planRecord,
      paymentDetails: {
        ...paymentDetails,
        amount: -100
      },
      actorId: ACTOR_ID
    }),
    /Invalid payment amount/
  )

  assert.equal(calls, 0)
})
