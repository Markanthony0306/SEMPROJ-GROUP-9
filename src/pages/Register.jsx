import { useState } from 'react'
import InputField from '../components/InputField'
import PasswordInput from '../components/PasswordInput'
import { apiRequest } from '../utils/api'

// Staff can create a member account; the member must log in separately afterward.
export default function Register({ navigate }) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    const form = new FormData(event.currentTarget)
    const name = (form.get('name') || '').trim()
    const email = (form.get('email') || '').trim().toLowerCase()
    const password = form.get('password') || ''
    const confirmPassword = form.get('confirmPassword') || ''
    if (name.length < 2) return setError('Please enter the member’s full name.')
    if (password.length < 8) return setError('The password must be at least 8 characters.')
    if (password !== confirmPassword) return setError('Passwords do not match.')
    setPending(true)
    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      })
      setSuccess('Account created. The new member can now log in.')
      event.currentTarget.reset()
    } catch (apiError) {
      setError(apiError.message || 'Account creation failed. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="account-layout">
      <section className="auth-card-wrap">
        <form onSubmit={submit} className="account-form glass-panel auth-card">
          <p className="brand-mark">
            FIT<span>PULSE</span>
          </p>
          <p className="eyebrow">Owner & staff tool</p>
          <h1>Create account</h1>
          <p className="form-lead">Create a member account. They will log in afterward.</p>
          <InputField
            label="Full name"
            name="name"
            icon="user"
            required
            placeholder="John Doe"
            autoComplete="name"
          />
          <InputField
            label="Email address"
            name="email"
            type="email"
            icon="mail"
            required
            placeholder="john@example.com"
            autoComplete="email"
          />
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
          {success && (
            <p className="form-success" role="status">
              {success}
            </p>
          )}
          <button className="button" type="submit" disabled={pending}>
            Create account <span>→</span>
          </button>
          <p className="form-switch">
            Back to{' '}
            <button type="button" onClick={() => navigate('login')}>
              log in
            </button>
          </p>
        </form>
      </section>
    </main>
  )
}
