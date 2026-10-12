import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DashboardShell, { Icon } from '../components/DashboardShell'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'
import DataTable from '../components/DataTable'
import ProfilePhoto from '../components/ProfilePhoto'
import ProfileAvatar from '../components/ProfileAvatar'
import FitnessSculpture from '../components/FitnessSculpture'
import { downloadPayments } from '../utils/paymentExport'
import PasswordChangeForm from '../components/PasswordChangeForm'
import AdminReports from '../components/AdminReports'
import { membershipState, reminderMembers, inspectionDue } from '../utils/membership'
import './AdminStaffPage.css'

const money = (value) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0))
const date = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-PH', {
        timeZone: 'Asia/Manila',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : '—'
const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    : '—'
const plans = ['Monthly', 'Quarterly', 'Annual', 'Unlimited Monthly']

function Modal({ title, children, onClose, busy, error }) {
  return (
    <div
      className="modal show"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      aria-busy={busy}
      onMouseDown={(event) => !busy && event.target === event.currentTarget && onClose()}
    >
      <section className="clay" id="mbody">
        <div className="mh">
          <h2>{title}</h2>
          <button
            className="ib sm"
            type="button"
            disabled={busy}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {busy && (
          <p className="form-help" role="status">
            Saving...
          </p>
        )}
        <fieldset className="modal-fields" disabled={busy}>
          {children}
        </fieldset>
      </section>
    </div>
  )
}
function Pill({ status }) {
  const state = String(status || '').toLowerCase()
  return (
    <span
      className={`pill ${state === 'active' || state === 'good' ? 'p-ok' : state === 'expired' || state === 'out of service' ? 'p-bad' : 'p-warn'}`}
    >
      {status || 'Active'}
    </span>
  )
}
export default function AdminStaffPage({ user, onSignOut }) {
  const { token } = useAuth()
  const [currentUser, setCurrentUser] = useState(user)
  const [section, setSection] = useState('Dashboard')
  const [data, setData] = useState({
    members: [],
    attendance: [],
    payments: [],
    equipment: [],
    maintenance: [],
    settings: { gym: 'FitPulse Gym', remind: 7, emailOn: true }
  })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [modal, setModal] = useState(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const actionLock = useRef(false)
  const load = useCallback(
    async (signal) => {
      try {
        const [members, attendance, payments, equipment, settings, profile] = await Promise.all([
          apiRequest('/members', { token, signal }),
          apiRequest('/attendance', { token, signal }),
          apiRequest('/payments', { token, signal }),
          apiRequest('/admin/equipment', { token, signal }),
          apiRequest('/admin/settings', { token, signal }),
          apiRequest('/me', { token, signal })
        ])
        if (signal?.aborted) return
        setCurrentUser(profile.user)
        setData({ ...members, ...attendance, ...payments, ...equipment, ...settings })
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
    if (section !== 'Attendance') return
    const controller = new AbortController()
    const timer = window.setInterval(() => load(controller.signal), 5000)
    return () => {
      window.clearInterval(timer)
      controller.abort()
    }
  }, [section, load])
  const act = async (path, options, message) => {
    if (actionLock.current) return false
    actionLock.current = true
    setPending(true)
    setError('')
    setNotice('')
    try {
      await apiRequest(path, { token, ...options })
      setNotice(message)
      setModal(null)
      await load()
      return true
    } catch (cause) {
      setError(cause.message)
      return false
    } finally {
      actionLock.current = false
      setPending(false)
    }
  }
  const members = useMemo(
    () => data.members.filter((member) => !['admin', 'staff'].includes(member.role)),
    [data.members]
  )
  const active = members.filter((member) => membershipState(member).status === 'active').length
  const expiredMembers = members.filter((member) => membershipState(member).status === 'expired')
  const reminderList = reminderMembers(members, data.settings.remind)
  const equipmentDue = data.equipment.filter((item) => inspectionDue(item))
  const renewals = data.payments.filter((payment) => payment.type === 'Renewal')
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
  const revenue = data.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const createMember = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    act(
      '/admin/members',
      {
        method: 'POST',
        body: JSON.stringify({
          ...Object.fromEntries(form),
          recordPayment: form.get('recordPayment') === 'on'
        })
      },
      'Member account created.'
    )
  }
  const updateMember = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    act(
      `/admin/members/${modal.member.id}`,
      { method: 'PATCH', body: JSON.stringify(Object.fromEntries(form)) },
      'Member updated.'
    )
  }
  const recordPayment = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    act(
      '/admin/payments',
      { method: 'POST', body: JSON.stringify(Object.fromEntries(form)) },
      'Payment recorded.'
    )
  }
  const settings = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    act(
      '/admin/settings',
      {
        method: 'PATCH',
        body: JSON.stringify({
          gym: form.get('gym'),
          remind: Number(form.get('remind')),
          emailOn: form.get('emailOn') === 'on'
        })
      },
      'Preferences saved.'
    )
  }
  const profile = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    act(
      '/profile',
      { method: 'PATCH', body: JSON.stringify(Object.fromEntries(form)) },
      'Profile saved.'
    )
  }
  const content = {
    Dashboard: (
      <>
        <section className="card clay illustrated-heading">
          <div>
            <h2>Gym overview</h2>
            <p>Memberships, payments, and ESP32-CAM check-ins.</p>
          </div>
          <FitnessSculpture />
        </section>
        <section className="grid admin-stats">
          {[
            ['Total Members', members.length, 'users', 'b1'],
            ['Active Memberships', active, 'card', 'b2'],
            [
              "Today's Check-ins",
              data.attendance.filter(
                (item) =>
                  new Date(item.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }) ===
                  today
              ).length,
              'qr',
              'b3'
            ],
            ['Payments recorded', money(revenue), 'wallet', 'b4']
          ].map(([label, value, icon, color]) => (
            <article className="stat clay" key={label}>
              <span className={`bub ${color}`}>
                <Icon name={icon} />
              </span>
              <div>
                <small>{label}</small>
                <b>{value}</b>
              </div>
            </article>
          ))}
        </section>
        <section className="grid g2">
          <article className="card clay">
            <div className="admin-card-heading">
              <h2>Membership overview</h2>
              <Icon name="card" />
            </div>
            <div className="admin-summary">
              <div>
                <span>Active memberships</span>
                <strong>{active}</strong>
              </div>
              <div>
                <span>Expired memberships</span>
                <strong>{expiredMembers.length}</strong>
              </div>
              <div>
                <span>Records needing review</span>
                <strong>{members.length - active - expiredMembers.length}</strong>
              </div>
              <div>
                <span>Renewals recorded</span>
                <strong>{renewals.length}</strong>
              </div>
            </div>
          </article>
          <article className="card clay">
            <div className="admin-card-heading">
              <h2>Membership reminders</h2>
              <span className="pill p-warn">{reminderList.length}</span>
            </div>
            {reminderList.length ? (
              <ul className="admin-list">
                {reminderList.slice(0, 4).map((member) => (
                  <li key={member.id}>
                    <div>
                      <strong>{member.name}</strong>
                      <small>
                        {membershipState(member).status === 'expired' ? 'Expired' : 'Expiring soon'}{' '}
                        &middot; {date(member.membershipEnd)}
                      </small>
                    </div>
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() => setModal({ kind: 'renew', member })}
                    >
                      Renew
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-empty">No memberships are due for a reminder.</p>
            )}
            <button
              className="admin-text-button"
              type="button"
              onClick={() => setSection('Notifications')}
            >
              View all reminders &rarr;
            </button>
          </article>
        </section>
      </>
    ),
    Members: (
      <article className="card clay">
        <h2>Member Records</h2>
        <div className="bar">
          <label className="sbox clay-in">
            Search{' '}
            <input
              value={query}
              placeholder="Name, member ID, email, or phone"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <button className="btn" onClick={() => setModal({ kind: 'create' })}>
            Create Account
          </button>
        </div>
        <DataTable headings={['Name', 'Member ID', 'Contact', 'Plan', 'Status', 'Actions']}>
          {members
            .filter((member) =>
              `${member.name} ${member.id} ${member.email} ${member.phone || ''}`
                .toLowerCase()
                .includes(query.trim().toLowerCase())
            )
            .map((member) => (
              <tr key={member.id}>
                <td>
                  <div className="member-table-person">
                    <ProfileAvatar user={member} memberId={member.id} />
                    <span>{member.name}</span>
                  </div>
                </td>
                <td className="record-id">{member.id}</td>
                <td>
                  <span>{member.email}</span>
                  <small className="table-secondary">{member.phone || 'No phone added'}</small>
                </td>
                <td>{member.plan}</td>
                <td>
                  <Pill status={membershipState(member).label} />
                </td>
                <td className="acts">
                  <button
                    className="btn sm ghost"
                    type="button"
                    onClick={() => setModal({ kind: 'view', member })}
                  >
                    View
                  </button>
                  <button className="btn sm" onClick={() => setModal({ kind: 'edit', member })}>
                    Edit
                  </button>
                  <button
                    className="btn sm ghost"
                    onClick={() => setModal({ kind: 'renew', member })}
                  >
                    Renew
                  </button>
                </td>
              </tr>
            ))}
        </DataTable>
      </article>
    ),
    Memberships: (
      <article className="card clay">
        <h2>Memberships</h2>
        <DataTable headings={['Member', 'Plan', 'Joined', 'Expires', 'Status', 'Action']}>
          {members.map((member) => (
            <tr key={member.id}>
              <td>
                <div className="member-table-person">
                  <ProfileAvatar user={member} memberId={member.id} />
                  <span>{member.name}</span>
                </div>
              </td>
              <td>{member.plan}</td>
              <td>{date(member.membershipStart || member.joined)}</td>
              <td>{date(member.membershipEnd)}</td>
              <td>
                <Pill status={member.status} />
              </td>
              <td>
                <button className="btn sm" onClick={() => setModal({ kind: 'renew', member })}>
                  Renew
                </button>
              </td>
            </tr>
          ))}
        </DataTable>
      </article>
    ),
    Equipment: (
      <>
        <article className="card clay">
          <div className="bar">
            <h2>Equipment Monitoring</h2>
            <button className="btn" onClick={() => setModal({ kind: 'equipment' })}>
              Add Equipment
            </button>
          </div>
          <DataTable headings={['Name', 'Category', 'Condition', 'Last inspection', 'Action']}>
            {data.equipment.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>
                  <select
                    className="clay-in"
                    value={item.condition}
                    onChange={(event) =>
                      act(
                        `/admin/equipment/${item.id}`,
                        {
                          method: 'PATCH',
                          body: JSON.stringify({ condition: event.target.value })
                        },
                        'Condition updated.'
                      )
                    }
                  >
                    <option>Good</option>
                    <option>Needs Maintenance</option>
                    <option>Out of Service</option>
                  </select>
                </td>
                <td>
                  {date(item.lastInspected)}
                  {inspectionDue(item) && <small className="table-secondary">Inspection due</small>}
                </td>
                <td>
                  <button
                    className="btn sm"
                    onClick={() =>
                      act(
                        `/admin/equipment/${item.id}`,
                        { method: 'PATCH', body: JSON.stringify({ inspected: true }) },
                        'Inspection logged.'
                      )
                    }
                  >
                    Inspected
                  </button>
                  <button
                    className="btn sm ghost"
                    type="button"
                    onClick={() => setModal({ kind: 'maintenance', item })}
                  >
                    Log repair
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        </article>
        <article className="card clay">
          <h2>Maintenance & Repair Log</h2>
          <DataTable headings={['Equipment', 'Note', 'Date']}>
            {data.maintenance.map((item) => (
              <tr key={item.id}>
                <td>{item.item}</td>
                <td>{item.note}</td>
                <td>{date(item.date)}</td>
              </tr>
            ))}
          </DataTable>
        </article>
      </>
    ),
    Attendance: (
      <article className="card clay">
        <div className="illustrated-heading">
          <div>
            <h2>Entrance check-ins</h2>
            <p>
              ESP32-CAM scans appear here automatically. Staff can also record verified entries.
            </p>
          </div>
          <FitnessSculpture variant="scanner" />
        </div>
        <form
          className="bar"
          onSubmit={(event) => {
            event.preventDefault()
            const id = new FormData(event.currentTarget).get('memberId')
            act(
              '/admin/attendance',
              { method: 'POST', body: JSON.stringify({ memberId: id }) },
              'Check-in recorded.'
            )
          }}
        >
          <select className="clay-in" name="memberId" required disabled={loading || pending}>
            {members
              .filter((member) => membershipState(member).status === 'active')
              .map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
          </select>
          <button
            className="btn"
            disabled={
              pending ||
              loading ||
              !members.some((member) => membershipState(member).status === 'active')
            }
          >
            {pending ? 'Recording...' : 'Record staff check-in'}
          </button>
        </form>
        <DataTable headings={['Member', 'Date & Time', 'Recorded by']}>
          {data.attendance.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="member-table-person">
                  <ProfileAvatar
                    user={members.find((member) => member.id === item.memberId)}
                    memberId={item.memberId}
                  />
                  <span>{item.memberName}</span>
                </div>
              </td>
              <td>{dateTime(item.date)}</td>
              <td>{item.source || 'Staff'}</td>
            </tr>
          ))}
        </DataTable>
      </article>
    ),
    Payments: (
      <article className="card clay">
        <div className="bar">
          <h2>Payment History</h2>
          <div className="payment-actions">
            <button
              className="btn ghost"
              type="button"
              disabled={!data.payments.length}
              onClick={() => downloadPayments(data.payments, { includeMember: true })}
            >
              Export CSV
            </button>
            <button className="btn" onClick={() => setModal({ kind: 'payment' })}>
              Record Payment
            </button>
          </div>
        </div>
        <DataTable headings={['Member', 'Plan', 'Payment', 'Amount', 'Method', 'Date']}>
          {data.payments.map((item) => (
            <tr key={item.id}>
              <td>{item.memberName}</td>
              <td>{item.plan || 'Not recorded'}</td>
              <td>{item.type || 'Membership'}</td>
              <td>{money(item.amount)}</td>
              <td>
                <Pill status={item.method} />
              </td>
              <td>{date(item.date)}</td>
            </tr>
          ))}
        </DataTable>
      </article>
    ),
    Notifications: (
      <section className="grid g2">
        <article className="card clay">
          <div className="admin-card-heading">
            <h2>Membership reminders</h2>
            <Icon name="bell" />
          </div>
          <p className="form-help">
            Expired memberships and those ending within {data.settings.remind} days.
          </p>
          {reminderList.length ? (
            <ul className="admin-list">
              {reminderList.map((member) => (
                <li key={member.id}>
                  <div>
                    <strong>{member.name}</strong>
                    <small>{member.email}</small>
                    <small>
                      {membershipState(member).label} &middot; expires {date(member.membershipEnd)}
                    </small>
                  </div>
                  <button
                    className="btn"
                    type="button"
                    disabled={pending || !data.settings.emailOn || !data.emailConfigured}
                    onClick={() =>
                      act(
                        `/admin/members/${member.id}/expiry-email`,
                        { method: 'POST' },
                        `Reminder email sent to ${member.name}.`
                      )
                    }
                  >
                    Send email
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-empty">No members are due for a reminder.</p>
          )}
          {!data.settings.emailOn && (
            <p className="form-help">Email reminders are disabled in Gym Preferences.</p>
          )}
          {!data.emailConfigured && (
            <p className="form-help">Email delivery is unavailable. Contact your administrator.</p>
          )}
        </article>
        <article className="card clay">
          <div className="admin-card-heading">
            <h2>Equipment inspection reminders</h2>
            <Icon name="dumbbell" />
          </div>
          <p className="form-help">Equipment is due 30 days after its last inspection.</p>
          {equipmentDue.length ? (
            <ul className="admin-list">
              {equipmentDue.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>Last inspected: {date(item.lastInspected)}</small>
                    <small>{item.condition}</small>
                  </div>
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => setSection('Equipment')}
                  >
                    Review
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-empty">No equipment is currently due for inspection.</p>
          )}
        </article>
      </section>
    ),
    Reports: <AdminReports data={data} />,
    Settings: (
      <section className="grid g2">
        <article className="card clay">
          <h2>Profile</h2>
          <ProfilePhoto user={currentUser} onSaved={setCurrentUser} />
          <form onSubmit={profile} className="mf">
            <label className="field">
              Full name
              <input
                className="clay-in"
                name="name"
                defaultValue={currentUser?.name}
                autoComplete="name"
                required
              />
            </label>
            <label className="field">
              Email
              <input
                className="clay-in"
                name="email"
                defaultValue={currentUser?.email}
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <button className="btn" disabled={pending || loading}>
              {pending ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </article>
        <article className="card clay">
          <h2>Change Password</h2>
          <PasswordChangeForm />
        </article>
        <article className="card clay">
          <h2>Gym Preferences</h2>
          <form onSubmit={settings} className="mf">
            <label className="field">
              Gym name
              <input className="clay-in" name="gym" defaultValue={data.settings.gym} />
            </label>
            <label className="field">
              Expiry reminder
              <select className="clay-in" name="remind" defaultValue={data.settings.remind}>
                <option value="3">3 days</option>
                <option value="5">5 days</option>
                <option value="7">7 days</option>
              </select>
            </label>
            <label className="set">
              Send email reminders
              <input name="emailOn" type="checkbox" defaultChecked={data.settings.emailOn} />
            </label>
            <button className="btn" disabled={pending || loading}>
              {pending ? 'Saving...' : 'Save preferences'}
            </button>
          </form>
        </article>
      </section>
    )
  }[section]
  return (
    <DashboardShell
      className="admin-app"
      role={currentUser?.role || 'admin'}
      user={currentUser}
      onSignOut={onSignOut}
      activeSection={section}
      onSectionChange={setSection}
    >
      {loading && (
        <p className="dashboard-feedback" role="status">
          Loading gym records...
        </p>
      )}
      {error && (
        <p className="dashboard-feedback is-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <div className="dashboard-feedback" role="status">
          {notice}
          <button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}>
            &times;
          </button>
        </div>
      )}
      {content}
      {modal?.kind === 'view' && (
        <Modal busy={pending} error={error} title="Member record" onClose={() => setModal(null)}>
          <ProfileAvatar user={modal.member} memberId={modal.member.id} large />
          <dl className="member-record">
            {[
              ['Name', modal.member.name],
              ['Member ID', modal.member.id],
              ['Email', modal.member.email],
              ['Contact', modal.member.phone || 'Not added'],
              ['Plan', modal.member.plan],
              ['Status', membershipState(modal.member).label],
              ['Starts', date(modal.member.membershipStart || modal.member.joined)],
              ['Expires', date(modal.member.membershipEnd)]
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <h3>Renewal history</h3>
          <DataTable
            headings={['Plan', 'Amount', 'Method', 'Date']}
            caption="Member renewal history"
          >
            {renewals
              .filter((payment) => payment.memberId === modal.member.id)
              .map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.plan}</td>
                  <td>{money(payment.amount)}</td>
                  <td>{payment.method}</td>
                  <td>{date(payment.date)}</td>
                </tr>
              ))}
          </DataTable>
        </Modal>
      )}
      {modal?.kind === 'maintenance' && (
        <Modal
          busy={pending}
          error={error}
          title="Log maintenance or repair"
          onClose={() => setModal(null)}
        >
          <form
            className="mf"
            onSubmit={(event) => {
              event.preventDefault()
              const values = Object.fromEntries(new FormData(event.currentTarget))
              act(
                `/admin/equipment/${modal.item.id}`,
                { method: 'PATCH', body: JSON.stringify(values) },
                'Maintenance recorded.'
              )
            }}
          >
            <p className="form-help">{modal.item.name}</p>
            <label className="field">
              Work completed
              <textarea
                className="clay-in"
                name="maintenanceNote"
                rows="4"
                maxLength="500"
                placeholder="Describe the inspection, maintenance, or repair."
                required
              />
            </label>
            <label className="field">
              Condition after work
              <select className="clay-in" name="condition" defaultValue={modal.item.condition}>
                <option>Good</option>
                <option>Needs Maintenance</option>
                <option>Out of Service</option>
              </select>
            </label>
            <div className="ma">
              <button className="btn" type="submit">
                Save maintenance
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal?.kind === 'create' && (
        <Modal
          busy={pending}
          error={error}
          title="Create Member Account"
          onClose={() => setModal(null)}
        >
          <form onSubmit={createMember} className="mf">
            <label className="field">
              Full name
              <input className="clay-in" name="name" required />
            </label>
            <label className="field">
              Contact number
              <input className="clay-in" name="phone" />
            </label>
            <label className="field">
              Email
              <input className="clay-in" name="email" type="email" required />
            </label>
            <label className="field">
              Temporary password
              <input
                className="clay-in"
                name="password"
                type="password"
                minLength="8"
                maxLength="72"
                autoComplete="new-password"
                required
              />
            </label>
            <label className="field">
              Plan
              <select className="clay-in" name="plan">
                {plans.map((plan) => (
                  <option key={plan}>{plan}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Payment
              <select className="clay-in" name="method">
                <option>Cash</option>
                <option>GCash</option>
              </select>
            </label>
            <label className="set">
              Payment already received
              <input type="checkbox" name="recordPayment" />
            </label>
            <p className="form-help">
              Check this only after receiving the plan payment through Cash or GCash.
            </p>
            <div className="ma">
              <button className="btn ghost" type="button" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="btn">Create</button>
            </div>
          </form>
        </Modal>
      )}
      {modal?.kind === 'edit' && (
        <Modal busy={pending} error={error} title="Edit Member" onClose={() => setModal(null)}>
          <form onSubmit={updateMember} className="mf">
            <label className="field">
              Full name
              <input className="clay-in" name="name" defaultValue={modal.member.name} required />
            </label>
            <label className="field">
              Contact
              <input className="clay-in" name="phone" defaultValue={modal.member.phone} />
            </label>
            <label className="field">
              Email
              <input
                className="clay-in"
                name="email"
                type="email"
                defaultValue={modal.member.email}
                required
              />
            </label>
            <label className="field">
              Plan
              <select className="clay-in" name="plan" defaultValue={modal.member.plan}>
                {plans.map((plan) => (
                  <option key={plan}>{plan}</option>
                ))}
              </select>
            </label>
            <div className="ma">
              <button className="btn">Save changes</button>
            </div>
          </form>
        </Modal>
      )}
      {modal?.kind === 'renew' && (
        <Modal busy={pending} error={error} title="Renew Membership" onClose={() => setModal(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const form = new FormData(event.currentTarget)
              act(
                `/admin/members/${modal.member.id}/renew`,
                { method: 'POST', body: JSON.stringify(Object.fromEntries(form)) },
                'Membership renewed.'
              )
            }}
            className="mf"
          >
            <p>
              {modal.member.name} · {modal.member.plan}
            </p>
            <label className="field">
              Plan
              <select className="clay-in" name="plan" defaultValue={modal.member.plan}>
                {plans.map((plan) => (
                  <option key={plan}>{plan}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Payment method
              <select className="clay-in" name="method">
                <option>Cash</option>
                <option>GCash</option>
              </select>
            </label>
            <div className="ma">
              <button className="btn">Renew</button>
            </div>
          </form>
        </Modal>
      )}
      {modal?.kind === 'payment' && (
        <Modal busy={pending} error={error} title="Record Payment" onClose={() => setModal(null)}>
          <form onSubmit={recordPayment} className="mf">
            <p className="form-help">Record a Cash or GCash payment already received at the gym.</p>
            <label className="field">
              Member
              <select className="clay-in" name="memberId">
                {members.map((member) => (
                  <option value={member.id} key={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Amount
              <input
                className="clay-in"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
              />
            </label>
            <label className="field">
              Method
              <select className="clay-in" name="method">
                <option>Cash</option>
                <option>GCash</option>
              </select>
            </label>
            <div className="ma">
              <button className="btn">Save payment</button>
            </div>
          </form>
        </Modal>
      )}
      {modal?.kind === 'equipment' && (
        <Modal busy={pending} error={error} title="Add Equipment" onClose={() => setModal(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              act(
                '/admin/equipment',
                {
                  method: 'POST',
                  body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))
                },
                'Equipment added.'
              )
            }}
            className="mf"
          >
            <label className="field">
              Equipment name
              <input className="clay-in" name="name" required />
            </label>
            <label className="field">
              Category
              <input className="clay-in" name="category" required />
            </label>
            <div className="ma">
              <button className="btn">Add</button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardShell>
  )
}
