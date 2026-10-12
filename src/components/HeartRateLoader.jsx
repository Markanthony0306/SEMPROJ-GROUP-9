export default function HeartRateLoader({ message }) {
  return <div className="loading-overlay" role="status"><div className="clay loading-card"><b>FitPulse</b><span>{message}</span></div></div>
}
