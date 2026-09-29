export default function Footer({ navigate }) {
  return (
    <footer className="footer">
      <img src="/images/fitpulse.jpg" alt="FitPulse" />
      <p>© 2026 FitPulse. Every rep counts.</p>
      <button onClick={() => navigate('register')}>Start your journey →</button>
    </footer>
  )
}
