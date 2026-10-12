import { useCallback, useEffect, useState } from 'react'
import DashboardShell, { Icon } from '../components/DashboardShell'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'
import './UserPage.css'
import DataTable from '../components/DataTable'
import MemberQr from '../components/MemberQr'
import ProfilePhoto from '../components/ProfilePhoto'
import FitnessSculpture from '../components/FitnessSculpture'
import { downloadPayments } from '../utils/paymentExport'
import PasswordChangeForm from '../components/PasswordChangeForm'
import { membershipState } from '../utils/membership'

const validDate = (value) => value && !Number.isNaN(new Date(value).getTime())
const date = (value) =>
  validDate(value)
    ? new Date(value).toLocaleDateString('en-PH', {
        timeZone: 'Asia/Manila',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Not set'
const time = (value) =>
  validDate(value)
    ? new Date(value).toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        year: 'numeric'
      })
    : 'Date unavailable'
const money = (value) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0))
const latestFirst = (items) => [...items].sort((a, b) => new Date(b.date) - new Date(a.date))

function StatCard({ label, value, hint, icon }) {
  return (
    <article className="stat clay">
      <span className="member-stat-icon">
        <Icon name={icon} size={23} />
      </span>
      <div>
        <small>{label}</small>
        <b>{value}</b>
        <p>{hint}</p>
      </div>
    </article>
  )
}

