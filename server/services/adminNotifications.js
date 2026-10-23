import crypto from 'node:crypto'
import { reminderType } from './membershipReminders.js'

const DAY_MS = 86_400_000
const key = (parts) => crypto.createHash('sha256').update(JSON.stringify(parts)).digest('hex')

export function buildAdminNotifications(database, now = Date.now()) {
  const notifications = []
  for (const member of database.accounts) {
    const type = reminderType(member, database.settings.remind, now)
    if (!type) continue
    const membershipEnd = new Date(member.membershipEnd).toISOString()
    notifications.push({
      id: key(['membership', member.subscriptionId, membershipEnd, type]),
      kind: 'membership',
      name: member.name,
      email: member.email,
      memberId: member.id,
      subscriptionId: member.subscriptionId,
      membershipEnd,
      type
    })
  }
  for (const item of database.equipment) {
    const inspected = Date.parse(item.lastInspected)
    if (Number.isFinite(inspected) && now - inspected < 30 * DAY_MS) continue
    const lastInspected = Number.isFinite(inspected) ? new Date(inspected).toISOString() : null
    notifications.push({
      id: key(['equipment', item.id, lastInspected]),
      kind: 'equipment',
      name: item.name,
      lastInspected,
      condition: item.condition
    })
  }
  return notifications
}

export function reminderDeliveryStatus(
  notification,
  receipts,
  settings,
  smtpConfigured,
  now = Date.now()
) {
  const receipt = receipts.find(
    (row) =>
      row.subscription_id === notification.subscriptionId &&
      Date.parse(row.membership_end) === Date.parse(notification.membershipEnd) &&
      row.reminder_type === notification.type
  )
  if (receipt?.sent_at)
    return { state: 'sent', sentAt: receipt.sent_at, messageId: receipt.message_id || null }
  if (receipt?.last_error_code)
    return {
      state: 'failed',
      errorCode: receipt.last_error_code,
      attemptedAt: receipt.last_attempt_at
    }
  if (receipt && Date.parse(receipt.claimed_until) > now)
    return { state: 'processing', attemptedAt: receipt.last_attempt_at }
  if (receipt?.last_attempt_at)
    return { state: 'unconfirmed', attemptedAt: receipt.last_attempt_at }
  if (!settings.emailOn) return { state: 'disabled' }
  if (!smtpConfigured) return { state: 'unconfigured' }
  return { state: 'not_sent' }
}

async function readAll(queryPage) {
  const rows = []
  for (let start = 0; ; start += 1000) {
    const { data, error } = await queryPage().range(start, start + 999)
    if (error) return { data: [], error }
    rows.push(...(data || []))
    if (!data || data.length < 1000) return { data: rows, error: null }
  }
}

export function createAdminNotificationService({
  supabase,
  loadDatabase,
  smtpConfigured,
  reminders,
  now = Date.now
}) {
  async function list(actorId) {
    const database = await loadDatabase(['accounts', 'equipment', 'settings'])
    const [dismissals, receipts] = await Promise.all([
      readAll(() =>
        supabase
          .from('admin_notification_dismissals')
          .select('notification_key')
          .eq('admin_user_id', actorId)
          .order('notification_key')
      ),
      readAll(() =>
        supabase
          .from('membership_reminders')
          .select(
            'subscription_id,membership_end,reminder_type,sent_at,claimed_until,last_attempt_at,last_error_code,message_id'
          )
          .order('membership_end')
      )
    ])
    const hidden = new Set(dismissals.data.map((row) => row.notification_key))
    const notifications = buildAdminNotifications(database, now())
      .filter((notification) => !hidden.has(notification.id))
      .map((notification) =>
        notification.kind === 'membership'
          ? {
              ...notification,
              delivery: receipts.error
                ? { state: 'unavailable' }
                : reminderDeliveryStatus(
                    notification,
                    receipts.data,
                    database.settings,
                    smtpConfigured,
                    now()
                  )
            }
          : notification
      )
    return {
      notifications,
      canDismiss: !dismissals.error,
      email: {
        configured: smtpConfigured,
        enabled: database.settings.emailOn,
        trackingReady: !receipts.error,
        issue: receipts.error
          ? 'Email tracking is unavailable. Apply migration 005_admin_notifications.sql.'
          : null,
        ...reminders.getStatus()
      },
      issue: dismissals.error
        ? 'Notification clearing is unavailable. Apply migration 005_admin_notifications.sql.'
        : null
    }
  }

  async function dismiss(actorId, id, group) {
    const current = await list(actorId)
    if (!current.canDismiss) {
      const error = new Error(current.issue)
      error.status = 503
      throw error
    }
    const selected = current.notifications.filter(
      (item) => (!id || item.id === id) && (!group || item.kind === group)
    )
    if (id && !selected.length) {
      const error = new Error('Notification not found. It may already have been removed.')
      error.status = 404
      throw error
    }
    if (selected.length) {
      const { error } = await supabase.from('admin_notification_dismissals').upsert(
        selected.map((item) => ({ admin_user_id: actorId, notification_key: item.id })),
        { onConflict: 'admin_user_id,notification_key', ignoreDuplicates: true }
      )
      if (error) {
        const failure = new Error(
          'Notification clearing failed. Reload the list before trying again.'
        )
        failure.status = 503
        throw failure
      }
    }
    return selected.length
  }
  return { list, dismiss }
}
