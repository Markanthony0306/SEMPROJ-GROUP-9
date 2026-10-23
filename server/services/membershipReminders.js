import crypto from 'node:crypto'
import { expiryEmail } from './emailTemplates.js'

const DAY_MS = 86_400_000
const CHECK_INTERVAL_MS = 60 * 60 * 1000
const SETUP_CODES = new Set(['PGRST202', 'PGRST205', '42P01', '42703', '42501'])
const MIGRATION_PATH = 'supabase/migrations/005_admin_notifications.sql'

function databaseCode(error) {
  return /^[A-Z0-9_]{2,40}$/.test(error?.code || '') ? error.code : 'DATABASE_ERROR'
}

class ReminderSetupError extends Error {
  constructor(cause) {
    const code = databaseCode(cause)
    const message =
      code === '42501'
        ? `Automatic membership reminders are paused: Supabase access is denied (${code}). Check SUPABASE_SECRET_KEY and the grants in ${MIGRATION_PATH}.`
        : SETUP_CODES.has(code)
          ? `Automatic membership reminders are paused: Supabase reminder setup is missing (${code}). Apply ${MIGRATION_PATH} to the project in SUPABASE_URL, then run npm run check:reminders.`
          : `Automatic membership reminders are paused: Supabase setup could not be verified (${code}). Check the database connection and server key, then retry.`
    super(message, { cause })
    this.name = 'ReminderSetupError'
    this.status = 503
  }
}

export async function checkMembershipReminderSetup(supabase) {
  const results = await Promise.all([
    supabase
      .from('membership_reminders')
      .select(
        'subscription_id,membership_end,reminder_type,claim_token,claimed_until,sent_at,last_attempt_at,last_error_code,message_id'
      )
      .limit(0),
    supabase.from('gym_settings').select('email_enabled,reminder_days').limit(0)
  ])
  for (const result of results) {
    if (result.error) throw new ReminderSetupError(result.error)
  }
  // This expired, nonexistent subscription cannot qualify as an upcoming
  // reminder. Validate the function and its permissions without reserving mail.
  const { data, error } = await supabase.rpc('claim_membership_reminder', {
    p_subscription_id: '00000000-0000-0000-0000-000000000000',
    p_membership_end: '1970-01-01T00:00:00.000Z',
    p_reminder_type: 'upcoming',
    p_claim_token: '00000000-0000-0000-0000-000000000000'
  })
  if (error) throw new ReminderSetupError(error)
  if (data !== false) throw new ReminderSetupError({ code: 'UNEXPECTED_CLAIM_RESULT' })
}

export function reminderType(member, reminderDays, now = Date.now()) {
  const start = Date.parse(member.membershipStart)
  const end = Date.parse(member.membershipEnd)
  if (
    !['user', 'member'].includes(member.role) ||
    !['active', 'expired'].includes(member.status) ||
    !member.subscriptionId ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email || '') ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end <= start ||
    start > now ||
    !Number.isInteger(reminderDays) ||
    reminderDays < 1 ||
    reminderDays > 30
  )
    return null

  if (end <= now) return 'expired'
  return end <= now + reminderDays * DAY_MS ? 'upcoming' : null
}

