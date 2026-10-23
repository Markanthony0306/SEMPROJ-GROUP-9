import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'
import './Login.css'

export default function Register({ navigate }) {
  const { token } = useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState('')

  useEffect(() => {
    let cancelled = false
    apiRequest('/admin/membership-plans', { token })
      .then((result) => {
        if (!cancelled) setPlans(result.membershipPlans || [])
      })
      .catch((cause) => {
        if (!cancelled) setError(cause.message)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const submit = async (event) => {
    event.preventDefault()
    if (pending) return
    setError('')
    setMessage('')
    setPending(true)
    const form = event.currentTarget
    try {
      const values = Object.fromEntries(new FormData(form))
      values.recordPayment = new FormData(form).get('recordPayment') === 'on'
      const result = await apiRequest('/admin/members', {
        method: 'POST',
        token,
        body: JSON.stringify(values)
      })
      form.reset()
      setSelectedPlan('')
      setMessage(result.message || 'Member account created.')
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
          <label className="auth-field">
            <span className="input-label">Full name</span>
            <span className="inp">
              <input name="name" autoComplete="name" placeholder="Full name" required />
            </span>
          </label>
          <label className="auth-field">
            <span className="input-label">Email address</span>
            <span className="inp">
              <input name="email" type="email" autoComplete="email" placeholder="Email address" required />
            </span>
          </label>
          <label className="auth-field">
            <span className="input-label">Contact number</span>
            <span className="inp">
              <input name="phone" type="tel" autoComplete="tel" placeholder="Contact number" />
            </span>
          </label>
          <label className="auth-field">
            <span className="input-label">Membership plan</span>
            <span className="inp">
              <select
                name="plan"
                value={selectedPlan}
                onChange={(event) => setSelectedPlan(event.target.value)}
                required
              >
                <option value="" disabled>Select a plan</option>
                {plans.map((plan) => {
                  const studentRate = /student/i.test(plan.plan_name) && !/non[-\s]?student/i.test(plan.plan_name)
                  const price = new Intl.NumberFormat('en-PH', {
                    style: 'currency', currency: 'PHP'
                  }).format(Number(plan.price || 0))
                  return (
                    <option key={plan.plan_id} value={plan.plan_name}>
                      {plan.plan_name} - {price}{studentRate ? ' (student discount)' : ''}
                    </option>
                  )
                })}
              </select>
            </span>
          </label>
          <p className="form-help">
            Choose the Student plan to apply its configured student rate. Confirm eligibility before selecting it.
          </p>
          <label className="auth-field">
            <span className="input-label">Payment method</span>
            <span className="inp">
              <select name="method">
                <option>Cash</option>
                <option>GCash</option>
              </select>
            </span>
          </label>
          <label className="set">
            Payment already received
            <input type="checkbox" name="recordPayment" />
          </label>
          <p className="form-help">
            A temporary password will be generated and emailed. Check payment only after receiving it.
          </p>
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
