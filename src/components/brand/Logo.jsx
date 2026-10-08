// Supplied FitPulse brand mark: dumbbell plates joined by a heartbeat line.
export function LogoMark({ width = 64 }) {
  return (
    <svg className="fp-mark" viewBox="0 0 64 24" width={width} height={Math.round((width * 24) / 64)} aria-hidden="true">
      <g fill="currentColor">
        <rect x="1" y="6" width="3.5" height="12" rx="1.7" />
        <rect x="5.5" y="8.5" width="3" height="7" rx="1.5" />
        <rect x="59.5" y="6" width="3.5" height="12" rx="1.7" />
        <rect x="55.5" y="8.5" width="3" height="7" rx="1.5" />
      </g>
      <path d="M9 12h11M44 12h11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M20 12h5l3-8 5 16 4-11 2 3h5" stroke="var(--clay-orange)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export default function Logo({ big = false, beat = true }) {
  return (
    <div className={`fp-logo clay sm${big ? ' big' : ''}${beat ? ' beat' : ''}`} aria-label="FitPulse">
      <LogoMark width={big ? 92 : 64} />
      <span className="fp-wordmark">Fit<b>Pulse</b></span>
    </div>
  )
}
