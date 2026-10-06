import { useCallback, useEffect, useRef, useState } from 'react'
import FitPulseLogo from '../components/FitPulseLogo'
import InputField from '../components/InputField'
import PasswordInput from '../components/PasswordInput'
import { CloseIcon, MoonIcon, SunIcon } from '../components/icons'
import { apiRequest } from '../utils/api'
import gymObjects from '../images/gymobjects.png'

// Must match the theme key used by the boot script in index.html.
const THEME_KEY = 'fitpulse-theme'

// Saved choice wins; otherwise follow the OS preference. Falls back to dark.
function initialTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

// Dialog with a dimmed + blurred backdrop, fade/scale animation, and the same
// close behavior everywhere: backdrop click, the X button, or the Esc key.
function AuthDialog({ open, onClose, label, children }) {
  const [closing, setClosing] = useState(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const close = useCallback(() => {
    setClosing(true)
    window.setTimeout(() => {
      onCloseRef.current()
      setClosing(false)
    }, 180)
  }, [])

  useEffect(() => {
    if (!open) return
    const handleKey = (event) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, close])

  if (!open) return null

  const suffix = closing ? ' closing' : ''
  return (
    <div
      className={`auth-modal-backdrop${suffix}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <section
        className={`auth-dialog${suffix}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <button className="auth-modal-close" onClick={close} aria-label={`Close ${label}`}>
          <CloseIcon />
        </button>
        {children}
      </section>
    </div>
  )
}

// Forgot-password dialog — same endpoint and feedback as the standalone page.
function ForgotPasswordDialog() {
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
    <form onSubmit={submit}>
      <p className="eyebrow">FitPulse</p>
      <h2>Forgot password</h2>
      <p className="form-lead">Enter your email and we will send you a reset link.</p>
      <InputField
        label="Email address"
        name="email"
        type="email"
        icon="mail"
        required
        autoComplete="email"
        placeholder="john@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
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
      <button className="button" type="submit" disabled={pending}>
        Send reset link
      </button>
    </form>
  )
}

// Create-account notice shown instead of the (staff-only) registration route.
function CreateAccountDialog({ onClose }) {
  return (
    <>
      <p className="eyebrow">FitPulse</p>
      <h2>Create an account</h2>
      <p className="form-lead">You must ask the admin for the creation of an account.</p>
      <button className="button" onClick={onClose}>
        Okay
      </button>
    </>
  )
}

export default function Login({ navigate, onLogin }) {
  const [theme, setTheme] = useState(initialTheme)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [dialog, setDialog] = useState(null) // null | 'forgot' | 'create'

  // Sync <html data-theme> and persist the choice. Runs on mount too, so state
  // always matches the attribute set by the index.html boot script.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      window.localStorage.setItem(THEME_KEY, theme)
    } catch {
      // Ignore storage failures (private browsing, etc.).
    }
  }, [theme])

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    setPending(true)
    try {
      const session = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') })
      })
      onLogin(session)
    } catch (apiError) {
      setError(apiError.message || 'We could not log you in. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="account-layout">
      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* Left showcase panel: logo + one short tagline over dimmed photos */}
      <section className="account-intro">
        <FitPulseLogo className="intro-logo" />
        <div className="intro-tagline">
          <h1>Stronger every day.</h1>
        </div>
        <img className="gym-objects" src={gymObjects} alt="" draggable="false" />
      </section>

      {/* Right panel: liquid-glass login form */}
      <section className="form-panel">
        <form onSubmit={submit} className="account-form glass-panel">
          <h2>Log in</h2>
          <p className="form-lead">Enter your details to continue.</p>
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
            label="Password"
            name="password"
            icon="lock"
            required
            minLength="8"
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-row">
            <label className="check">
              <input type="checkbox" /> Remember me
            </label>
            <button type="button" className="link-button" onClick={() => setDialog('forgot')}>
              Forgot password?
            </button>
          </div>
          <button className="button" type="submit" disabled={pending}>
            Log in <span aria-hidden="true">→</span>
          </button>
          <p className="form-switch">
            New to FitPulse?{' '}
            <button type="button" className="link-button" onClick={() => setDialog('create')}>
              Create an account
            </button>
          </p>
          <p className="form-hint">
            Demo: admin@fitpulse.com / admin123 · member@fitpulse.com / member123
          </p>
        </form>
      </section>

      <AuthDialog
        open={dialog === 'forgot'}
        onClose={() => setDialog(null)}
        label="Forgot password"
      >
        <ForgotPasswordDialog />
      </AuthDialog>

      <AuthDialog
        open={dialog === 'create'}
        onClose={() => setDialog(null)}
        label="Create an account"
      >
        <CreateAccountDialog onClose={() => setDialog(null)} />
      </AuthDialog>
    </main>
  )
}
