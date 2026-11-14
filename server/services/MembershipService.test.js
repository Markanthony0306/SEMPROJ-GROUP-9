
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  MembershipService,
  MembershipError
} from './MembershipService.js'

import { Membership } from '../models/Membership.js'


const NOW = '2026-11-11T10:00:00.000Z'

function createService() {
  let id = 0

  return new MembershipService({
    now: () => new Date(NOW),
    createId: () => `TEST-ID-${++id}`
  })
}

function makeMember(overrides = {}) {
  return {
    id: 'member-1',
    name: 'Mia Cruz',
    role: 'user',
    plan: 'Monthly',
    status: 'active',
    membershipStart: '2026-11-01T10:00:00.000Z',
    membershipEnd: '2026-12-01T10:00:00.000Z',
    ...overrides
  }
}

function makePlan(overrides = {}) {
  return {
    plan_id: 2,
    plan_name: 'Monthly',
    duration_days: 30,
    price: 600,
    is_active: true,
    ...overrides
  }
}

function makePaymentDetails(overrides = {}) {
  return {
    method: 'Cash',
    paymentMethods: [
      { method_name: 'Cash' },
      { method_name: 'GCash' }
    ],
    processedByUserId: 'admin-1',
    ...overrides
  }
}

test('renews an existing membership', () => {
  const service = createService()

  const result = service.renew(
    makeMember(),
    makePlan(),
    makePaymentDetails()
  )

  assert.equal(result.member.plan, 'Monthly')
  assert.equal(result.member.status, 'active')
  assert.equal(
  result.member.membershipStart,
  '2026-11-01T10:00:00.000Z'
)
  assert.equal(
    result.member.membershipEnd,
    '2026-12-31T10:00:00.000Z'
  )
})

test('starts a new period immediately for an expired membership', () => {
  const service = createService()

  const result = service.renew(
    makeMember({
      membershipEnd: '2026-11-10T10:00:00.000Z'
    }),
    makePlan(),
    makePaymentDetails()
  )

  assert.equal(
    result.member.membershipStart,
    NOW
  )
})

test('creates a matching renewal payment', () => {
  const service = createService()

  const result = service.renew(
    makeMember(),
    makePlan(),
    makePaymentDetails()
  )

  assert.equal(result.payment.type, 'Renewal')
  assert.equal(result.payment.amount, 600)
  assert.equal(result.payment.method, 'Cash')
  assert.equal(result.payment.subscriptionId, result.member.subscriptionId)
  assert.equal(result.payment.processedByUserId, 'admin-1')
})

test('rejects inactive membership plans', () => {
  const service = createService()

  assert.throws(
    () => service.renew(
      makeMember(),
      makePlan({ is_active: false }),
      makePaymentDetails()
    ),
    /not available|unavailable/i
  )
})

test('rejects unconfigured payment methods', () => {
  const service = createService()

  assert.throws(
    () => service.renew(
      makeMember(),
      makePlan(),
      makePaymentDetails({
        method: 'GCash',
        paymentMethods: [
          { method_name: 'Cash' }
        ]
      })
    ),
    /not configured/i
  )
})

test('does not modify the original member object', () => {
  const service = createService()
  const member = makeMember()
  const originalEnd = member.membershipEnd

  service.renew(member, makePlan(), makePaymentDetails())

  assert.equal(member.membershipEnd, originalEnd)
})

test('uses the plan price when no custom amount is supplied', () => {
  const service = createService()

  const result = service.renew(
    makeMember(),
    makePlan({ price: 780 }),
    makePaymentDetails()
  )

  assert.equal(result.payment.amount, 780)
})
test('keeps an early-renewed member eligible for QR check-in', () => {
  const service = createService()

  // Renew a member whose existing membership has not expired
  const result = service.renew(
    makeMember(),
    makePlan(),
    makePaymentDetails()
  )

  // Check the newly renewed member's QR eligibility
  const membership = new Membership(result.member)

  const checkInFailure = membership.getCheckInFailure(
    Date.parse(NOW)
  )

  // An active member should still be allowed to check in
  assert.equal(checkInFailure, '')
})
test('throws a MembershipError for invalid payment amounts', () => {
  const service = createService()

  assert.throws(
    () => service.renew(
      makeMember(),
      makePlan(),
      makePaymentDetails({ amount: -100 })
    ),
    (error) => {
      assert.ok(error instanceof MembershipError)
      assert.equal(error.code, 'INVALID_PAYMENT_AMOUNT')
      assert.equal(error.message, 'Invalid payment amount.')

      return true
    }
  )
})