import { useState } from 'react'
import HeartRateLoader from '../components/HeartRateLoader'
export default function Login({ navigate }) {
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState('member')
  const submit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => navigate(role === 'staff' ? 'admin' : 'user'), 1500)
  }
  return (
    <main className="account-layout">
      <section className="account-intro">
        <img src="/images/fitpulse.jpg" alt="FitPulse" />
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>Your next session is waiting.</h1>
          <p>Check in, stay on schedule, and feel every bit of your progress.</p>
        </div>
        <button onClick={() => navigate('home')}>← Back to home</button>
      </section>
      <section className="form-panel">
        <form onSubmit={submit} className="account-form">
          <p className="eyebrow">Member access</p>
          <h2>Log in</h2>
          <p className="form-lead">Enter your details to continue.</p>
          <label>
            Email address
            <input type="email" required placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input type="password" required minLength="8" placeholder="Enter your password" />
          </label>
          <label>
            Access as
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="staff">Admin / Staff</option>
            </select>
          </label>
          <div className="form-row">
            <label className="check">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#help">Forgot password?</a>
          </div>
          <button className="button" type="submit">
            Log in <span>→</span>
          </button>
          <p className="form-switch">
            New to FitPulse?{' '}
            <button type="button" onClick={() => navigate('register')}>
              Create an account
            </button>
          </p>
        </form>
      </section>
      {loading && <HeartRateLoader />}
    </main>
  )
}
