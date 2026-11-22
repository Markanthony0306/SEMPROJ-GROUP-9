import assert from 'node:assert/strict'
import test from 'node:test'
import { buildChartDemo, assertDemoEnvironment, seedChartDemo, DEMO_SEED } from './seed-chart-demo.mjs'
import { AnalyticsService } from '../server/services/AnalyticsService.js'
import { reminderType } from '../server/services/membershipReminders.js'

const now = new Date('2026-11-22T04:00:00Z')
const plans = [
  ['Weekly', 7, 200], ['Monthly - Student', 30, 500],
  ['Monthly - Non-student', 30, 600], ['Quarterly', 90, 2200], ['Unlimited Monthly', 30, 1500]
].map(([plan_name, duration_days, price], index) => ({ plan_id: index + 1, plan_name, duration_days, price, is_active: true }))

test('five demo members populate all requested chart buckets without attendance records', async () => {
  const fixtures = buildChartDemo(plans, now)
  assert.equal(fixtures.length, 5)
  assert.equal(new Set(fixtures.map((member) => member.email)).size, 5)
  const members = fixtures.map((_, index) => ({ id: String(index), status: 'active' }))
  const subscriptions = fixtures.map((member, index) => ({
    user_id: String(index), start_date: member.start, end_date: member.end, status: 'active'
  }))
  const payments = fixtures.flatMap((member) => [member, ...member.history].map((period) => ({
    created_at: period.start, amount_paid: period.plan.price,
    method_id: period.method === 'Cash' ? 1 : 2, payment_status: 'paid'
  })))
  const service = new AnalyticsService({
    memberships: async () => ({ members, subscriptions }), payments: async () => payments,
    paymentMethods: async () => [{ method_id: 1, method_name: 'Cash' }, { method_id: 2, method_name: 'GCash' }]
  }, () => now)
  const status = await service.membershipStatus()
  assert.equal(status.totalMembers, 5)
  assert.equal(status.active, 2)
  assert.equal(status.expiringSoon, 1)
  assert.equal(status.expired, 2)
  const revenue = await service.revenue()
  assert.equal(revenue.months.length, 6)
  assert.ok(revenue.months.every((month) => month.amount > 0))
  const methods = await service.payments()
  assert.ok(methods.methods.every((method) => method.count > 0))
  for (const member of fixtures) {
    assert.match(member.name, /^\[Demo\]/)
    assert.match(member.email, /@demo\.fitpulse\.invalid$/)
    assert.equal(reminderType({
      role: 'user', status: 'active', subscriptionId: 'fixture', email: member.email,
      membershipStart: new Date(now.getTime() - 86400000).toISOString(),
      membershipEnd: new Date(now.getTime() + 3 * 86400000).toISOString()
    }, now.getTime()), null)
    assert.equal(member.attendance, undefined)
    assert.ok(member.history.every((period) => Date.parse(period.end) <= Date.parse(member.start)))
  }
})

test('production and enabled or missing verification flags stop before database access', async () => {
  for (const env of [
    { NODE_ENV: 'production', ID_VERIFICATION_ENABLED: 'false' },
    { NODE_ENV: 'development', ID_VERIFICATION_ENABLED: 'true' },
    { NODE_ENV: 'development' }
  ]) {
    assert.throws(() => assertDemoEnvironment(env), /Demo seeding requires/)
    await assert.rejects(seedChartDemo({ env }), /Demo seeding requires/)
  }
})

function existingDemoClient(owned) {
  return {
    rpc: () => assert.fail('Existing accounts must not be registered again'),
    auth: { admin: {
      getUserById: async () => ({ data: { user: { app_metadata: {
        fitpulse_demo_seed: owned ? DEMO_SEED : 'another-owner', fitpulse_demo_complete: true
      } } } })
    } },
    from(table) {
      if (table === 'payment_methods') return {
        select: async () => ({ data: [{ method_id: 1, method_name: 'Cash' }, { method_id: 2, method_name: 'GCash' }] })
      }
      assert.equal(table, 'users', 'Repeat runs must not write payment or attendance tables')
      return {
        select() { return this }, eq() { return this },
        maybeSingle: async () => ({ data: { id: 'demo-id', auth_user_id: 'auth-id', verification_status: 'skipped' } })
      }
    }
  }
}

test('repeat runs reuse completed demo members without changing their data or passwords', async () => {
  const result = await seedChartDemo({
    client: existingDemoClient(true), members: buildChartDemo(plans, now),
    env: { NODE_ENV: 'development', ID_VERIFICATION_ENABLED: 'false' },
    saveCredentials: () => assert.fail('Existing passwords must not be rewritten')
  })
  assert.deepEqual(result, { created: 0, reused: 5, paymentsCreated: 0 })
})

test('a colliding email that belongs to another account is never overwritten', async () => {
  await assert.rejects(seedChartDemo({
    client: existingDemoClient(false), members: buildChartDemo(plans, now),
    env: { NODE_ENV: 'development', ID_VERIFICATION_ENABLED: 'false' }
  }), /Refusing to modify an account not owned/)
})
