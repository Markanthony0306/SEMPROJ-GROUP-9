import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../components/brand/useTheme'
import FaceCapture from '../components/FaceCapture'
import { apiRequest } from '../utils/api'
import './Login.css'

const ICONS = {
  alert: (
    <>
      <path d="M12 3 22 21H2L12 3Z" />
      <path d="M12 10v5M12 18h.01" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeoff: (
    <>
      <path d="m3 3 18 18M10.6 6.2A9.7 9.7 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.3 7.6C3.6 9.3 2 12 2 12s4 6 10 6a9.6 9.6 0 0 0 4-.9M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  fb: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z" />,
  ig: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="m2 7 10 7 10-7" />
    </>
  ),
  qr: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM20 14v7h-3" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0" />
    </>
  ),
  wallet: (
    <>
      <rect x="2" y="6" width="20" height="14" rx="3" />
      <path d="M2 10h20" />
      <circle cx="17" cy="15" r="1.4" />
    </>
  ),
  moon: <path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" />
    </>
  )
}

function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}

function Brand() {
  return (
    <>
      <svg
        width="46"
        height="24"
        viewBox="0 0 88 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 7v14M4 14h14l5-9 8 18 7-13 4 4h36M84 7v14M84 14h-6" />
      </svg>
      Fit<span>Pulse</span>
    </>
  )
}

function Dumbbell() {
  return (
    <svg className="dumb" viewBox="0 0 300 200" aria-hidden="true">
      <defs>
        <linearGradient id="gO" x1="0" x2="1">
          <stop offset="0" stopColor="#ffb23a" />
          <stop offset=".55" stopColor="#f08a0c" />
          <stop offset="1" stopColor="#d9700a" />
        </linearGradient>
        <linearGradient id="gR" x1="0" x2="1">
          <stop offset="0" stopColor="#f0525a" />
          <stop offset=".55" stopColor="#d62f37" />
          <stop offset="1" stopColor="#b21f28" />
        </linearGradient>
        <linearGradient id="gB" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3c7a9b" />
          <stop offset="1" stopColor="#0a3249" />
        </linearGradient>
        <filter id="sh" x="-20%" y="-20%" width="150%" height="170%">
          <feDropShadow dx="6" dy="10" stdDeviation="7" floodColor="#0d2b3e" floodOpacity=".3" />
        </filter>
      </defs>
      <g filter="url(#sh)" transform="rotate(-7 150 100)">
        <rect x="82" y="93" width="136" height="15" rx="7.5" fill="url(#gB)" />
        <rect x="18" y="56" width="30" height="92" rx="15" fill="url(#gO)" />
        <rect x="54" y="46" width="32" height="108" rx="16" fill="url(#gR)" />
        <rect x="214" y="46" width="32" height="108" rx="16" fill="url(#gR)" />
        <rect x="252" y="56" width="30" height="92" rx="15" fill="url(#gO)" />
        <g fill="#fff" opacity=".28">
          <rect x="24" y="68" width="5" height="60" rx="2.5" />
          <rect x="60" y="58" width="5" height="82" rx="2.5" />
          <rect x="220" y="58" width="5" height="82" rx="2.5" />
          <rect x="258" y="68" width="5" height="60" rx="2.5" />
        </g>
      </g>
    </svg>
  )
}

