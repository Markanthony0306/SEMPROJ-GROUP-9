import { useState } from 'react'
import { apiRequest } from '../utils/api'
import './Login.css'

export default function ForgotPassword({ navigate }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    if (pending) return
    setError('')
    setMessage('')
    setPending(true)
    try {
      const result = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })
      setMessage(result.message)
    } catch (cause) {
      setError(cause.message)
    } finally {
      setPending(false)
    }
  }
  return (
    <main id="login">
      <section className="lform clay reset-page">
        <div className="fhead">
          <h2>Reset password</h2>
          <p>Enter your account email and we'll send a reset link.</p>
        </div>
        <form onSubmit={submit} aria-busy={pending}>
          <label className="auth-field">
            <span className="input-label">Email address</span>
            <span className="inp">
              <input
                aria-label="Email address"
                autoComplete="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="john123@gmail.com"
                required
              />
            </span>
          </label>
          {error && (
            <p className="err show" role="alert">
              {error}
            </p>
          )}
          {message && <p role="status">{message}</p>}
          <button className="btn lbtn" disabled={pending}>
            {pending ? 'Sending...' : 'Send reset link'}
          </button>
          <button className="btn ghost" type="button" onClick={() => navigate('login')}>
            Back to login
          </button>
        </form>
      </section>
    </main>
  )
}