export default function UserPage({ user, onSignOut }) {
  const { token } = useAuth()
  const [section, setSection] = useState('Dashboard')
  const [attendance, setAttendance] = useState([])
  const [payments, setPayments] = useState([])
  const [currentUser, setCurrentUser] = useState(user)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionPending, setActionPending] = useState(false)
  const load = useCallback(
    async (signal) => {
      try {
        const [profile, attendanceResult, paymentResult] = await Promise.all([
          apiRequest('/me', { token, signal }),
          apiRequest('/attendance', { token, signal }),
          apiRequest('/payments', { token, signal })
        ])
        if (signal?.aborted) return
        setCurrentUser(profile.user)
        setAttendance(latestFirst(attendanceResult.attendance))
        setPayments(latestFirst(paymentResult.payments))
        setError('')
      } catch (cause) {
        if (!signal?.aborted) setError(cause.message)
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [token]
  )
  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])
  useEffect(() => {
    if (section !== 'My QR') return
    const controller = new AbortController()
    const timer = window.setInterval(() => load(controller.signal), 10000)
    return () => {
      window.clearInterval(timer)
      controller.abort()
    }
  }, [section, load])
  const action = async (path, options, message) => {
    if (actionPending) return false
    setActionPending(true)
    setNotice('')
    setError('')
    try {
      await apiRequest(path, { token, ...options })
      setNotice(message)
      await load()
      return true
    } catch (cause) {
      setError(cause.message)
      return false
    } finally {
      setActionPending(false)
    }
  }
  const membership = membershipState(currentUser)
  const expiry = membership.daysLeft
  const expired = membership.status === 'expired'
  const status = membership.label
  const membershipNote = expired
    ? 'Your membership has expired. Visit the front desk to renew.'
    : membership.status !== 'active' && membership.status !== 'incomplete'
      ? 'Your membership is not currently active. Please contact the front desk.'
      : expiry === null
        ? 'Your expiry date has not been set. Ask the front desk to confirm it.'
        : expiry <= 7
          ? `Your membership expires in ${expiry} day(s). Visit the front desk to renew.`
          : `Your membership is valid until ${date(currentUser.membershipEnd)}.`
  const settings = (
    <section className="grid g2">
      <article className="card clay">
        <h2>Profile</h2>
        <ProfilePhoto user={currentUser} onSaved={setCurrentUser} />
        <form
          className="mf"
          onSubmit={(event) => {
            event.preventDefault()
            action(
              '/profile',
              {
                method: 'PATCH',
                body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))
              },
              'Profile saved.'
            )
          }}
        >
          <label className="field">
            Full name
            <input className="clay-in" name="name" defaultValue={currentUser?.name} required />
          </label>
          <label className="field">
            Email
            <input
              className="clay-in"
              name="email"
              defaultValue={currentUser?.email}
              type="email"
              required
            />
          </label>
          <label className="field">
            Contact number
            <input className="clay-in" name="phone" defaultValue={currentUser?.phone || ''} />
          </label>
          <button className="btn" disabled={actionPending || loading}>
            {actionPending ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </article>
      <article className="card clay">
        <h2>Change Password</h2>
        <PasswordChangeForm />
      </article>
    </section>
  )
  const views = {
    Dashboard: (
      <>
        <section className="grid member-stats" aria-label="Membership overview">
          <StatCard
            label="Membership plan"
            value={currentUser?.plan || 'Not set'}
            hint="Your current gym plan"
            icon="card"
          />
          <StatCard
            label="Membership status"
            value={status}
            hint={expired ? 'Renew at the front desk' : 'Current membership status'}
            icon="bell"
          />
          <StatCard
            label="Days remaining"
            value={expiry ?? 'Not set'}
            hint={
              expiry === null
                ? 'Expiry date not recorded'
                : `Expires ${date(currentUser.membershipEnd)}`
            }
            icon="chart"
          />
          <StatCard
            label="Total check-ins"
            value={loading ? 'Loading...' : attendance.length}
            hint="Recorded gym visits"
            icon="dumbbell"
          />
        </section>
        <section className="grid member-overview">
          <article className="card clay">
            <div className="illustrated-heading">
              <div>
                <h2>My membership</h2>
                <p>Your plan, expiry date, and gym access.</p>
                <span
                  className={`member-status ${expired ? 'is-expired' : status === 'Active' ? 'is-active' : ''}`}
                >
                  {status}
                </span>
              </div>
              <FitnessSculpture />
            </div>
            <dl className="member-details">
              <div>
                <dt>Member ID</dt>
                <dd className="member-id">{currentUser?.id || 'Unavailable'}</dd>
              </div>
              <div>
                <dt>Plan</dt>
                <dd>{currentUser?.plan || 'Not set'}</dd>
              </div>
              <div>
                <dt>Start date</dt>
                <dd>{date(currentUser?.membershipStart || currentUser?.joined)}</dd>
              </div>
              <div>
                <dt>Expiry date</dt>
                <dd>{date(currentUser?.membershipEnd)}</dd>
              </div>
              <div>
                <dt>Contact number</dt>
                <dd>{currentUser?.phone || 'Not added'}</dd>
              </div>
            </dl>
            <p className="member-note">
              <Icon name="bell" size={18} />
              {membershipNote}
            </p>
            <button
              className="member-text-button"
              type="button"
              onClick={() => setSection('Settings')}
            >
              Update profile &rarr;
            </button>
          </article>
        </section>
      </>
    ),
    'My QR': (
      <article className="card clay member-qr-page">
        <div className="member-card-heading">
          <h2>QR check-in</h2>
          <Icon name="qr" />
        </div>
        <div className="illustrated-heading">
          <p>Present your temporary code at the gym entrance.</p>
          <FitnessSculpture variant="scanner" />
        </div>
        <MemberQr onRefresh={() => load()} />
        <dl className="member-details">
          <div>
            <dt>Member ID</dt>
            <dd className="member-id">{currentUser?.id || 'Unavailable'}</dd>
          </div>
        </dl>
      </article>
    ),
    Attendance: (
      <article className="card clay">
        <h2>My Attendance History</h2>
        <DataTable headings={['Date & Time', 'Recorded by']} empty={!attendance.length}>
          {attendance.map((item) => (
            <tr key={item.id}>
              <td data-label="Date & Time">{time(item.date)}</td>
              <td>{item.source || 'Staff'}</td>
            </tr>
          ))}
        </DataTable>
      </article>
    ),
    Payments: (
      <article className="card clay">
        <div className="illustrated-heading">
          <div>
            <h2>My Payment History</h2>
            <p>Cash, GCash, and membership renewal records.</p>
          </div>
          <FitnessSculpture />
        </div>
        <div className="payment-actions">
          <button
            className="btn"
            type="button"
            disabled={loading || !payments.length}
            onClick={() => downloadPayments(payments)}
          >
            Export CSV
          </button>
          <small>Exports all your payment records.</small>
        </div>
        <DataTable
          headings={['Payment', 'Plan', 'Amount', 'Method', 'Date']}
          empty={!payments.length}
        >
          {payments.map((item) => (
            <tr key={item.id}>
              <td data-label="Payment">{item.type || 'Membership'}</td>
              <td data-label="Plan">{item.plan || 'Not recorded'}</td>
              <td data-label="Amount">{money(item.amount)}</td>
              <td data-label="Method">{item.method || 'Not recorded'}</td>
              <td data-label="Date">{date(item.date)}</td>
            </tr>
          ))}
        </DataTable>
      </article>
    ),
    Notifications: (
      <article className="card clay">
        <h2>Notifications</h2>
        <div className="item clay-in">{membershipNote}</div>
      </article>
    ),
    Settings: settings
  }
  return (
    <DashboardShell
      className="member-app"
      role={currentUser?.role || 'user'}
      user={currentUser}
      onSignOut={onSignOut}
      activeSection={section}
      onSectionChange={setSection}
    >
      {loading && (
        <p className="member-feedback" role="status">
          Loading your membership...
        </p>
      )}
      {error && (
        <p className="member-feedback is-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <div className="member-feedback" role="status">
          {notice}
          <button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}>
            &times;
          </button>
        </div>
      )}
      {views[section]}
    </DashboardShell>
  )
}
