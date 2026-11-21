import { useEffect, useState } from 'react'
import { gorillaTitles } from '../../../shared/gorillaEvents'
import { apiRequest } from '../../utils/api'

// Fetch optional reminder history independently of the existing dashboard requests.
export function useReminderActivity(token, enabled, latestEvent) {
  const [state, setState] = useState({ reminders: [], error: '' })
  const reminderEvent = [gorillaTitles.expiring, gorillaTitles.expired].includes(latestEvent?.title)
    ? latestEvent.id
    : null
  useEffect(() => {
    if (!enabled || !token) return
    const controller = new AbortController()
    apiRequest('/events/reminders', { token, signal: controller.signal })
      .then(({ reminders }) => {
        if (!controller.signal.aborted) setState({ reminders, error: '' })
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setState((previous) => ({ ...previous, error: 'Reminder email history is unavailable.' }))
      })
    return () => controller.abort()
  }, [enabled, reminderEvent, token])
  return state
}

export function activityRows({
  attendance,
  payments,
  reminders,
  maintenance = [],
  members = [],
  money,
  staff = false
}) {
  const names = new Map(members.map((member) => [member.id, member.name]))
  return [
    ...attendance.map((entry) => ({
      id: `attendance-${entry.id}`,
      date: entry.date,
      title: 'QR check-in',
      detail: staff ? entry.memberName || 'Member' : entry.source || 'FitPulse',
      icon: 'qr'
    })),
    ...payments.map((entry) => ({
      id: `payment-${entry.id}`,
      date: entry.date,
      title: `${entry.method || 'Membership'} payment`,
      detail: [staff && entry.memberName, money(entry.amount)].filter(Boolean).join(' · '),
      icon: 'wallet'
    })),
    ...reminders.map((entry) => ({
      id: `reminder-${entry.id}`,
      date: entry.date,
      title: entry.type === 'expired' ? 'Expiry email sent' : 'Reminder email sent',
      detail: staff ? names.get(entry.memberId) || 'Member' : 'Membership expiry',
      icon: 'mail'
    })),
    ...maintenance.map((entry) => ({
      id: `equipment-${entry.id}`,
      date: entry.date,
      title: entry.item || 'Equipment',
      detail: entry.note,
      icon: 'dumbbell'
    })),
    ...members.map((entry) => ({
      id: `member-${entry.id}`,
      date: entry.createdAt,
      title: 'New member',
      detail: entry.name,
      icon: 'users'
    }))
  ]
    .filter((row) => Number.isFinite(Date.parse(row.date)))
    .sort((first, second) => Date.parse(second.date) - Date.parse(first.date))
}
