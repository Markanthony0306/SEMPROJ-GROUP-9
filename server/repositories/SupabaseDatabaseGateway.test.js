import test from 'node:test'
import assert from 'node:assert/strict'
import { SupabaseDatabaseGateway } from './SupabaseDatabaseGateway.js'

test('gateway keeps the existing loadDatabase/saveDatabase snapshot contract', async () => {
  const queries = []
  const client = { from(table) { queries.push(table); throw Error('unexpected table call') } }
  const gateway = new SupabaseDatabaseGateway(client)
  const db = await gateway.loadDatabase([])
  assert.deepEqual(queries, [])
  assert.equal(db.settings.gym, 'FitPulse Gym')
  await gateway.saveDatabase(db)
  assert.deepEqual(queries, [])
})

test('gateway delegates account lookup to the original Supabase adapter', async () => {
  const client = {
    from(table) {
      assert.equal(table, 'users')
      return { select() { return { eq() { return { maybeSingle: async () => ({ data: null, error: null }) } } } } }
    }
  }
  const gateway = new SupabaseDatabaseGateway(client)
  assert.equal(await gateway.loadAccount('not-found'), null)
})

test('verification status survives account and member-list reloads', async () => {
  for (const verificationStatus of ['skipped', 'verified', 'unverified']) {
    const rows = {
      users: [{
        id: 'member', role_id: 2, name: 'Test Member', email: 'member@example.test',
        verification_status: verificationStatus,
        id_verification_id: verificationStatus === 'verified' ? 'verified-proof' : null
      }],
      roles: [{ role_id: 2, role_name: 'member' }]
    }
    const client = {
      from(table) {
        return {
          select() { return this }, eq() { return this }, order() { return this }, limit() { return this },
          async maybeSingle() { return { data: rows[table]?.[0] || null, error: null } },
          async range() { return { data: rows[table] || [], error: null } }
        }
      }
    }
    const gateway = new SupabaseDatabaseGateway(client)
    const account = await gateway.loadAccount('member')
    const database = await gateway.loadDatabase(['accounts'])
    for (const item of [account, database.accounts[0]]) {
      assert.equal(item.verificationStatus, verificationStatus)
      assert.equal(item.idVerified, verificationStatus === 'verified')
    }
  }
})
