// Isolated fixtures only: never import the live server or its environment/client.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { withMemberAccountLock } from '../server/lib/memberAccountLock.js'
import {
  createExpiredAccountCleanupService,
  startExpiredAccountCleanup
} from '../server/services/expiredAccountCleanup.js'
import { ACCOUNT_DELETION_GRACE_DAYS, accountDeletionDeadline } from '../shared/membershipExpiry.js'

const DAY_MS = 86_400_000
const baseTime = Date.parse('2026-10-25T04:00:00.000Z')
const iso = (days) => new Date(baseTime + days * DAY_MS).toISOString()
const emptyCounts = { deleted: 0, skipped: 0, failed: 0 }

function fixture() {
  const member = {
    id: 'member-a',
    authUserId: 'auth-member-a',
    role: 'user',
    status: 'active',
    subscriptionId: 'subscription-a',
    membershipStart: iso(-45),
    membershipEnd: iso(-15)
  }
  const state = {
    time: baseTime,
    accounts: new Map([[member.id, member]]),
    loads: 0,
    reads: 0,
    logs: [],
    rpcCalls: [],
    removed: [],
    deleted: [],
    files: [{ name: 'avatar.jpg' }, { name: 'older-avatar.jpg' }],
    loadError: null,
    readError: null,
    setupError: null,
    setupReady: true,
    storageError: null,
    authError: null,
    beforeRead: null,
    afterList: null,
    afterRemove: null
  }
  const logger = {
    error: (message) => state.logs.push(message),
    info: (message) => state.logs.push(message)
  }
  const supabase = {
    rpc: async (name, args) => {
      state.rpcCalls.push({ name, args })
      return { data: state.setupReady, error: state.setupError }
    },
    storage: {
      from: (bucket) => {
        assert.equal(bucket, 'avatars')
        return {
          list: async (id, { limit, offset }) => {
            assert.equal(id, member.id)
            const files = structuredClone(state.files.slice(offset, offset + limit))
            state.afterList?.()
            return { data: files, error: state.storageError }
          },
          remove: async (paths) => {
            if (!state.storageError) {
              state.removed.push(...paths)
              state.files = state.files.filter(
                (file) => !paths.includes(`${member.id}/${file.name}`)
              )
              state.afterRemove?.()
            }
            return { error: state.storageError }
          }
        }
      }
    },
    auth: {
      admin: {
        deleteUser: async (id) => {
          if (!state.authError) {
            state.deleted.push(id)
            state.accounts.delete(member.id)
          }
          return { error: state.authError }
        }
      }
    }
  }
  const service = createExpiredAccountCleanupService({
    supabase,
    logger,
    now: () => state.time,
    loadDatabase: async (sections) => {
      assert.deepEqual(sections, ['accounts'])
      state.loads += 1
      if (state.loadError) throw state.loadError
      return { accounts: structuredClone([...state.accounts.values()]) }
    },
    loadAccount: async (id) => {
      state.reads += 1
      state.beforeRead?.(state.reads)
      if (state.readError) throw state.readError
      return structuredClone(state.accounts.get(id) || null)
    }
  })
  return { member, state, logger, supabase, service }
}

test('deadline is 15 elapsed days after expiry, independent of timezone', () => {
  assert.equal(ACCOUNT_DELETION_GRACE_DAYS, 15)
  assert.equal(accountDeletionDeadline({ membershipEnd: iso(-15) }), baseTime)
  assert.equal(accountDeletionDeadline({ membershipEnd: '2026-10-10T12:00:00+08:00' }), baseTime)
  for (const membershipEnd of [
    undefined,
    null,
    '',
    'invalid',
    0,
    123,
    '+275760-09-13T00:00:00.000Z'
  ])
    assert.equal(accountDeletionDeadline({ membershipEnd }), null)
  assert.equal(accountDeletionDeadline(null), null)
})

test('deletes at the exact deadline, removes all private photos and calls Auth cleanup', async () => {
  const { member, state, service } = fixture()
  state.time = baseTime - 1
  assert.deepEqual(await service.runDue(), emptyCounts)
  assert.equal(state.reads, 0)
  state.time += 1
  assert.deepEqual(await service.runDue(), { deleted: 1, skipped: 0, failed: 0 })
  assert.deepEqual(state.rpcCalls, [
    {
      name: 'check_fitpulse_account_deletion',
      args: { p_user_id: member.id, p_auth_user_id: member.authUserId }
    }
  ])
  assert.deepEqual(state.removed, ['member-a/avatar.jpg', 'member-a/older-avatar.jpg'])
  assert.deepEqual(state.deleted, ['auth-member-a'])
  assert.equal(state.accounts.has(member.id), false)
})

