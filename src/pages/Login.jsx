import { useRef, useState } from 'react'
import BrandLogo from '../components/brand/Logo'
import ThemeToggle from '../components/brand/ThemeToggle'
import ForgotPasswordModal from '../components/ForgotPasswordModal'
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from '../components/icons'
import { apiRequest } from '../utils/api'
import './Login.css'

function SocialLinks() {
  return (
    <nav className="login-socials" aria-label="FitPulse social media">
      <a
        href="https://www.facebook.com"
        aria-label="FitPulse on Facebook"
        target="_blank"
        rel="noreferrer"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14 8h3V4h-3c-3.1 0-5 1.9-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.7.3-1 1-1Z" />
        </svg>
      </a>
      <a
        href="https://www.instagram.com"
        aria-label="FitPulse on Instagram"
        target="_blank"
        rel="noreferrer"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      </a>
    </nav>
  )
}

export default function Login({ navigate, onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visiblePassword, setVisiblePassword] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [credentialError, setCredentialError] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const passwordRef = useRef(null)
  const forgotPasswordRef = useRef(null)

  // A generic 401 keeps account information private while providing clear feedback.
  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setCredentialError(false)
    setPending(true)
    try {
      const session = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      onLogin(session)
    } catch (apiError) {
      const invalid = apiError.message === 'Invalid email or password.'
      setError(
        invalid
          ? 'Incorrect email or password'
          : apiError.message || 'We could not log you in. Please try again.'
      )
      if (invalid) {
        setPassword('')
        setCredentialError(true)
        setShaking(true)
        requestAnimationFrame(() => passwordRef.current?.focus())
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="login-page">
      {/* CSS-only animated mesh */}
      <div className="login-mesh" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <ThemeToggle />
      {/* Left video-led hero */}
      <section className="login-hero">
        <BrandLogo />
        <div className="login-hero__content">
          <div className="clay-dumbbell" aria-hidden="true">
            <i className="clay-dumbbell__plate clay-dumbbell__plate--orange clay-dumbbell__plate--left-outer" />
            <i className="clay-dumbbell__plate clay-dumbbell__plate--red clay-dumbbell__plate--left-inner" />
            <b className="clay-dumbbell__bar" />
            <i className="clay-dumbbell__plate clay-dumbbell__plate--red clay-dumbbell__plate--right-inner" />
            <i className="clay-dumbbell__plate clay-dumbbell__plate--orange clay-dumbbell__plate--right-outer" />
          </div>
          <p className="login-hero__eyebrow">Train with purpose</p>
          <h1>Your next session starts here.</h1>
          <p>Everything you need to stay strong, focused, and on track.</p>
        </div>
        <div className="login-hero__socials"><span>Follow FitPulse</span><SocialLinks /></div>
      </section>
      {/* Split divider */}
      <div className="login-divider" aria-hidden="true">
        <span className="login-divider-node">
          <svg viewBox="0 0 32 32">
            <path d="M3 17h7l3-7 5 13 4-9 2 3h5" />
          </svg>
        </span>
      </div>
      {/* Glass login card */}
      <section className="login-panel">
        <form
          className="login-card"
          onSubmit={submit}
          onAnimationEnd={(event) => event.animationName === 'login-shake' && setShaking(false)}
        >
          <div className="login-card-header login-enter">
            <h1>Welcome back</h1>
            <p>Login to continue your fitness journey.</p>
          </div>
          <label className="login-field login-enter">
            <MailIcon />
            <input
              name="email"
              type="email"
              aria-label="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="john123@gmail.com"
              autoComplete="email"
              required
            />
            <span>Email address</span>
          </label>
          <label className={`login-field login-enter${shaking ? ' shake' : ''}${credentialError ? ' login-field--error' : ''}`}>
            <LockIcon />
            <input
              name="password"
              ref={passwordRef}
              type={visiblePassword ? 'text' : 'password'}
              aria-label="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              minLength="8"
              required
            />
            <span>Password</span>
            <button
              type="button"
              onClick={() => setVisiblePassword((current) => !current)}
              aria-label={visiblePassword ? 'Hide password' : 'Show password'}
            >
              {visiblePassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </label>
          {error && (
            <p className="login-error login-password-error" aria-live="polite">
              {error}
            </p>
          )}
          <div className="login-options login-enter">
            <label>
              <input type="checkbox" /> <span>Remember me</span>
            </label>
            <button type="button" ref={forgotPasswordRef} onClick={() => setResetOpen(true)}>
              Forgot password?
            </button>
          </div>
          <button className="login-submit login-enter" type="submit" disabled={pending}>
            {pending ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </section>
      {resetOpen && <ForgotPasswordModal initialEmail={email} onClose={() => setResetOpen(false)} returnFocusRef={forgotPasswordRef} />}
    </main>
  )
}
