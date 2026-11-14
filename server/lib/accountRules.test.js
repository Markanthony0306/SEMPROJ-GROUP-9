import test from 'node:test'
import assert from 'node:assert/strict'
import { availablePlan, validAccountInput, paymentMethod, publicAccount } from './accountRules.js'

test('account validation normalizes fields without changing existing API messages', () => {
  assert.deepEqual(validAccountInput({ name: ' Test ', email: 'TEST@EXAMPLE.COM ', plan: ' Monthly - Student ', phone: ' 123 ' }), {
    name: 'Test', email: 'test@example.com', plan: 'Monthly - Student', phone: '123'
  })
  assert.deepEqual(validAccountInput({ name: '', email: 'a@b.co', plan: 'Monthly' }), { error: 'Please enter a name of up to 100 characters.' })
})

test('payment method preserves Cash default and GCash handling', () => {
  assert.equal(paymentMethod({}), 'Cash')
  assert.equal(paymentMethod({ method: 'gcash' }), 'GCash')
  assert.equal(paymentMethod({ method: 'invalid' }), null)
})

test('retired and inactive plans are not available', () => {
  const active = { is_active: true, plan_name: 'Monthly - Student' }
  assert.equal(availablePlan(active, 'monthly - student'), true)
  assert.equal(availablePlan({ ...active, is_active: false }, 'monthly - student'), false)
})
