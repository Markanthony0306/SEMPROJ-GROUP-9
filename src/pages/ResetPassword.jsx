import { useState } from 'react'
import PasswordInput from '../components/PasswordInput'
import FitPulseLogo from '../components/FitPulseLogo'
import { apiRequest } from '../utils/api'

// Reset tokens arrive from the server in the URL and are never stored in local storage.
export default function ResetPassword({ navigate }) {
  const token = new URLSearchParams(window.location.search).get('token')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const password = form.get('password')
    const confirmPassword = form.get('confirmPassword')
    setError('')
    if (!token) return setError('This reset link is missing its security token.')
    if (password.length < 8) return setError('Your new password must be at least 8 characters.')
    if (password !== confirmPassword) return setError('Passwords do not match.')
    setPending(true)
    try {
      const result = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      })
      setMessage(result.message)
      setTimeout(() => navigate('login'), 1800)
    } catch (apiError) {
      setError(apiError.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="account-layout">
      <section className="auth-card-wrap">
        <form className="account-form neo-card" onSubmit={submit}>
          <FitPulseLogo />
          <h1>Reset password</h1>
          <p className="form-lead">Choose a new password for your FitPulse account.</p>
          <PasswordInput
            label="New password"
            name="password"
            required
            minLength="8"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            icon="lock"
          />
          <PasswordInput
            label="Confirm new password"
            name="confirmPassword"
            required
            minLength="8"
            placeholder="Repeat your password"
            autoComplete="new-password"
            icon="lock"
          />
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="form-success" role="status">
              {message}
            </p>
          )}
          <button className="button login-button" type="submit" disabled={pending}>
            Save new password
          </button>
        </form>
      </section>
    </main>
  )
}
