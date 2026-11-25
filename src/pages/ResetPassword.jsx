import { useEffect, useState } from 'react'
import { apiRequest } from '../utils/api'
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, passwordPolicy, passwordPolicyMessage } from '../../shared/passwordPolicy'
import PasswordToggle from '../components/PasswordToggle'
import Spinner from '../components/Spinner'
import './Login.css'

export default function ResetPassword({ navigate }) {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token'))
  const [deadline, setDeadline] = useState(null)
  const [seconds, setSeconds] = useState(null)
  const [linkStatus, setLinkStatus] = useState(token ? 'checking' : 'expired')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [visible, setVisible] = useState({ password: false, confirmPassword: false })
  const expired = linkStatus === 'expired' || seconds === 0
  const disabled = pending || linkStatus !== 'ready' || expired || Boolean(message)

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    const requestedAt = performance.now()

    async function checkLink() {
      try {
        const { expiresAt, serverNow } = await apiRequest('/auth/reset-password/session', {
          method: 'POST',
          body: JSON.stringify({ token }),
          signal: controller.signal
        })
        if (controller.signal.aborted) return
        if (!Number.isFinite(expiresAt) || !Number.isFinite(serverNow)) {
          throw new Error('FitPulse could not verify the reset link.')
        }
        // Anchor the server's remaining time to this request's local clock. Network
        // time counts against the deadline and refreshing always checks the server again.
        const nextDeadline = requestedAt + expiresAt - serverNow
        const remaining = Math.max(0, Math.ceil((nextDeadline - performance.now()) / 1000))
        setDeadline(nextDeadline)
        setSeconds(remaining)
        setLinkStatus('ready')
      } catch (cause) {
        if (controller.signal.aborted) return
        setLinkStatus(cause.status === 410 ? 'expired' : 'unavailable')
        if (cause.status !== 410) setError(cause.message)
      }
    }

    void checkLink()
    return () => controller.abort()
  }, [token])

  useEffect(() => {
    if (deadline === null || expired || message) return
    const tick = () => setSeconds(Math.max(0, Math.ceil((deadline - performance.now()) / 1000)))
    const timer = window.setInterval(tick, 250)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [deadline, expired, message])

  const submit = async (event) => {
    event.preventDefault()
    if (disabled) return
    if (performance.now() >= deadline) {
      setSeconds(0)
      return
    }

    setError('')
    setMessage('')
    const { password, confirmPassword } = Object.fromEntries(new FormData(event.currentTarget))

    if (!passwordPolicy(password)) {
      setError(passwordPolicyMessage)
      return
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setPending(true)

    try {
      const result = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password, confirmPassword })
      })

      setPassword('')
      setConfirmPassword('')
      setVisible({ password: false, confirmPassword: false })
      setMessage(result.message)
      window.history.replaceState({}, document.title, window.location.pathname)
    } catch (cause) {
      if (cause.status === 410) setLinkStatus('expired')
      else setError(cause.message || 'Unable to reset your password.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main id="login">
      <section className="lform clay reset-page">
        <div className="fhead">
          <h1>Change password</h1>
          <p>{passwordPolicyMessage}</p>
        </div>

        {linkStatus === 'checking' && <p role="status">Checking reset link…</p>}
        {!message && (seconds !== null || expired) && (
          <p className="reset-countdown" role="timer">
            Link expires in 00:{String(expired ? 0 : seconds).padStart(2, '0')}
          </p>
        )}
        {!message && expired && <p className="err show" role="alert">This link has expired or already been used.</p>}

        <form onSubmit={submit} aria-busy={pending}>
          <label className="auth-field">
            <span className="input-label">New password</span>
            <span className="inp">
              <input
                aria-label="New password"
                name="password"
                autoComplete="new-password"
                type={visible.password ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={MIN_PASSWORD_LENGTH}
                maxLength={MAX_PASSWORD_LENGTH}
                placeholder="New password"
                required
                disabled={disabled}
              />
              <PasswordToggle
                visible={visible.password}
                label="new password"
                disabled={disabled}
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
                name="confirmPassword"
                autoComplete="new-password"
                type={visible.confirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={MIN_PASSWORD_LENGTH}
                maxLength={MAX_PASSWORD_LENGTH}
                placeholder="Confirm new password"
                required
                disabled={disabled}
              />
              <PasswordToggle
                visible={visible.confirmPassword}
                label="confirm new password"
                disabled={disabled}
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

          <button className="btn lbtn" disabled={disabled}>
            {pending && <Spinner />}
            {pending ? 'Updating...' : 'Update password'}
          </button>
        </form>
        {message && (
          <button className="btn ghost" type="button" onClick={() => navigate('login')}>
            Back to login
          </button>
        )}
        {!message && (expired || linkStatus === 'unavailable' || error) && (
          <button className="btn ghost" type="button" onClick={() => navigate('forgot-password')}>
            Request a new link
          </button>
        )}
      </section>
    </main>
  )
}
