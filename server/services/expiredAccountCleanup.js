import { accountDeletionDeadline } from '../../shared/membershipExpiry.js'
import { withMemberAccountLock } from '../lib/memberAccountLock.js'
import { deleteMemberAccount } from './accountDeletion.js'

const CHECK_INTERVAL_MS = 60 * 60 * 1000
const CHECK_FAILURE =
  'Automatic expired-account cleanup failed. Check the database connection and migration 006_delete_member_accounts.sql.'

class AccountChangedError extends Error {
  constructor() {
    super('The member account or membership changed before automatic deletion.')
    this.name = 'AccountChangedError'
    this.status = 409
  }
}

function isDue(account, time) {
  const deadline = accountDeletionDeadline(account)
  return Boolean(
    Number.isFinite(time) &&
    account &&
    ['user', 'member'].includes(account.role) &&
    typeof account.id === 'string' &&
    account.id.trim() &&
    typeof account.authUserId === 'string' &&
    account.authUserId.trim() &&
    typeof account.subscriptionId === 'string' &&
    account.subscriptionId.trim() &&
    deadline !== null &&
    deadline <= time
  )
}

function sameMembership(left, right) {
  return (
    left.id === right.id &&
    left.authUserId === right.authUserId &&
    left.subscriptionId === right.subscriptionId &&
    Date.parse(left.membershipEnd) === Date.parse(right.membershipEnd)
  )
}

// Run only in the trusted API process with its privileged Supabase client.
// Migration 006 handles Auth/profile/history cleanup; the shared deletion
// helper also removes private photos. Missing setup fails before deletion.
// Runs are serialized within this service. The shared member lock makes the
// renewal endpoint and this entire deletion sequence wait for each other in
// one API process. Fresh checks also catch changes from other processes, but
// multiple server instances still need database-level coordination for a
// strict guarantee between the final read and the external Auth deletion.
export function createExpiredAccountCleanupService({
  supabase,
  loadDatabase,
  loadAccount,
  deleteAccount = deleteMemberAccount,
  logger = console,
  now = Date.now
}) {
  let running = null
  let lastCheckedAt = null
  let lastCounts = null
  let lastError = null

  async function checkDue() {
    const time = now()
    if (!Number.isFinite(time)) throw new Error('The cleanup clock is unavailable.')
    const database = await loadDatabase(['accounts'])
    if (!Array.isArray(database?.accounts))
      throw new Error('The member account list is unavailable.')

    const counts = { deleted: 0, skipped: 0, failed: 0 }
    const visited = new Set()
    for (const candidate of database.accounts) {
      if (!isDue(candidate, time) || visited.has(candidate.id)) continue
      visited.add(candidate.id)
      try {
        await withMemberAccountLock(candidate.id, async () => {
          const account = await loadAccount(candidate.id)
          if (!isDue(account, now()) || !sameMembership(candidate, account)) {
            counts.skipped += 1
            return
          }

          async function beforeDelete() {
            const current = await loadAccount(account.id)
            if (!isDue(current, now()) || !sameMembership(account, current))
              throw new AccountChangedError()
          }

          await deleteAccount({ supabase, account, beforeDelete })
          counts.deleted += 1
        })
      } catch (error) {
        if (error instanceof AccountChangedError) {
          counts.skipped += 1
        } else {
          counts.failed += 1
          // Provider messages may contain private data. Keep diagnostics static.
          logger.error(
            'Automatic deletion of an expired member account failed; it will be retried. Check Supabase and migration 006_delete_member_accounts.sql.'
          )
        }
      }
    }
    return counts
  }

  function runDue() {
    // Startup, a timer and manual callers share the same in-flight batch.
    if (!running)
      running = checkDue()
        .then((counts) => {
          lastCheckedAt = new Date(now()).toISOString()
          lastCounts = counts
          lastError = counts.failed ? CHECK_FAILURE : null
          return counts
        })
        .catch((cause) => {
          lastCheckedAt = Number.isFinite(now()) ? new Date(now()).toISOString() : null
          lastCounts = null
          lastError = CHECK_FAILURE
          throw new Error(CHECK_FAILURE, { cause })
        })
        .finally(() => {
          running = null
        })
    return running
  }

  const getStatus = () => ({ running: Boolean(running), lastCheckedAt, lastCounts, lastError })
  return { runDue, getStatus }
}

// Check once at startup, then one hour after each completed batch. The API must
// remain running; a sleeping/offline host catches up on its next successful run.
export function startExpiredAccountCleanup({
  runDue,
  logger = console,
  setTimer = setTimeout,
  clearTimer = clearTimeout
}) {
  let stopped = false
  let timer

  async function tick() {
    if (stopped) return
    try {
      const result = await runDue()
      if (result.deleted || result.failed)
        logger.info(`Expired-account cleanup: ${result.deleted} deleted, ${result.failed} failed.`)
    } catch {
      logger.error(CHECK_FAILURE)
    } finally {
      if (!stopped) {
        timer = setTimer(tick, CHECK_INTERVAL_MS)
        timer?.unref?.()
      }
    }
  }

  void tick()
  return () => {
    stopped = true
    clearTimer(timer)
  }
}
