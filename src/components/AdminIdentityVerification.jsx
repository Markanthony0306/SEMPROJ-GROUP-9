import { useEffect, useRef, useState } from 'react'
import { apiRequest } from '../utils/api'
import { isLoginSession, isStripeVerificationUrl } from '../utils/adminIdentity'
import './AdminIdentityVerification.css'

const CHECK_INTERVAL = 4000
const REQUEST_TIMEOUT = 15000
const RATE_LIMIT_COOLDOWN = 30000

export default function AdminIdentityVerification({
  challenge,
  initialVerificationUrl,
  onComplete,
  onCancel
}) {
  const [verificationUrl, setVerificationUrl] = useState(initialVerificationUrl || '')
  const [status, setStatus] = useState(initialVerificationUrl ? 'requires_input' : 'processing')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const finished = useRef(false)
  const { challengeToken, expiresAt } = challenge

  useEffect(() => {
    const expiresIn = Date.parse(expiresAt) - Date.now()
    const timeout = window.setTimeout(
      () => {
        if (!finished.current) {
          onCancel('Your verification request expired. Please log in again.')
        }
      },
      Math.max(0, expiresIn)
    )
    return () => window.clearTimeout(timeout)
  }, [expiresAt, onCancel])

  useEffect(() => {
    if (!cooldownUntil) return
    const timeout = window.setTimeout(
      () => setCooldownUntil(0),
      Math.max(0, cooldownUntil - Date.now())
    )
    return () => window.clearTimeout(timeout)
  }, [cooldownUntil])

  useEffect(() => {
    // A newly created challenge waits for the user to choose Continue to Stripe.
    // A saved challenge resumes with a server check when the user returns.
    if ((initialVerificationUrl && attempt === 0) || finished.current) return
    let cancelled = false
    let pollTimeout
    let requestTimeout
    let controller

    const checkVerification = async () => {
      if (cancelled || finished.current) return
      if (Date.parse(expiresAt) <= Date.now()) {
        onCancel('Your verification request expired. Please log in again.')
        return
      }
      controller = new AbortController()
      requestTimeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
      setChecking(true)
      setError('')
      try {
        const response = await apiRequest('/auth/admin-identity/complete', {
          method: 'POST',
          body: JSON.stringify({ challengeToken }),
          signal: controller.signal
        })
        if (cancelled) return
        if (isLoginSession(response) && response.user.role === 'admin') {
          finished.current = true
          setStatus('verified')
          onComplete(response)
          return
        }
        if (!['processing', 'requires_input'].includes(response.status)) {
          throw new Error('We could not confirm your verification. Please check again.')
        }
        setStatus(response.status)
        if (response.verificationUrl) {
          if (!isStripeVerificationUrl(response.verificationUrl)) {
            throw new Error('The verification link was invalid. Please check again.')
          }
          setVerificationUrl(response.verificationUrl)
        }
        if (response.status === 'processing') {
          setVerificationUrl('')
          // Schedule after this request finishes so checks cannot overlap.
          pollTimeout = window.setTimeout(checkVerification, CHECK_INTERVAL)
        }
      } catch (requestError) {
        if (cancelled) return
        if ([401, 403].includes(requestError.status)) {
          onCancel(
            requestError.status === 401
              ? 'Your verification request is no longer valid. Please log in again.'
              : requestError.message || 'Identity verification failed. Please log in again.'
          )
          return
        }
        if (requestError.status === 429) {
          setCooldownUntil(Date.now() + RATE_LIMIT_COOLDOWN)
          setError('Too many verification checks. Wait 30 seconds, then check again.')
        } else {
          setError(
            controller.signal.aborted
              ? 'The verification check timed out. Please check again.'
              : requestError.message || 'We could not check verification. Please try again.'
          )
        }
        // Keep the challenge for a manual retry after network or provider errors.
      } finally {
        window.clearTimeout(requestTimeout)
        if (!cancelled) setChecking(false)
      }
    }

    checkVerification()
    return () => {
      cancelled = true
      window.clearTimeout(pollTimeout)
      window.clearTimeout(requestTimeout)
      controller?.abort()
    }
  }, [challengeToken, expiresAt, initialVerificationUrl, attempt, onComplete, onCancel])

  const continueToStripe = () => {
    if (checking || finished.current) return
    if (Date.parse(expiresAt) <= Date.now()) {
      onCancel('Your verification request expired. Please log in again.')
      return
    }
    if (!isStripeVerificationUrl(verificationUrl)) {
      setError('The verification link is unavailable. Check verification to request it again.')
      return
    }
    window.location.assign(verificationUrl)
  }

  const waitingForResult = status === 'processing'

  return (
    <div className="admin-identity" aria-busy={checking}>
      <div className="admin-identity-intro">
        <span className="admin-identity-badge">Admin security</span>
        <p>
          Verify your identity with Stripe before accessing the admin dashboard. Have your
          government-issued photo ID and camera ready to photograph your ID and take a selfie.
        </p>
      </div>
      <ol className="admin-identity-steps" aria-label="Admin verification steps">
        <li>
          <span className="admin-identity-step-number" aria-hidden="true">
            1
          </span>
          <div>
            <strong>Capture your ID</strong>
            <p>Photograph your ID with your camera so Stripe can check its details.</p>
          </div>
        </li>
        <li>
          <span className="admin-identity-step-number" aria-hidden="true">
            2
          </span>
          <div>
            <strong>Take a selfie</strong>
            <p>Stripe compares your selfie with your ID photo.</p>
          </div>
        </li>
        <li>
          <span className="admin-identity-step-number" aria-hidden="true">
            3
          </span>
          <div>
            <strong>Complete verified login</strong>
            <p>FitPulse confirms the result before signing you in.</p>
          </div>
        </li>
      </ol>
      <p className="admin-identity-status" role="status" aria-live="polite">
        {error
          ? 'Verification is paused. Your request is saved while you retry.'
          : status === 'verified'
            ? 'Identity verified. Completing your login...'
            : waitingForResult
              ? 'Checking your verification. This may take a moment after you return from Stripe.'
              : 'Continue to Stripe to complete or retry your ID and selfie verification.'}
      </p>
      {error && (
        <p className="admin-identity-error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-identity-actions">
        {!waitingForResult && (
          <button
            className="btn lbtn"
            type="button"
            disabled={checking || !verificationUrl || Boolean(cooldownUntil) || finished.current}
            onClick={continueToStripe}
          >
            Continue to Stripe
          </button>
        )}
        <button
          className="btn ghost"
          type="button"
          disabled={checking || Boolean(cooldownUntil) || finished.current}
          onClick={() => setAttempt((value) => value + 1)}
        >
          {checking ? 'Checking verification...' : 'Check verification'}
        </button>
        <button
          className="forgot-link"
          type="button"
          disabled={finished.current}
          onClick={() => onCancel()}
        >
          Cancel and return to login
        </button>
      </div>
      <p className="admin-identity-privacy">
        Camera photos of your ID and selfies are submitted directly to Stripe. Your login request
        expires in 20 minutes. Keep this browser tab open to return to FitPulse.
      </p>
    </div>
  )
}
