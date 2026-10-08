import FitPulseLogo from './FitPulseLogo'

export default function HeartRateLoader({ message = 'Welcome to FitPulse' }) {
  return (
    <div className="loader-overlay" role="status" aria-label="Logging you in">
      <div className="clay-loader">
        <div className="clay-loader__logo"><FitPulseLogo /></div>
        <p>Logging you in</p>
        <span>{message}</span>
      </div>
    </div>
  )
}
