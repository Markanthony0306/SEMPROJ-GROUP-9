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
  now = Date.now
}) {
  async function list(actorId) {
    const database = await loadDatabase(['accounts', 'equipment', 'settings'])
    const dismissals = await readAll(() =>
      supabase
        .from('admin_notification_dismissals')
        .select('notification_key')
        .eq('admin_user_id', actorId)
        .order('notification_key')
    )
    const hidden = new Set(dismissals.data.map((row) => row.notification_key))
    return {
      notifications: buildAdminNotifications(database, now()).filter((item) => !hidden.has(item.id)),
      canDismiss: !dismissals.error,
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
