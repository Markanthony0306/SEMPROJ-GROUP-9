import { membershipState } from '../../utils/membership'

// The badge uses the existing membership cutoff and the gym's reminder window.
export default function MemberRow({ member, expiring, date, onSelect }) {
  const state = membershipState(member)
  const status = expiring ? 'expiring' : state.status
  const initials = member.name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  const paletteIndex = (member.id?.charCodeAt(0) || 0) % 4
  return (
    <li>
      <button type="button" className="fitpulse-member-row" onClick={() => onSelect(member)}>
        <span className="fitpulse-initials" data-palette={paletteIndex} aria-hidden="true">
          {initials || 'M'}
        </span>
        <span className="fitpulse-row-copy">
          <strong>{member.name}</strong>
          <small>
            {member.plan} · Until {date(member.membershipEnd)}
          </small>
          {member.verificationStatus === 'skipped' && (
            <small>
              <span className="pill p-warn">Verification skipped</span>
            </small>
          )}
        </span>
        <span className={`fitpulse-status is-${status}`}>
          {expiring ? 'Expiring' : state.label}
        </span>
      </button>
    </li>
  )
}
