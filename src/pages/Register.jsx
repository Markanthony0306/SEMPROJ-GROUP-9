import { useState } from 'react'
export default function Register({ navigate }) {
  const [done, setDone] = useState(false)
  return (
    <main className="account-layout">
      <section className="account-intro register-intro">
        <img src="/images/fitpulse.jpg" alt="FitPulse" />
        <div>
          <p className="eyebrow">Start today</p>
          <h1>Make your strongest move yet.</h1>
          <p>Create your FitPulse membership and make your first check-in count.</p>
        </div>
        <button onClick={() => navigate('home')}>← Back to home</button>
      </section>
      <section className="form-panel">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setDone(true)
          }}
          className="account-form"
        >
          <p className="eyebrow">Join FitPulse</p>
          <h2>Create account</h2>
          <p className="form-lead">It only takes a minute to get started.</p>
          <label>
            Full name
            <input required placeholder="Your full name" />
          </label>
          <label>
            Email address
            <input type="email" required placeholder="you@example.com" />
          </label>
          <label>
            Create password
            <input type="password" required minLength="8" placeholder="At least 8 characters" />
          </label>
          <label className="check">
            <input type="checkbox" required /> I agree to the terms and privacy policy.
          </label>
          <button className="button" type="submit">
            Create account <span>→</span>
          </button>
          {done && (
            <p className="success-message">
              Account created.{' '}
              <button type="button" onClick={() => navigate('user')}>
                Open my dashboard →
              </button>
            </p>
          )}
          <p className="form-switch">
            Already a member?{' '}
            <button type="button" onClick={() => navigate('login')}>
              Log in
            </button>
          </p>
        </form>
      </section>
    </main>
  )
}
