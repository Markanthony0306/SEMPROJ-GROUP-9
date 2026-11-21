import { useId, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, passwordPolicy, passwordPolicyMessage } from '../../shared/passwordPolicy'
import PasswordToggle from './PasswordToggle'
import Spinner from './Spinner'

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
    if (!passwordPolicy(values.password)) {
      setError(passwordPolicyMessage)
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
        {passwordPolicyMessage} Your current password is required.
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
              minLength={name === 'currentPassword' ? undefined : MIN_PASSWORD_LENGTH}
              maxLength={name === 'currentPassword' ? 72 : MAX_PASSWORD_LENGTH}
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
        {pending && <Spinner />}
        {pending ? 'Updating password...' : 'Update password'}
      </button>
    </form>
  )
}
