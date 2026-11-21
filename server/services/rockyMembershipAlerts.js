import { createHash } from 'node:crypto'
import { gorillaEvents } from '../../shared/gorillaEvents.js'
import { memberExpiryDue, membershipAlertType } from './membershipReminders.js'

const DAY_MS = 86_400_000
const CHECK_INTERVAL_MS = 5 * 60_000

export function startRockyMembershipAlerts({
  loadDatabase, emitEvent, logger = console, now = Date.now,
  setTimer = setTimeout, clearTimer = clearTimeout
}) {
  let published = new Set()
  let stopped = false
  let timer

  async function check() {
    try {
      const { accounts, settings } = await loadDatabase(['accounts', 'settings'])
      const checkedAt = now()
      const current = new Set()
      for (const member of accounts) {
        if (stopped) return
        const type = membershipAlertType(member, settings.remind, checkedAt)
        const end = Date.parse(member.membershipEnd)
        const period = createHash('sha256').update(`${member.subscriptionId}:${end}`).digest('hex')
        async function publish(to, event, id) {
          current.add(id)
          if (published.has(id)) return
          await emitEvent({ to }, event, id, true)
          published.add(id)
        }

        if (type) {
          const days = Math.max(1, Math.ceil((end - checkedAt) / DAY_MS))
          const key = createHash('sha256').update(`${member.subscriptionId}:${end}:${type}`).digest('hex')
          const event = type === 'expired'
            ? gorillaEvents.expired(member.name)
            : gorillaEvents.expiring(member.name, days)
          await publish('admins', {
            ...event, target: { section: 'Members', memberId: member.id }
          }, `membership-staff:${key}`)
        }
        if (memberExpiryDue(member, checkedAt)) {
          await publish({ userId: member.id }, {
            ...gorillaEvents.expiring(null, 3), target: { section: 'Membership' }
          }, `membership-user-early:${period}`)
        }
        if (type === 'expired') {
          const key = createHash('sha256').update(`${member.subscriptionId}:${end}:expired`).digest('hex')
          await publish({ userId: member.id }, {
            ...gorillaEvents.expired(null), target: { section: 'Membership' }
          }, `membership-user:${key}`)
        }
      }
      published = current
    } catch (error) {
      logger.error('Rocky could not save membership reminders:', error.code || 'DATABASE_ERROR')
    } finally {
      if (!stopped) {
        timer = setTimer(check, CHECK_INTERVAL_MS)
        timer?.unref?.()
      }
    }
  }

  void check()
  return () => {
    stopped = true
    clearTimer(timer)
  }
}
