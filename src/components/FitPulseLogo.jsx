export default function FitPulseLogo({ className = '' }) {
  return (
    <div className={`fitpulse-logo ${className}`} aria-label="FitPulse">
      <svg viewBox="0 0 64 40" aria-hidden="true">
        <path d="M2 22h12l5-10 8 21 8-16 5 5h22" />
        <path className="logo-weight" d="M4 15v14m5-10v6m42-6v6m5-10v14" />
      </svg>
      <span>
        Fit<strong>Pulse</strong>
      </span>
    </div>
  )
}
