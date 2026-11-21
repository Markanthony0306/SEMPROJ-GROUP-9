import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { analyticsRoutes } from './analytics.js'
import { AnalyticsService, manilaDateKey } from '../services/AnalyticsService.js'
import { AnalyticsRepository } from '../repositories/AnalyticsRepository.js'
import { createSessionAuth } from '../middleware/sessionAuth.js'

const clock = () => new Date('2026-11-21T02:00:00Z')
const endpoints = ['attendance', 'membership-status', 'revenue', 'payments']
const repository = (overrides = {}) => ({
  attendance: async () => [],
  memberships: async () => ({ members: [], subscriptions: [] }),
  payments: async () => [],
  paymentMethods: async () => [],
  ...overrides
})

test('attendance includes seven days and starts Monday at Manila midnight', async () => {
  let bounds
  const service = new AnalyticsService(
    repository({
      attendance: async (...args) => {
        bounds = args
        return [
          { check_in_time: '2026-11-15T16:00:00Z' },
          { check_in_time: '2026-11-20T16:01:00Z' },
          { check_in_time: '2026-11-21T01:00:00Z' }
        ]
      }
    }),
    clock
  )
  const result = await service.attendance()
  assert.deepEqual(bounds, [
    '2026-11-15T16:00:00.000Z',
    '2026-11-22T16:00:00.000Z',
    clock().toISOString()
  ])
  assert.equal(result.days.length, 7)
  assert.deepEqual(
    result.days.map((day) => day.count),
    [1, 0, 0, 0, 0, 2, 0]
  )
  assert.equal(result.total, 3)
})

test('Sunday remains in its week; Manila Monday starts a new week', async () => {
  const repo = repository()
  const sunday = await new AnalyticsService(
    repo,
    () => new Date('2026-11-22T15:59:59Z')
  ).attendance()
  const monday = await new AnalyticsService(
    repo,
    () => new Date('2026-11-22T16:00:00Z')
  ).attendance()
  assert.equal(sunday.weekStart, '2026-11-16')
  assert.equal(monday.weekStart, '2026-11-23')
  assert.equal(manilaDateKey('2026-12-31T16:00:00Z'), '2027-01-01')
})

test('membership buckets use the latest subscription and exact expiry time', async () => {
  const subscription = (user_id, end_date, changes = {}) => ({
    user_id,
    start_date: '2026-11-01T00:00:00+08:00',
    end_date,
    status: 'active',
    ...changes
  })
  const members = Array.from({ length: 8 }, (_, index) => ({ id: String(index), status: 'active' }))
  members[7].status = 'inactive'
  const subscriptions = [
    subscription('0', '2026-12-20T00:00:00+08:00'),
    subscription('0', '2026-11-01T00:00:00+08:00'), // Historical renewal: ignored.
    subscription('1', '2026-11-28T23:59:59+08:00'), // Inclusive seventh calendar day.
    subscription('2', clock().toISOString()), // At expiry, already expired.
    subscription('3', '2026-11-21T12:00:00+08:00'), // Later today: expiring, still valid.
    subscription('4', '2026-12-20T00:00:00+08:00', { start_date: '2026-12-01T00:00:00+08:00' }),
    subscription('5', '2026-12-20T00:00:00+08:00', { status: 'cancelled' }),
    subscription('7', '2026-12-20T00:00:00+08:00')
  ]
  const result = await new AnalyticsService(
    repository({ memberships: async () => ({ members, subscriptions }) }),
    clock
  ).membershipStatus()
  assert.deepEqual(
    {
      active: result.active,
      expiring: result.expiringSoon,
      expired: result.expired,
      unclassified: result.unclassified
    },
    { active: 1, expiring: 2, expired: 1, unclassified: 4 }
  )
  assert.equal(result.totalMembers, 8)
})

test('revenue crosses year and UTC month boundaries and sums only successful centavos', async () => {
  let bounds
  const service = new AnalyticsService(
    repository({
      payments: async (...args) => {
        bounds = args
        return [
          { created_at: '2026-12-31T16:00:00Z', payment_status: 'Paid', amount_paid: '0.10' },
          { created_at: '2027-01-01T00:00:00Z', payment_status: 'Completed', amount_paid: '0.20' },
          { created_at: '2026-12-31T15:59:59Z', payment_status: 'paid', amount_paid: '500.50' },
          { created_at: '2027-01-01T00:00:00Z', payment_status: 'Pending', amount_paid: 1000 },
          { created_at: '2027-01-01T00:00:00Z', payment_status: 'Refunded', amount_paid: 1000 },
          { created_at: '2027-01-01T00:00:00Z', payment_status: null, amount_paid: 1000 }
        ]
      }
    }),
    () => new Date('2027-01-05T00:00:00Z')
  )
  const result = await service.revenue()
  assert.equal(bounds[0], '2026-07-31T16:00:00.000Z')
  assert.deepEqual(
    result.months.map((month) => month.month),
    ['2026-08', '2026-09', '2026-10', '2026-11', '2026-12', '2027-01']
  )
  assert.equal(result.months[4].amount, 500.5)
  assert.equal(result.revenueThisMonth, 0.3)
  assert.equal(result.paymentCount, 3)
})

