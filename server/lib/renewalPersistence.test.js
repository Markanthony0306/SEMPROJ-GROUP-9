
import test from 'node:test'
import assert from 'node:assert/strict'
import { loadDatabase, saveDatabase } from './database.js'
import { MembershipService } from '../services/MembershipService.js'

const NOW = '2026-11-11T10:00:00.000Z'

// A fake Supabase client that stores records in memory
function fakeSupabase({ failOn = null } = {}) {
  const tables = {
    roles: [
      { role_id: 1, role_name: 'admin' },
      { role_id: 2, role_name: 'member' }
    ],
    users: [
      {
        id: 'admin-1',
        role_id: 1,
        name: 'Admin',
        email: 'admin@example.test',
        status: 'active',
        created_at: NOW
      },
      {
        id: 'member-1',
        role_id: 2,
        name: 'Mia Cruz',
        email: 'mia@example.test',
        status: 'active',
        created_at: '2026-11-01T10:00:00.000Z'
      }
    ],
    subscriptions: [
      {
        subscription_id: 'old-subscription',
        user_id: 'member-1',
        plan_id: 2,
        start_date: '2026-11-01T10:00:00.000Z',
        end_date: '2026-12-01T10:00:00.000Z',
        status: 'active',
        created_at: '2026-11-01T10:00:00.000Z'
      }
    ],
    membership_plans: [
      {
        plan_id: 2,
        plan_name: 'Monthly',
        duration_days: 30,
        price: 600,
        is_active: true
      }
    ],
    payment_methods: [
      { method_id: 1, method_name: 'Cash' }
    ],
    payments: []
  }

  return {
    tables,

    from(tableName) {
      return {
        select() {
          return {
            order() {
              return this
            },

            async range(start, end) {
              return {
                data: structuredClone(tables[tableName])
                  .slice(start, end + 1),
                error: null
              }
            }
          }
        },

        async upsert(rows, { onConflict } = {}) {
          // Simulate a database failure when requested
          if (tableName === failOn) {
            return {
              error: { message: 'Simulated write failure' }
            }
          }

          const records = Array.isArray(rows) ? rows : [rows]

          for (const row of records) {
            const list = tables[tableName]
            const index = list.findIndex(
              (item) => item[onConflict] === row[onConflict]
            )

            if (index >= 0) {
              list[index] = {
                ...list[index],
                ...structuredClone(row)
              }
            } else {
              list.push(structuredClone(row))
            }
          }

          return { error: null }
        }
      }
    }
  }
}

// Prepare a renewal without using the real database
async function prepareRenewal(fake) {
  const database = await loadDatabase(
    fake,
    ['accounts', 'payments']
  )

  const member = database.accounts.find(
    (account) => account.id === 'member-1'
  )

  let id = 0

  const service = new MembershipService({
    now: () => new Date(NOW),
    createId: () => `test-id-${++id}`
  })

  const result = service.renew(
    member,
    database.membershipPlans[0],
    {
      method: 'Cash',
      paymentMethods: database.paymentMethods,
      processedByUserId: 'admin-1'
    }
  )

  Object.assign(member, result.member)
  database.payments.push(result.payment)

  return { database, result }
}

// Test 1: Successful persistence
test('renewal saves linked subscription and payment', async () => {
  const fake = fakeSupabase()
  const { database, result } = await prepareRenewal(fake)

  await saveDatabase(fake, database)

  const subscription = fake.tables.subscriptions.find(
    (row) => row.subscription_id === result.member.subscriptionId
  )

  const payment = fake.tables.payments.find(
    (row) => row.payment_id === result.payment.id
  )

  assert.ok(subscription)
  assert.ok(payment)

  assert.equal(
    payment.subscription_id,
    subscription.subscription_id
  )
  assert.equal(payment.amount_paid, 600)
  assert.equal(
    subscription.end_date,
    '2026-12-31T10:00:00.000Z'
  )
})

// Test 2: Simulated database failure
test('payment failure reveals a partial database write', async () => {
  const fake = fakeSupabase({ failOn: 'payments' })
  const { database, result } = await prepareRenewal(fake)

  await assert.rejects(
    () => saveDatabase(fake, database),
    /Supabase payments query failed/
  )

  assert.ok(
    fake.tables.subscriptions.some(
      (row) => row.subscription_id === result.member.subscriptionId
    )
  )

  assert.equal(fake.tables.payments.length, 0)
})
