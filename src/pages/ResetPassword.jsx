import { useState } from 'react'
import { apiRequest } from '../utils/api'
import PasswordToggle from '../components/PasswordToggle'
import './Login.css'

export default function ResetPassword({ navigate }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [visible, setVisible] = useState({ password: false, confirmPassword: false })

  const submit = async (event) => {
    event.preventDefault()
    if (pending) return

    setError('')
    setMessage('')

    if (password.length < 8) {
      setError('Use at least 8 characters for your password.')
      return
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setPending(true)

    try {
      const url = new URL(window.location.href)
      const hashParams = new URLSearchParams(
        url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
      )

      let accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const code = url.searchParams.get('code')

      // Supabase may return a PKCE authorization code instead of tokens.
      if (!accessToken && code) {
        const result = await apiRequest('/auth/reset-password/session', {
          method: 'POST',
          body: JSON.stringify({ code })
        })

        accessToken = result.accessToken
      }

      // Token-based recovery links must contain a recovery access token.
      if (!accessToken && refreshToken) {
        throw new Error('Unable to read the recovery session. Please request a new reset link.')
      }

      if (!accessToken) {
        throw new Error('This reset link is invalid or expired. Please request a new one.')
      }

      const result = await apiRequest('/auth/reset-password', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ password })
      })

      setMessage(result.message)
      window.history.replaceState({}, document.title, window.location.pathname)

      setTimeout(() => navigate('login'), 1500)
    } catch (cause) {
      setError(cause.message || 'Unable to reset your password.')
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
                type={visible.password ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                maxLength={72}
                placeholder="New password"
                required
              />
              <PasswordToggle
                visible={visible.password}
                label="new password"
                disabled={pending}
                onToggle={() =>
                  setVisible((previous) => ({ ...previous, password: !previous.password }))
                }
              />
            </span>
          </label>

          <label className="auth-field">
            <span className="input-label">Confirm new password</span>
            <span className="inp">
              <input
                aria-label="Confirm new password"
                autoComplete="new-password"
                type={visible.confirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                maxLength={72}
                placeholder="Confirm new password"
                required
              />
              <PasswordToggle
                visible={visible.confirmPassword}
                label="confirm new password"
                disabled={pending}
                onToggle={() =>
                  setVisible((previous) => ({
                    ...previous,
                    confirmPassword: !previous.confirmPassword
                  }))
                }
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