test('payment method share uses transaction count and excludes unsuccessful or other methods', async () => {
  const rows = [1, 1, 2, 3].map((method_id) => ({
    method_id,
    payment_status: 'Paid',
    amount_paid: 100
  }))
  rows.push({ method_id: 2, payment_status: 'Failed', amount_paid: 100 })
  const service = new AnalyticsService(
    repository({
      payments: async () => rows,
      paymentMethods: async () => [
        { method_id: 1, method_name: 'Cash' },
        { method_id: 2, method_name: 'GCash' },
        { method_id: 3, method_name: 'Card' }
      ]
    }),
    clock
  )
  assert.deepEqual((await service.payments()).methods, [
    { label: 'Cash', count: 2, percent: 66.7 },
    { label: 'GCash', count: 1, percent: 33.3 }
  ])
})

test('rounded Cash and GCash percentages sum to 100 at rounding ties', async () => {
  const rows = Array.from({ length: 2000 }, (_, index) => ({
    method_id: index < 1001 ? 1 : 2,
    payment_status: 'Paid'
  }))
  const service = new AnalyticsService(
    repository({
      payments: async () => rows,
      paymentMethods: async () => [
        { method_id: 1, method_name: 'Cash' },
        { method_id: 2, method_name: 'GCash' }
      ]
    }),
    clock
  )
  const { methods } = await service.payments()
  assert.deepEqual(
    methods.map((method) => method.percent),
    [50.1, 49.9]
  )
})

test('empty tables return real zeros, seven days, and six months without NaN', async () => {
  const service = new AnalyticsService(repository(), clock)
  assert.equal((await service.attendance()).total, 0)
  assert.equal((await service.membershipStatus()).totalMembers, 0)
  assert.equal((await service.revenue()).months.length, 6)
  assert.deepEqual(
    (await service.payments()).methods.map((method) => method.percent),
    [0, 0]
  )
})

test('repository reads beyond 1,000 rows and keeps scanner/date filters on every page', async () => {
  const calls = []
  const supabase = {
    from(table) {
      const filters = []
      const query = {}
      for (const method of ['select', 'in', 'not', 'gte', 'lt', 'lte', 'order']) {
        query[method] = (...args) => {
          filters.push([method, ...args])
          return query
        }
      }
      query.range = async (start, end) => {
        calls.push({ table, filters, start, end })
        return {
          data: Array.from({ length: start === 0 ? 1000 : 1 }, () => ({
            check_in_time: clock().toISOString()
          })),
          error: null
        }
      }
      return query
    }
  }
  const rows = await new AnalyticsRepository(supabase).attendance('start', 'end', 'now')
  assert.equal(rows.length, 1001)
  assert.equal(calls.length, 2)
  assert.deepEqual(
    calls.map(({ start, end }) => [start, end]),
    [
      [0, 999],
      [1000, 1999]
    ]
  )
  for (const call of calls) {
    assert.equal(call.table, 'attendance_logs')
    assert.ok(call.filters.some((filter) => filter[0] === 'in' && filter[2].includes('Staff')))
    assert.ok(call.filters.some((filter) => filter[0] === 'not' && filter[1] === 'qr_token_id'))
    assert.ok(call.filters.some((filter) => filter[0] === 'gte' && filter[2] === 'start'))
    assert.ok(call.filters.some((filter) => filter[0] === 'lte' && filter[2] === 'now'))
  }
})

async function withApp(run, serviceOverride) {
  const accounts = new Map(
    ['admin', 'staff', 'user'].map((role) => [
      role,
      {
        id: role,
        role,
        status: 'active',
        name: 'Analytics test',
        authVersion: 0
      }
    ])
  )
  const auth = createSessionAuth({
    jwtSecret: 'analytics-test-only-secret',
    loadAccount: async (id) => accounts.get(id),
    membershipStatus: () => 'active'
  })
  const service = serviceOverride || new AnalyticsService(repository(), clock)
  const app = express()
  app.use('/api', analyticsRoutes({ ...auth, service }))
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener))
  })
  const base = `http://127.0.0.1:${server.address().port}/api/analytics`
  const tokens = Object.fromEntries(
    [...accounts].map(([role, account]) => [role, auth.createSession(account).token])
  )
  try {
    await run(base, tokens)
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    )
  }
}

test('all endpoints reject missing sessions and signed staff/member sessions', async () => {
  let queried = false
  const forbiddenService = Object.fromEntries(
    ['attendance', 'membershipStatus', 'revenue', 'payments'].map((name) => [
      name,
      () => {
        queried = true
        throw new Error('Must not query')
      }
    ])
  )
  await withApp(async (base, tokens) => {
    for (const path of endpoints) {
      assert.equal((await fetch(`${base}/${path}`)).status, 401)
      for (const role of ['staff', 'user']) {
        assert.equal(
          (await fetch(`${base}/${path}`, { headers: { Authorization: `Bearer ${tokens[role]}` } }))
            .status,
          403
        )
      }
    }
  }, forbiddenService)
  assert.equal(queried, false)
})

test('admin sessions receive JSON aggregates with no-store on all four endpoints', async () => {
  await withApp(async (base, tokens) => {
    for (const path of endpoints) {
      const response = await fetch(`${base}/${path}`, {
        headers: { Authorization: `Bearer ${tokens.admin}` }
      })
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('cache-control'), 'no-store')
      assert.equal((await response.json()).timeZone, 'Asia/Manila')
    }
  })
})

test('database failures return a retryable error without leaking database details', async () => {
  const service = new AnalyticsService(
    repository({
      payments: async () => {
        throw new Error('Sensitive database connection detail')
      }
    }),
    clock
  )
  await withApp(async (base, tokens) => {
    const response = await fetch(`${base}/revenue`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    })
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), {
      message: 'Unable to load analytics. Please try again.'
    })
  }, service)
})
