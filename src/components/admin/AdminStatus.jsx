import { membershipState } from '../../utils/membership'

export function Pill({ status }) {
  const state = String(status || '').toLowerCase()
  return (
    <span
      className={`pill ${state === 'active' || state === 'good' ? 'p-ok' : state === 'expired' || state === 'out of service' ? 'p-bad' : 'p-warn'}`}
    >
      {status || 'Active'}
    </span>
  )
}
export function memberBadge(member) {
  const state = membershipState(member)
  return state.status === 'active' && state.daysLeft <= 7 ? 'Expiring' : state.label
}

