const DAY_MS = 86400000

export function membershipState(member, now = Date.now()) {
  const start = Date.parse(member?.membershipStart || member?.joined)
  const end = Date.parse(member?.membershipEnd)
  const status = String(member?.status || '').toLowerCase()
  if (status === 'expired' || (Number.isFinite(end) && end <= now))
    return { status: 'expired', label: 'Expired', daysLeft: 0 }
  if (status && status !== 'active')
    return { status, label: status[0].toUpperCase() + status.slice(1), daysLeft: null }
  if (!Number.isFinite(start) || !Number.isFinite(end))
    return { status: 'incomplete', label: 'Dates missing', daysLeft: null }
  if (start > now)
    return { status: 'upcoming', label: 'Not started', daysLeft: Math.ceil((end - now) / DAY_MS) }
  if (status !== 'active') return { status: 'incomplete', label: 'Status missing', daysLeft: null }
  return { status: 'active', label: 'Active', daysLeft: Math.ceil((end - now) / DAY_MS) }
}

export function reminderMembers(members, reminderDays = 7, now = Date.now()) {
  return members
    .filter((member) => {
      const state = membershipState(member, now)
      return (
        state.status === 'expired' || (state.status === 'active' && state.daysLeft <= reminderDays)
      )
    })
    .sort((a, b) => Date.parse(a.membershipEnd) - Date.parse(b.membershipEnd))
}

export function inspectionDue(item, now = Date.now()) {
  const inspected = Date.parse(item.lastInspected)
  return !Number.isFinite(inspected) || now - inspected >= 30 * DAY_MS
}
