import { useState } from 'react'
import FitPulseLogo from '../components/FitPulseLogo'
import InputField from '../components/InputField'
import { apiRequest } from '../utils/api'

// Requesting a reset only needs an email. The response is deliberately generic so
// this endpoint cannot be used to discover which addresses are registered.
export default function ForgotPassword({ navigate }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    setPending(true)
    try {
      const result = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() })
      })
      setMessage(result.message)
      setEmail('')
    } catch (apiError) {
      setError(apiError.message || 'Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="account-layout">
      <section className="auth-card-wrap">
        <form className="account-form neo-card" onSubmit={submit}>
          <FitPulseLogo />
          <h1>Forgot password</h1>
          <p className="form-lead">Enter your email and we will send you a reset link.</p>
          <InputField
            label="Email address"
            name="email"
            type="email"
            icon="mail"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="john@example.com"
            autoComplete="email"
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
            Send reset link
          </button>
          <p className="form-switch">
            Remembered it?{' '}
            <button type="button" onClick={() => navigate('login')}>
              Back to log in
            </button>
          </p>
        </form>
      </section>
    </main>
  )
}
