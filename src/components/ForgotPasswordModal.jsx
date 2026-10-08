import { useEffect, useRef, useState } from 'react'
import { LockIcon, MailIcon } from './icons'
import { apiRequest } from '../utils/api'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

// Keeps password recovery on the login page while preserving the existing API.
export default function ForgotPasswordModal({ initialEmail, onClose, returnFocusRef }) {
  const dialogRef = useRef(null)
  const emailRef = useRef(null)
  const [email, setEmail] = useState(initialEmail)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    emailRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const focusable = [...dialogRef.current.querySelectorAll(FOCUSABLE)]
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      returnFocusRef.current?.focus()
    }
  }, [onClose, returnFocusRef])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!emailRef.current?.validity.valid) {
      setError('Enter a valid email address.')
      emailRef.current?.focus()
      return
    }
    setPending(true)
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() })
      })
      setSent(true)
    } catch (apiError) {
      setError(apiError.message || 'We could not send the reset link. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="reset-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="reset-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="reset-modal-title">
        <button className="reset-modal__close" type="button" onClick={onClose} aria-label="Close reset password dialog">×</button>
        {sent ? (
          <div className="reset-modal__success">
            <span className="reset-modal__icon"><MailIcon /></span>
            <h2 id="reset-modal-title">Check your inbox</h2>
            <p>We sent a reset link to <strong>{email}</strong>.</p>
            <button className="login-submit" type="button" onClick={onClose}>Back to login</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <span className="reset-modal__icon"><LockIcon /></span>
            <h2 id="reset-modal-title">Reset your password</h2>
            <p>Enter your email and we will send you a reset link.</p>
            <label className="login-field reset-modal__field">
              <MailIcon />
              <input ref={emailRef} name="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@fitpulse.com" aria-label="Email address" autoComplete="email" required />
            </label>
            {error && <p className="login-error" role="alert">{error}</p>}
            <div className="reset-modal__actions">
              <button className="reset-modal__cancel" type="button" onClick={onClose}>Cancel</button>
              <button className="login-submit" type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send reset link'}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
