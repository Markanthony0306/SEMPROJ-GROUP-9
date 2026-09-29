export default function HeartRateLoader() {
  return (
    <div className="loader-overlay" role="status" aria-label="Logging you in">
      <div>
        <p>SYNCING YOUR PULSE</p>
        <svg className="ecg" viewBox="0 0 360 70" aria-hidden="true">
          <path d="M0 35h70l16-26 22 53 25-54 17 27h210" />
        </svg>
        <span>Welcome to FitPulse</span>
      </div>
    </div>
  )
}
