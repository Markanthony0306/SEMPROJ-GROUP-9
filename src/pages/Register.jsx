import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'
import './Login.css'

export default function Register({ navigate }) {
  const { token } = useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    if (pending) return
    setError('')
    setMessage('')
    setPending(true)
    const form = event.currentTarget
    try {
      await apiRequest('/admin/members', {
        method: 'POST',
        token,
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      })
      form.reset()
      setMessage('Member account created.')
    } catch (cause) {
      setError(cause.message)
    } finally {
      setPending(false)
    }
  }
  return (
    <main id="login">
      <section className="lform clay reset-page">
        <div className="fhead">
          <h2>Create member account</h2>
        </div>
        <form onSubmit={submit} aria-busy={pending}>
          {['name', 'email', 'password'].map((name) => (
            <label className="auth-field" key={name}>
              <span className="input-label">
                {name === 'name' ? 'Full name' : name === 'email' ? 'Email address' : 'Password'}
              </span>
              <span className="inp">
                <input
                  aria-label={
                    name === 'name' ? 'Full name' : name === 'email' ? 'Email address' : 'Password'
                  }
                  autoComplete={
                    name === 'name' ? 'name' : name === 'email' ? 'email' : 'new-password'
                  }
                  name={name}
                  type={name === 'password' ? 'password' : name === 'email' ? 'email' : 'text'}
                  placeholder={name}
                  minLength={name === 'password' ? 8 : undefined}
                  required
                />
              </span>
            </label>
          ))}
          <input name="plan" type="hidden" value="Monthly" />
          {error && (
            <p className="err show" role="alert">
              {error}
            </p>
          )}
          {message && <p role="status">{message}</p>}
          <button className="btn lbtn" disabled={pending}>
            {pending ? 'Creating...' : 'Create account'}
          </button>
          <button className="btn ghost" type="button" onClick={() => navigate('admin')}>
            Back
          </button>
        </form>
      </section>
    </main>
  )
}