export default function Login({ onLogin }) {
  const [email, setEmail] = useState(() => localStorage.getItem('fp_email') || '')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(() => Boolean(localStorage.getItem('fp_email')))
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [pending, setPending] = useState(false)
  const [facePending, setFacePending] = useState(false)
  const [faceChallenge, setFaceChallenge] = useState('')
  const [shaking, setShaking] = useState(false)
  const [errors, setErrors] = useState({ email: '', password: '', general: '' })
  const [resetOpen, setResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetPending, setResetPending] = useState(false)
  const [resetError, setResetError] = useState('')
  const [toast, setToast] = useState('')
  const { dark, toggle: toggleTheme } = useTheme()
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const submissionLock = useRef(false)
  const resetDialogRef = useRef(null)

  useEffect(() => {
    if (!resetOpen) return
    const previousFocus = document.activeElement
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setResetOpen(false)
      if (event.key !== 'Tab') return
      const controls = resetDialogRef.current?.querySelectorAll(
        'button:not(:disabled), input:not(:disabled)'
      )
      if (!controls?.length) return
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [resetOpen])

  const clearErrors = () => setErrors({ email: '', password: '', general: '' })
  const finishLogin = (session) => {
    if (remember) localStorage.setItem('fp_email', session.user.email.trim().toLowerCase())
    else localStorage.removeItem('fp_email')
    onLogin(session)
  }
  const showToast = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }
  const submit = async (event) => {
    event.preventDefault()
    if (submissionLock.current) return
    // Read what is actually in the inputs. Browser/password-manager autofill can
    // update their DOM values without first updating React's state.
    const form = new FormData(event.currentTarget)
    const normalizedEmail = String(form.get('email') || '')
      .trim()
      .toLowerCase()
    const submittedPassword = String(form.get('password') || '')
    const nextErrors = {
      email: /^\S+@\S+\.\S+$/.test(normalizedEmail) ? '' : 'Enter a valid email address',
      password: submittedPassword ? '' : 'Enter your password',
      general: ''
    }
    setErrors(nextErrors)
    if (nextErrors.email || nextErrors.password) return
    setEmail(normalizedEmail)
    setPassword(submittedPassword)
    submissionLock.current = true
    setPending(true)
    try {
      const session = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail, password: submittedPassword })
      })
      if (session.requiresFaceVerification && session.challengeToken) {
        setFaceChallenge(session.challengeToken)
        setPending(false)
        submissionLock.current = false
        return
      }
      finishLogin(session)
    } catch (error) {
      setShowPassword(false)
      setErrors({
        email: '',
        password: '',
        general: error.message || 'We could not log you in. Please try again.'
      })
      setShaking(true)
      submissionLock.current = false
      setPending(false)
      // Wait for disabled inputs to re-enable before moving keyboard focus.
      window.requestAnimationFrame(() => passwordRef.current?.focus())
    }
  }
  const verifyFace = async (descriptor) => {
    setFacePending(true)
    try {
      const session = await apiRequest('/auth/face-verify', {
        method: 'POST',
        body: JSON.stringify({ challengeToken: faceChallenge, descriptor })
      })
      finishLogin(session)
    } finally {
      setFacePending(false)
    }
  }
  const sendReset = async (event) => {
    event.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(resetEmail.trim())) {
      setResetError('Enter a valid email address')
      return
    }
    setResetError('')
    setResetPending(true)
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail.trim() })
      })
      setResetOpen(false)
      showToast('If that email has an account, a reset link was sent')
    } catch (error) {
      setResetError(error.message || 'We could not send the reset link. Please try again.')
    } finally {
      setResetPending(false)
    }
  }

  return (
    <div id="login">
      <button
        className="ib theme-fab"
        type="button"
        onClick={toggleTheme}
        title="Toggle theme"
        aria-label="Toggle theme"
      >
        <Icon name={dark ? 'sun' : 'moon'} />
      </button>
      <div className={`lwrap${faceChallenge ? ' verification-layout' : ''}`}>
        {!faceChallenge && (
          <section className="hero clay">
            <div className="brandbar">
              <Brand />
            </div>
            <div className="hbody">
              <Dumbbell />
              <h1>Make every session count.</h1>
              <p>Your membership, check-ins, and progress in one place.</p>
              <div className="feats">
                <span className="feat">
                  <Icon name="qr" size={16} />
                  QR check-in
                </span>
                <span className="feat">
                  <Icon name="bell" size={16} />
                  Expiry reminders
                </span>
                <span className="feat">
                  <Icon name="wallet" size={16} />
                  Payment records
                </span>
              </div>
            </div>
          </section>
        )}
        <section
          className={`lform clay${shaking ? ' shake' : ''}`}
          onAnimationEnd={() => setShaking(false)}
        >
          <div className="fhead">
            <h2>{faceChallenge ? 'Verify your face' : 'Welcome back'}</h2>
            <p>
              {faceChallenge
                ? `Complete face verification for ${email.trim().toLowerCase()}.`
                : 'Login to continue your fitness journey.'}
            </p>
          </div>
          {faceChallenge ? (
            <div className="login-face-step">
              <FaceCapture
                onCaptured={verifyFace}
                disabled={facePending}
                actionLabel={facePending ? 'Verifying…' : 'Verify and continue'}
              />
              <button
                className="btn ghost"
                type="button"
                disabled={facePending}
                onClick={() => {
                  setFaceChallenge('')
                  clearErrors()
                  submissionLock.current = false
                }}
              >
                Back to password login
              </button>
            </div>
          ) : (
            <>
              {errors.general && (
                <div className="banner show" role="alert">
                  <Icon name="alert" size={16} />
                  {errors.general}
                </div>
              )}
              <form onSubmit={submit} noValidate aria-busy={pending}>
                <span className="input-label" id="login-email-label">
                  Email address
                </span>
                <label className={`inp${errors.email ? ' bad' : ''}`}>
                  <Icon name="mail" />
                  <input
                    ref={emailRef}
                    disabled={pending}
                    aria-labelledby="login-email-label"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'login-email-error' : undefined}
                    name="email"
                    type="email"
                    autoComplete="username"
                    placeholder="john123@gmail.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      clearErrors()
                    }}
                  />
                </label>
                {errors.email && (
                  <div id="login-email-error" className="err show" role="alert">
                    {errors.email}
                  </div>
                )}
                <span className="input-label" id="login-password-label">
                  Password
                </span>
                <label className={`inp${errors.password ? ' bad' : ''}`}>
                  <Icon name="lock" />
                  <input
                    ref={passwordRef}
                    disabled={pending}
                    aria-labelledby="login-password-label"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'login-password-error' : undefined}
                    name="password"
                    onBlur={() => setCapsLock(false)}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onKeyDown={(event) => setCapsLock(event.getModifierState('CapsLock'))}
                    onKeyUp={(event) => setCapsLock(event.getModifierState('CapsLock'))}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      clearErrors()
                    }}
                  />
                  <button
                    className="eye"
                    type="button"
                    disabled={pending}
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    <Icon name={showPassword ? 'eyeoff' : 'eye'} />
                  </button>
                </label>
                {errors.password && (
                  <div id="login-password-error" className="err show" role="alert">
                    {errors.password}
                  </div>
                )}
                <div className={`caps${capsLock ? ' show' : ''}`}>
                  <Icon name="alert" size={14} />
                  Caps Lock is on
                </div>
                <div className="opts">
                  <label>
                    <input
                      type="checkbox"
                      disabled={pending}
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                    />{' '}
                    Remember me
                  </label>
                  <button
                    className="forgot-link"
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setResetEmail(email)
                      setResetError('')
                      setResetOpen(true)
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <button
                  className={`btn lbtn login-submit${pending ? ' load' : ''}`}
                  type="submit"
                  disabled={pending}
                  aria-busy={pending}
                >
                  <span className="sp" aria-hidden="true" />
                  <span className="tx" aria-live="polite">
                    {pending ? 'Logging in' : 'Log in'}
                  </span>
                </button>
              </form>
              <p className="lfoot">Need an account? Ask your gym admin to create one for you.</p>
            </>
          )}
        </section>
      </div>
      {resetOpen && (
        <div
          ref={resetDialogRef}
          className="modal show"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-title"
          onMouseDown={(event) => event.target === event.currentTarget && setResetOpen(false)}
        >
          <div className="clay" id="mbody">
            <div className="mh">
              <h2 id="reset-title">Reset password</h2>
              <button
                className="ib sm"
                type="button"
                onClick={() => setResetOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={sendReset}>
              <p className="modal-copy">
                Enter your account email and we'll send you a reset link.
              </p>
              <label className="field">
                Email
                <input
                  className="clay-in"
                  autoFocus
                  autoComplete="email"
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                />
              </label>
              {resetError && <p className="reset-error">{resetError}</p>}
              <div className="ma">
                <button className="btn" type="submit" disabled={resetPending}>
                  {resetPending ? 'Sending...' : 'Send reset link'}
                </button>
                <button className="btn ghost" type="button" onClick={() => setResetOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div role="status" aria-live="polite" id="toast" className={`clay${toast ? ' show' : ''}`}>
        {toast}
      </div>
    </div>
  )
}