test('only linked members with a valid expired latest subscription are eligible', async () => {
  for (const patch of [
    { role: 'admin' },
    { role: 'staff' },
    { role: 'unknown' },
    { id: '' },
    { authUserId: null },
    { subscriptionId: '' },
    { membershipEnd: null },
    { membershipEnd: 'invalid' },
    { membershipEnd: iso(-14) },
    { membershipEnd: iso(30) }
  ]) {
    const { member, state, service } = fixture()
    Object.assign(member, patch)
    assert.deepEqual(await service.runDue(), emptyCounts)
    assert.equal(state.reads, 0)
    assert.deepEqual(state.deleted, [])
  }
  const { member, service } = fixture()
  member.role = 'member'
  assert.equal((await service.runDue()).deleted, 1)
})

test('a renewal, changed Auth link, role change or concurrent deletion cancels stale candidates', async () => {
  for (const change of [
    (f) => {
      f.member.membershipEnd = iso(30)
    },
    (f) => {
      f.member.authUserId = 'replacement-auth'
    },
    (f) => {
      f.member.subscriptionId = 'renewed-subscription'
    },
    (f) => {
      f.member.role = 'admin'
    },
    (f) => {
      f.state.accounts.delete(f.member.id)
    }
  ]) {
    const f = fixture()
    f.state.beforeRead = () => change(f)
    assert.deepEqual(await f.service.runDue(), { deleted: 0, skipped: 1, failed: 0 })
    assert.deepEqual(f.state.rpcCalls, [])
    assert.deepEqual(f.state.removed, [])
    assert.deepEqual(f.state.deleted, [])
  }
})

test('renewal after setup check and during photo listing is rechecked before mutations', async () => {
  for (const phase of ['setup', 'listing']) {
    const { member, state, service } = fixture()
    if (phase === 'setup')
      state.beforeRead = (read) => {
        if (read === 2) member.membershipEnd = iso(30)
      }
    else
      state.afterList = () => {
        member.membershipEnd = iso(30)
      }
    assert.deepEqual(await service.runDue(), { deleted: 0, skipped: 1, failed: 0 })
    assert.deepEqual(state.removed, [])
    assert.deepEqual(state.deleted, [])
  }
})

test('the final renewal guard preserves the login even after photo removal began', async () => {
  const { member, state, service } = fixture()
  state.afterRemove = () => {
    member.membershipEnd = iso(30)
  }
  assert.deepEqual(await service.runDue(), { deleted: 0, skipped: 1, failed: 0 })
  assert.equal(state.accounts.has(member.id), true)
  assert.deepEqual(state.deleted, [])
})

test('missing setup, photo failure and Auth failure remain eligible for a later retry', async () => {
  for (const flag of ['setupError', 'storageError', 'authError']) {
    const { member, state, service } = fixture()
    state[flag] = { message: 'Private provider diagnostic and member email' }
    assert.deepEqual(await service.runDue(), { deleted: 0, skipped: 0, failed: 1 })
    assert.equal(state.accounts.has(member.id), true)
    assert.deepEqual(state.deleted, [])
    assert.equal(service.getStatus().running, false)
    assert.match(service.getStatus().lastError, /006_delete_member_accounts/)
    assert.ok(state.logs.every((line) => !line.includes('Private provider')))
    if (flag === 'setupError') assert.deepEqual(state.removed, [])
    state[flag] = null
    assert.equal((await service.runDue()).deleted, 1)
    assert.equal(service.getStatus().lastError, null)
  }
})

test('failed database loading and failed current-account checks never delete and recover', async () => {
  for (const flag of ['loadError', 'readError']) {
    const { state, service } = fixture()
    state[flag] = new Error('Private account details')
    if (flag === 'loadError') {
      await assert.rejects(service.runDue(), /Automatic expired-account cleanup failed/)
      assert.equal(service.getStatus().lastCounts, null)
    } else assert.equal((await service.runDue()).failed, 1)
    assert.deepEqual(state.rpcCalls, [])
    assert.deepEqual(state.removed, [])
    assert.deepEqual(state.deleted, [])
    state[flag] = null
    assert.equal((await service.runDue()).deleted, 1)
  }
})

