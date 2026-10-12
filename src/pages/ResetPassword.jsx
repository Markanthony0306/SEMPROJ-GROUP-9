import { useState } from 'react'
import { apiRequest } from '../utils/api'
import './Login.css'

export default function ResetPassword({ navigate }) {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    if (pending) return
    setError('')
    setMessage('')
    setPending(true)
    const token = new URLSearchParams(window.location.search).get('token')
    try {
      if (!token) throw new Error('This reset link is missing its token. Request a new link.')
      const result = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      })
      setMessage(result.message)
      setTimeout(() => navigate('login'), 1200)
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
          <h2>Choose a new password</h2>
          <p>Use at least eight characters.</p>
        </div>
        <form onSubmit={submit} aria-busy={pending}>
          <label className="auth-field">
            <span className="input-label">New password</span>
            <span className="inp">
              <input
                aria-label="New password"
                autoComplete="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength="8"
                placeholder="New password"
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
          <button className="btn lbtn" disabled={pending || Boolean(message)}>
            {pending ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </section>
    </main>
  )
}
