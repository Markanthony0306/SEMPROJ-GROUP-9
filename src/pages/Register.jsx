import { useState } from 'react'
import PasswordInput from '../components/PasswordInput'
import { apiRequest } from '../utils/api'
import { createMemberId, getData, saveData } from '../utils/storage'

export default function Register({ navigate }) {
  const [error, setError] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (form.get('password') !== form.get('confirmPassword'))
      return setError('Passwords do not match.')
    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          password: form.get('password')
        })
      })
    } catch (apiError) {
      const data = getData()
      if (
        data.accounts.some(
          (account) => account.email.toLowerCase() === form.get('email').toLowerCase()
        )
      )
        return setError(apiError.message || 'An account with this email already exists.')
      data.accounts.push({
        id: createMemberId(),
        name: form.get('name'),
        email: form.get('email'),
        password: form.get('password'),
        phone: '',
        plan: 'Unlimited Monthly',
        role: 'user',
        joined: new Date().toLocaleDateString('en-PH', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      })
      saveData(data)
    }
    navigate('login')
  }
  return (
    <main className="account-layout">
      <section className="account-intro register-intro">
        <div>
          <p className="eyebrow">Start today</p>
          <h1>Make your strongest move yet.</h1>
          <p>Create your FitPulse membership and make your first check-in count.</p>
        </div>
        <button onClick={() => navigate('home')}>← Back to home</button>
      </section>
      <section className="form-panel">
        <form onSubmit={submit} className="account-form glass-panel">
          <p className="eyebrow">Join FitPulse</p>
          <h2>Create account</h2>
          <p className="form-lead">It only takes a minute to get started.</p>
          <label>
            Full name
            <input name="name" required placeholder="John Doe" autoComplete="name" />
          </label>
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
            label="Create password"
            name="password"
            required
            minLength="8"
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          <PasswordInput
            label="Confirm password"
            name="confirmPassword"
            required
            minLength="8"
            placeholder="Repeat your password"
            autoComplete="new-password"
          />
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <label className="check">
            <input type="checkbox" required /> I agree to the terms and privacy policy.
          </label>
          <button className="button" type="submit">
            Create account <span>→</span>
          </button>
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
