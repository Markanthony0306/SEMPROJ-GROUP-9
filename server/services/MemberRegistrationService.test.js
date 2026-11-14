
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  MemberRegistrationService,
  MemberRegistrationError
} from './MemberRegistrationService.js'

function createService() {
  return new MemberRegistrationService({
    validAccountInput(body) {
      const name = String(body.name || '').trim()
      const email = String(body.email || '').trim().toLowerCase()
      const plan = String(body.plan || '').trim()

      if (!name || !email || !plan) {
        return { error: 'Complete all required fields.' }
      }

      return { name, email, plan, phone: '' }
    },

    paymentMethod(body) {
      if (body.method === undefined) return 'Cash'

      const method = String(body.method).trim().toLowerCase()

      if (method === 'cash') return 'Cash'
      if (method === 'gcash') return 'GCash'

      return null
    },

    availablePlan(plan, name) {
      return plan.is_active &&
        plan.plan_name.toLowerCase() === name.toLowerCase()
    }
  })
}

function createDatabase() {
  return {
    accounts: [],
    membershipPlans: [
      {
        plan_id: 2,
        plan_name: 'Monthly',
        duration_days: 30,
        price: 600,
        is_active: true
      }
    ],
    paymentMethods: [
      { method_name: 'Cash' },
      { method_name: 'GCash' }
    ]
  }
}

function createBody(overrides = {}) {
  return {
    name: 'Mia Cruz',
    email: 'mia@example.test',
    plan: 'Monthly',
    method: 'Cash',
    recordPayment: true,
    ...overrides
  }
}

test('prepares valid registration information', () => {
  const service = createService()

  const result = service.prepare({
    body: createBody(),
    database: createDatabase()
  })

  assert.equal(result.input.name, 'Mia Cruz')
  assert.equal(result.input.email, 'mia@example.test')
  assert.equal(result.planRecord.plan_id, 2)
  assert.equal(result.method, 'Cash')
  assert.equal(result.recordPayment, true)
})

test('rejects incomplete registration details', () => {
  const service = createService()

  assert.throws(
    () => service.prepare({
      body: createBody({ name: '' }),
      database: createDatabase()
    }),
    MemberRegistrationError
  )
})

test('rejects unavailable membership plans', () => {
  const service = createService()

  assert.throws(
    () => service.prepare({
      body: createBody({ plan: 'Unknown Plan' }),
      database: createDatabase()
    }),
    /not active in Supabase/
  )
})

test('rejects unsupported payment methods when recording payment', () => {
  const service = createService()

  assert.throws(
    () => service.prepare({
      body: createBody({ method: 'Credit Card' }),
      database: createDatabase()
    }),
    /Choose Cash or GCash/
  )
})

test('rejects unconfigured payment methods', () => {
  const service = createService()
  const database = createDatabase()

  database.paymentMethods = []

  assert.throws(
    () => service.prepare({
      body: createBody(),
      database
    }),
    /not configured in Supabase/
  )
})

test('rejects duplicate email addresses with status 409', () => {
  const service = createService()
  const database = createDatabase()

  database.accounts.push({
    id: 'existing-member',
    email: 'MIA@example.test'
  })

  assert.throws(
    () => service.prepare({
      body: createBody(),
      database
    }),
    (error) => {
      assert.ok(error instanceof MemberRegistrationError)
      assert.equal(error.status, 409)
      return true
    }
  )
})

test('allows registration without recording a payment', () => {
  const service = createService()

  const result = service.prepare({
    body: createBody({
      recordPayment: false,
      method: 'Credit Card'
    }),
    database: createDatabase()
  })

  assert.equal(result.recordPayment, false)
  assert.equal(result.planRecord.plan_id, 2)
})
