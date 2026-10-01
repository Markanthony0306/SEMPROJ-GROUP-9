import { useState } from 'react'
import { createMemberId, getData, saveData } from '../utils/storage'

export default function Register({ navigate }) {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const submit = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const data = getData()
    if (data.accounts.some((account) => account.email.toLowerCase() === form.get('email').toLowerCase())) return setError('An account with this email already exists.')
    data.accounts.push({ id: createMemberId(), name: form.get('name'), email: form.get('email'), password: form.get('password'), phone: '', plan: 'Unlimited Monthly', role: 'user', joined: new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) })
    saveData(data)
    navigate('login')
  }
  return <main className="account-layout"><section className="account-intro register-intro"><img src="/images/fitpulse.jpg" alt="FitPulse" /><div><p className="eyebrow">Start today</p><h1>Make your strongest move yet.</h1><p>Create your FitPulse membership and make your first check-in count.</p></div><button onClick={() => navigate('home')}>← Back to home</button></section><section className="form-panel"><form onSubmit={submit} className="account-form"><p className="eyebrow">Join FitPulse</p><h2>Create account</h2><p className="form-lead">It only takes a minute to get started.</p><label>Full name<input name="name" required placeholder="John Doe" autoComplete="name" /></label><label>Email address<input name="email" type="email" required placeholder="john@example.com" autoComplete="email" /></label><label>Create password<span className="password-wrap"><input name="password" type={showPassword ? 'text' : 'password'} required minLength="8" placeholder="At least 8 characters" autoComplete="new-password" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? '◉' : '◌'}</button></span></label>{error && <p className="form-error" role="alert">{error}</p>}<label className="check"><input type="checkbox" required /> I agree to the terms and privacy policy.</label><button className="button" type="submit">Create account <span>→</span></button><p className="form-switch">Already a member? <button type="button" onClick={() => navigate('login')}>Log in</button></p></form></section></main>
}
