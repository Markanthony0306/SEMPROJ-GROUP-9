import { useState } from 'react'
import { getData } from '../utils/storage'

export default function Login({ navigate, onLogin }) {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const submit = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const account = getData().accounts.find((item) => item.email.toLowerCase() === form.get('email').toLowerCase() && item.password === form.get('password'))
    if (!account) return setError('We could not match that email and password.')
    onLogin(account)
  }

  return <main className="account-layout">
    <section className="account-intro"><img src="/images/fitpulse.jpg" alt="FitPulse" /><div><p className="eyebrow">Welcome back</p><h1>Your next session is waiting.</h1><p>Check in, stay on schedule, and feel every bit of your progress.</p></div><button onClick={() => navigate('home')}>← Back to home</button></section>
    <section className="form-panel"><form onSubmit={submit} className="account-form"><p className="eyebrow">Member access</p><h2>Log in</h2><p className="form-lead">Enter your details to continue.</p>
      <label>Email address<input name="email" type="email" required placeholder="john@example.com" autoComplete="email" /></label>
      <label>Password<span className="password-wrap"><input name="password" type={showPassword ? 'text' : 'password'} required minLength="8" placeholder="Enter your password" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? '◉' : '◌'}</button></span></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-row"><label className="check"><input type="checkbox" /> Remember me</label><a href="mailto:support@fitpulse.com">Forgot password?</a></div>
      <button className="button" type="submit">Log in <span>→</span></button><p className="form-switch">New to FitPulse? <button type="button" onClick={() => navigate('register')}>Create an account</button></p>
      <p className="form-hint">Staff demo: admin@fitpulse.com / admin123</p>
    </form></section>
  </main>
}
