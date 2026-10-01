import { useState } from 'react'
import PasswordInput from '../components/PasswordInput'
import { apiRequest } from '../utils/api'
import { getData } from '../utils/storage'

export default function Login({ navigate, onLogin }) {
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      const session = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') })
      })
      onLogin(session)
    } catch (apiError) {
      const account = getData().accounts.find(
        (item) =>
          item.email.toLowerCase() === form.get('email').toLowerCase() &&
          item.password === form.get('password')
      )
      if (!account)
        return setError(apiError.message || 'We could not match that email and password.')
      onLogin(account)
    }
  }

  return (
    <main className="account-layout">
      <section className="account-intro">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>Your next session is waiting.</h1>
          <p>Check in, stay on schedule, and feel every bit of your progress.</p>
        </div>
        <button onClick={() => navigate('home')}>← Back to home</button>
      </section>
      <section className="form-panel">
        <form onSubmit={submit} className="account-form glass-panel">
          <h2>Log in</h2>
          <p className="form-lead">Enter your details to continue.</p>
          <label>
            Email address
            <input
              name="email"
              type="email"
              required
              placeholder="john@example.com"
              autoComplete="email"
            />
          </label>
          <PasswordInput
            label="Password"
            name="password"
            required
            minLength="8"
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-row">
            <label className="check">
              <input type="checkbox" /> Remember me
            </label>
            <a href="mailto:support@fitpulse.com">Forgot password?</a>
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
          <p className="form-hint">Staff demo: admin@fitpulse.com / admin123</p>
        </form>
      </section>
    </main>
  )
}