export function createMembershipReminderService({
  supabase,
  loadDatabase,
  mailer,
  from,
  loginUrl,
  logger = console,
  now = Date.now
}) {
  let running = null
  let lastCheckedAt = null
  let lastError = null
  let lastCounts = null

  async function sendReminder(member, settings) {
    if (!mailer || !settings.emailOn) return false
    const type = reminderType(member, settings.remind, now())
    if (!type) return false

    const claimToken = crypto.randomUUID()
    const membershipEnd = new Date(member.membershipEnd).toISOString()
    const { data: claimed, error: claimError } = await supabase.rpc('claim_membership_reminder', {
      p_subscription_id: member.subscriptionId,
      p_membership_end: membershipEnd,
      p_reminder_type: type,
      p_claim_token: claimToken
    })
    if (claimError) {
      if (SETUP_CODES.has(databaseCode(claimError))) throw new ReminderSetupError(claimError)
      throw new Error(
        `Unable to reserve a membership reminder (${databaseCode(claimError)}). Check Supabase and retry.`
      )
    }
    if (!claimed) return false

    const ownedClaim = (query) =>
      query
        .eq('subscription_id', member.subscriptionId)
        .eq('membership_end', membershipEnd)
        .eq('reminder_type', type)
        .eq('claim_token', claimToken)
        .is('sent_at', null)

    const { error: attemptError } = await ownedClaim(
      supabase.from('membership_reminders').update({
        last_attempt_at: new Date(now()).toISOString(),
        last_error_code: null
      })
    )
    if (attemptError) {
      await ownedClaim(
        supabase.from('membership_reminders').update({ claimed_until: new Date(0).toISOString() })
      )
      throw new Error(
        'Reminder tracking is unavailable. Apply migration 005_admin_notifications.sql.'
      )
    }
    let mailResult
    try {
      const expiryDate = new Date(membershipEnd).toLocaleDateString('en-PH', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
      mailResult = await mailer.sendMail({
        from,
        to: member.email,
        ...expiryEmail({
          name: member.name,
          plan: member.plan,
          expiryDate,
          expired: type === 'expired',
          loginUrl
        })
      })
      if (
        mailResult?.rejected?.length ||
        (Array.isArray(mailResult?.accepted) && !mailResult.accepted.length)
      ) {
        const error = new Error('The mail server rejected the reminder recipient.')
        error.code = 'ERECIPIENT'
        throw error
      }
    } catch (cause) {
      const code = /^[A-Z_]{2,40}$/.test(cause.code || '') ? cause.code : 'SMTP_ERROR'
      // Only release a known delivery failure. An acknowledgement failure below
      // must retain the lease because SMTP might already have accepted the email.
      const { error } = await ownedClaim(
        supabase.from('membership_reminders').update({
          claimed_until: new Date(0).toISOString(),
          last_error_code: code
        })
      )
      if (error) logger.error('Unable to release a failed membership reminder claim.')
      throw new Error(
        `Membership reminder delivery failed (${code}); it will be retried on a later check.`
      )
    }

    const { data: saved, error: saveError } = await ownedClaim(
      supabase.from('membership_reminders').update({
        sent_at: new Date(now()).toISOString(),
        message_id:
          typeof mailResult?.messageId === 'string' ? mailResult.messageId.slice(0, 500) : null
      })
    )
      .select('subscription_id')
      .maybeSingle()
    if (saveError || !saved) {
      throw new Error(
        'A membership reminder was accepted by SMTP, but its delivery record could not be saved. Check membership_reminders before retrying.'
      )
    }
    return true
  }

  async function checkDue() {
    const counts = { sent: 0, failed: 0 }
    if (!mailer) return counts
    const database = await loadDatabase(['accounts', 'settings'])
    if (!database.settings.emailOn) return counts
    await checkMembershipReminderSetup(supabase)

    for (const member of database.accounts) {
      try {
        if (await sendReminder(member, database.settings)) counts.sent += 1
      } catch (error) {
        if (error instanceof ReminderSetupError) throw error
        counts.failed += 1
        logger.error(
          `Membership reminder for subscription ${member.subscriptionId}: ${error.message}`
        )
      }
    }
    return counts
  }

  function runDue() {
    // Share one run when startup, a timer, or another caller overlap.
    if (!running)
      running = checkDue()
        .then((counts) => {
          lastCheckedAt = new Date(now()).toISOString()
          lastCounts = counts
          lastError = null
          return counts
        })
        .catch((error) => {
          lastCheckedAt = new Date(now()).toISOString()
          lastCounts = null
          lastError =
            error instanceof ReminderSetupError
              ? error.message
              : 'Reminder check failed. Check the database and migration 005_admin_notifications.sql.'
          throw error
        })
        .finally(() => {
          running = null
        })
    return running
  }

  const getStatus = () => ({ running: Boolean(running), lastCheckedAt, lastError, lastCounts })
  return { sendReminder, runDue, getStatus }
}

export function startMembershipReminders({
  runDue,
  logger = console,
  setTimer = setTimeout,
  clearTimer = clearTimeout
}) {
  let stopped = false
  let timer
  async function tick() {
    try {
      const result = await runDue()
      if (result.sent || result.failed) {
        logger.info(`Membership reminders: ${result.sent} sent, ${result.failed} failed.`)
      }
    } catch (error) {
      logger.error(
        error instanceof ReminderSetupError
          ? error.message
          : 'Automatic membership reminder check failed. Check the database connection and migration 005_admin_notifications.sql.'
      )
    } finally {
      if (!stopped) {
        timer = setTimer(tick, CHECK_INTERVAL_MS)
        timer.unref?.()
      }
    }
  }
  void tick()
  return () => {
    stopped = true
    clearTimer(timer)
  }
}
