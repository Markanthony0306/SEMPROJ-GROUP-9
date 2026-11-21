import { useEffect, useState } from 'react'
import { apiRequest } from '../utils/api'
import {
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  passwordPolicy,
  passwordPolicyMessage
} from '../../shared/passwordPolicy'
import PasswordToggle from '../components/PasswordToggle'
import Spinner from '../components/Spinner'
import './Login.css'

export default function ResetPassword({ navigate }) {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token'))
  const [linkState, setLinkState] = useState('checking')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [errorField, setErrorField] = useState('')
  const [pending, setPending] = useState(false)
  const [visible, setVisible] = useState({ password: false, confirmPassword: false })

  useEffect(() => {
    if (!token) {
      setLinkState('invalid')
      setError('This reset link is invalid or expired. Request a new one.')
      return
    }
    const controller = new AbortController()
    apiRequest('/auth/reset-password/check', {
      method: 'POST',
      body: JSON.stringify({ token }),
      signal: controller.signal
    })
      .then(() => {
        if (!controller.signal.aborted) setLinkState('ready')
      })
      .catch((cause) => {
        if (controller.signal.aborted) return
        setLinkState('invalid')
        setError(cause.message)
      })
    return () => controller.abort()
  }, [token])

  const submit = async (event) => {
    event.preventDefault()
    if (pending || linkState !== 'ready' || message) return

    setError('')
    setErrorField('')
    setMessage('')

    if (!passwordPolicy(password)) {
      setError(passwordPolicyMessage)
      setErrorField('password')
      return
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      setErrorField('confirmPassword')
      return
    }

    setPending(true)

    try {
      const result = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password, confirmPassword })
      })

      setMessage(result.message)
      window.history.replaceState({}, document.title, window.location.pathname)

      setPassword('')
      setConfirmPassword('')
    } catch (cause) {
      if (cause.status === 401 || cause.status >= 500) setLinkState('invalid')
      setError(cause.message || 'Unable to reset your password.')
      if (cause.message === passwordPolicyMessage) setErrorField('password')
    } finally {
      setPending(false)
    }
  }

  return (
    <main id="login" className="password-recovery">
      <section className="lform clay reset-page">
        <div className="fhead">
          <h2>Set new password</h2>
          {linkState === 'ready' && !message && (
            <p id="reset-password-help">{passwordPolicyMessage}</p>
          )}
        </div>

        {linkState === 'checking' && <p role="status">Checking reset link…</p>}
        {linkState === 'invalid' && (
          <>
            <p className="err show" role="alert">
              {error}
            </p>
            <button className="btn lbtn" type="button" onClick={() => navigate('forgot-password')}>
              Request a new link
            </button>
          </>
        )}
        {message && (
          <>
            <p role="status">{message}</p>
            <button className="btn lbtn" type="button" onClick={() => navigate('login')}>
              Back to Login
            </button>
          </>
        )}
        {linkState === 'ready' && !message && (
          <form onSubmit={submit} aria-busy={pending} noValidate>
            <label className="auth-field">
              <span className="input-label">New password</span>
              <span className="inp">
                <input
                  aria-label="New password"
                  aria-invalid={errorField === 'password' && Boolean(error)}
                  aria-describedby={
                    errorField === 'password' && error
                      ? 'reset-password-help reset-password-error'
                      : 'reset-password-help'
                  }
                  autoComplete="new-password"
                  type={visible.password ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setError('')
                    setErrorField('')
                  }}
                  minLength={MIN_PASSWORD_LENGTH}
                  maxLength={MAX_PASSWORD_LENGTH}
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
              {errorField === 'password' && error && (
                <span id="reset-password-error" className="err show" role="alert">
                  {error}
                </span>
              )}
            </label>

            <label className="auth-field">
              <span className="input-label">Confirm new password</span>
              <span className="inp">
                <input
                  aria-label="Confirm new password"
                  aria-invalid={errorField === 'confirmPassword' && Boolean(error)}
                  aria-describedby={
                    errorField === 'confirmPassword' && error
                      ? 'reset-confirm-password-error'
                      : undefined
                  }
                  autoComplete="new-password"
                  type={visible.confirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value)
                    setError('')
                    setErrorField('')
                  }}
                  minLength={MIN_PASSWORD_LENGTH}
                  maxLength={MAX_PASSWORD_LENGTH}
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
              {errorField === 'confirmPassword' && error && (
                <span id="reset-confirm-password-error" className="err show" role="alert">
                  {error}
                </span>
              )}
            </label>

            {error && !errorField && (
              <p className="err show" role="alert">
                {error}
              </p>
            )}

            <button className="btn lbtn" disabled={pending}>
              {pending && <Spinner />}
              {pending ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
