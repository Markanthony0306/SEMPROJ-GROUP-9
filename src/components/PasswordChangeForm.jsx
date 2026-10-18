import { useId, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'
import PasswordToggle from './PasswordToggle'

export default function PasswordChangeForm() {
  const { token, login } = useAuth()
  const helpId = useId()
  const [values, setValues] = useState({ currentPassword: '', password: '', confirmPassword: '' })
  const [visible, setVisible] = useState({})
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    if (pending) return
    setError('')
    setMessage('')
    if (values.password.length < 8 || new TextEncoder().encode(values.password).length > 72) {
      setError(
        'Use at least 8 characters, up to 72 bytes. Symbols and emojis can use more than one byte.'
      )
      return
    }
    if (values.password !== values.confirmPassword) {
      setError('The new passwords do not match.')
      return
    }
    if (values.password === values.currentPassword) {
      setError('Choose a password different from your current password.')
      return
    }
    setPending(true)
    try {
      const result = await apiRequest('/profile/change-password', {
        token,
        method: 'POST',
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          password: values.password,
          confirmPassword: values.confirmPassword
        })
      })
      if (result.session) login(result.session)
      setValues({ currentPassword: '', password: '', confirmPassword: '' })
      setVisible({})
      setMessage('Password updated. Use your new password the next time you log in.')
    } catch (cause) {
      setError(cause.message || 'Could not update your password.')
    } finally {
      setPending(false)
    }
  }
  return (
    <form className="mf password-form" onSubmit={submit} aria-busy={pending}>
      <p id={helpId} className="form-help">
        Use at least 8 characters. Your current password is required.
      </p>
      {[
        ['currentPassword', 'Current password'],
        ['password', 'New password'],
        ['confirmPassword', 'Confirm new password']
      ].map(([name, label]) => (
        <label className="field" key={name}>
          {label}
          <span className="password-control">
            <input
              className="clay-in"
              name={name}
              type={visible[name] ? 'text' : 'password'}
              autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
              required
              minLength={name === 'currentPassword' ? undefined : 8}
              maxLength={72}
              aria-describedby={helpId}
              value={values[name]}
              disabled={pending}
              onChange={(event) => {
                setValues((previous) => ({ ...previous, [name]: event.target.value }))
                setError('')
                setMessage('')
              }}
            />
            <PasswordToggle
              visible={Boolean(visible[name])}
              disabled={pending}
              label={label.toLowerCase()}
              onToggle={() => setVisible((previous) => ({ ...previous, [name]: !previous[name] }))}
            />
          </span>
        </label>
      ))}
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
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Updating password...' : 'Update password'}
      </button>
    </form>
  )
}
