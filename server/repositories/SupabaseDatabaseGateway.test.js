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