test('overlapping runs share one batch and successful repeated runs are idempotent', async () => {
  const { state, service } = fixture()
  const first = service.runDue()
  const second = service.runDue()
  assert.equal(first, second)
  assert.equal(service.getStatus().running, true)
  const results = await Promise.all([first, second])
  assert.equal(results[0].deleted, 1)
  assert.equal(state.loads, 1)
  assert.deepEqual(state.deleted, ['auth-member-a'])
  assert.deepEqual(await service.runDue(), emptyCounts)
  assert.deepEqual(state.deleted, ['auth-member-a'])
})

test('cleanup waits for an in-progress renewal and then preserves its account and photos', async () => {
  const { member, state, service } = fixture()
  let releaseRenewal
  let announceRenewal
  const started = new Promise((resolve) => {
    announceRenewal = resolve
  })
  const waiting = new Promise((resolve) => {
    releaseRenewal = resolve
  })
  const renewal = withMemberAccountLock(member.id, async () => {
    announceRenewal()
    await waiting
    member.subscriptionId = 'renewed-subscription'
    member.membershipEnd = iso(30)
  })
  await started
  const cleanup = service.runDue()
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(state.loads, 1)
  assert.equal(state.reads, 0)
  assert.deepEqual(state.rpcCalls, [])
  releaseRenewal()
  await renewal
  assert.deepEqual(await cleanup, { deleted: 0, skipped: 1, failed: 0 })
  assert.deepEqual(state.removed, [])
  assert.deepEqual(state.deleted, [])
  assert.equal(state.accounts.has(member.id), true)
})

test('a renewal arriving during final Auth deletion waits and sees the account is gone', async () => {
  const { member, state, supabase, service } = fixture()
  const deleteUser = supabase.auth.admin.deleteUser
  let renewal
  let renewalStarted = false
  supabase.auth.admin.deleteUser = async (id) => {
    // This is after the final expiry read. The renewal must still wait for
    // the entire Storage/Auth cleanup rather than revive a disappearing user.
    renewal = withMemberAccountLock(member.id, async () => {
      renewalStarted = true
      const current = state.accounts.get(member.id)
      if (!current) return false
      current.membershipEnd = iso(30)
      return true
    })
    await new Promise((resolve) => setImmediate(resolve))
    assert.equal(renewalStarted, false)
    return deleteUser(id)
  }
  assert.deepEqual(await service.runDue(), { deleted: 1, skipped: 0, failed: 0 })
  assert.equal(await renewal, false)
  assert.equal(renewalStarted, true)
  assert.deepEqual(state.deleted, ['auth-member-a'])
})

test('invalid database results and clocks fail closed', async () => {
  let deletions = 0
  const service = createExpiredAccountCleanupService({
    loadDatabase: async () => ({ accounts: null }),
    loadAccount: async () => null,
    deleteAccount: async () => {
      deletions += 1
    },
    now: () => baseTime
  })
  await assert.rejects(service.runDue(), /Automatic expired-account cleanup failed/)
  const f = fixture()
  f.state.time = Infinity
  await assert.rejects(f.service.runDue(), /Automatic expired-account cleanup failed/)
  assert.equal(f.state.loads, 0)
  assert.equal(deletions, 0)
})

test('scheduler checks immediately, retries hourly after errors, and stops', async () => {
  const state = { checks: 0, scheduled: null, cleared: null, logs: [] }
  const stop = startExpiredAccountCleanup({
    runDue: async () => {
      state.checks += 1
      if (state.checks === 1) throw new Error('Private provider diagnostic')
      return { deleted: 1, skipped: 0, failed: 0 }
    },
    logger: {
      error: (message) => state.logs.push(message),
      info: (message) => state.logs.push(message)
    },
    setTimer: (callback, delay) => {
      state.scheduled = { callback, delay }
      return state.scheduled
    },
    clearTimer: (timer) => {
      state.cleared = timer
    }
  })
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(state.checks, 1)
  assert.equal(state.scheduled.delay, 60 * 60 * 1000)
  assert.ok(state.logs.every((line) => !line.includes('Private provider')))
  await state.scheduled.callback()
  assert.equal(state.checks, 2)
  assert.match(state.logs[1], /1 deleted, 0 failed/)
  stop()
  assert.equal(state.cleared, state.scheduled)
  await state.scheduled.callback()
  assert.equal(state.checks, 2)
})
