import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'

export default function CloudAccountLinkForm({ user, onLinked }) {
  const { token, login } = useAuth()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const controllerRef = useRef(null)
  useEffect(() => () => controllerRef.current?.abort(), [])
  if (!user?.supabaseLinkPending) return null

  const submit = async (event) => {
    event.preventDefault()
    if (controllerRef.current) return
    const controller = new AbortController()
    controllerRef.current = controller
    setPending(true)
    setError('')
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget))
      const result = await apiRequest('/profile/link-supabase', {
        token,
        method: 'POST',
        body: JSON.stringify(body),
        signal: controller.signal
      })
      if (controller.signal.aborted) return
      login(result.session)
      onLinked?.(result.session.user)
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause.message)
    } finally {
      controllerRef.current = null
      if (!controller.signal.aborted) setPending(false)
    }
  }

  return (
    <section className="cloud-account-link">
      <h3>Link your existing cloud account</h3>
      <p>
        An existing Supabase account needs verification. After linking, use its password to sign in.
      </p>
      <form className="mf" onSubmit={submit} aria-busy={pending}>
        <fieldset className="modal-fields" disabled={pending}>
          <label className="field">
            Current FitPulse password
            <input
              className="clay-in"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              maxLength={72}
            />
          </label>
          <label className="field">
            Existing cloud account password
            <input
              className="clay-in"
              name="cloudPassword"
              type="password"
              autoComplete="off"
              required
              maxLength={72}
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn" disabled={pending}>
            {pending ? 'Linking...' : 'Link and use cloud password'}
          </button>
        </fieldset>
      </form>
    </section>
  )
}
