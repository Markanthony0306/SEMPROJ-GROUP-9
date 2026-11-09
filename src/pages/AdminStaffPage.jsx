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
import ActivityChart from '../components/ActivityChart'
import { RecordDeleteButton } from '../components/RecordDeleteControls'
import EquipmentCategorySelect from '../components/EquipmentCategorySelect'
import AdminNotifications from '../components/AdminNotifications'
import WebcamQrScanner from '../components/WebcamQrScanner'
import { membershipState, reminderMembers, inspectionDue } from '../utils/membership'
import AdminStaffDialogs, { Pill, memberBadge } from '../components/admin/AdminStaffDialogs'
import './AdminStaffPage.css'

const money = (value) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0))
const planOptionLabel = (plan) => {
  const studentRate = /student/i.test(plan.plan_name) && !/non[-\s]?student/i.test(plan.plan_name)
  return `${plan.plan_name} - ${money(plan.price)}${studentRate ? ' (student discount)' : ''}`
}
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
export default function AdminStaffPage({ user, onSignOut }) {
  const { token } = useAuth()
  const [currentUser, setCurrentUser] = useState(user)
  const [section, setSection] = useState('Dashboard')
  const [data, setData] = useState({
    members: [],
    membershipPlans: [],
    attendance: [],
    payments: [],
    equipment: [],
    maintenance: [],
    notificationState: { notifications: [], canDismiss: false },
    settings: { gym: 'FitPulse Gym', remind: 7 }
  })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [modal, setModal] = useState(null)
  const [deletion, setDeletion] = useState(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const actionLock = useRef(false)
  const canDeleteHistory = currentUser?.role === 'admin'
  const load = useCallback(
    async (signal) => {
      try {
        const [
          members,
          membershipPlans,
          attendance,
          payments,
          equipment,
          settings,
          profile,
          notifications
        ] = await Promise.all([
          apiRequest('/members', { token, signal }),
          apiRequest('/admin/membership-plans', { token, signal }),
          apiRequest('/attendance', { token, signal }),
          apiRequest('/payments', { token, signal }),
          apiRequest('/admin/equipment', { token, signal }),
          apiRequest('/admin/settings', { token, signal }),
          apiRequest('/me', { token, signal }),
          apiRequest('/admin/notifications', { token, signal }).catch((cause) => ({
            notifications: [],
            canDismiss: false,
            issue: cause.message
          }))
        ])
        if (signal?.aborted) return
        setCurrentUser(profile.user)
        setData({
          ...members,
          ...membershipPlans,
          ...attendance,
          ...payments,
          ...equipment,
          ...settings,
          notificationState: notifications
        })
        setError('')
        return true
      } catch (cause) {
        if (!signal?.aborted) setError(cause.message)
        return false
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
  useEffect(() => {
    if (section !== 'Notifications') return
    const controller = new AbortController()
    const refresh = async () => {
      try {
        const notificationState = await apiRequest('/admin/notifications', {
          token,
          signal: controller.signal
        })
        if (!controller.signal.aborted) setData((previous) => ({ ...previous, notificationState }))
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause.message)
      }
    }
    void refresh()
    const timer = window.setInterval(refresh, 15000)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [section, token])
  const act = async (path, options, message, onSuccess) => {
    if (actionLock.current) return false
    actionLock.current = true
    setPending(true)
    setError('')
    setNotice('')
    try {
      const result = await apiRequest(path, { token, ...options })
      setNotice(result.message || message)
      setModal(null)
      await load()
      onSuccess?.(result)
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
  const renewals = data.payments.filter((payment) => payment.type === 'Renewal')
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
  const revenue = data.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const scanQr = useCallback(async (qrToken) => {
    setError('')
    setNotice('')
    try {
      const result = await apiRequest('/admin/attendance/scan', {
        token,
        method: 'POST',
        body: JSON.stringify({ qrToken, requestId: crypto.randomUUID() })
      })
      setNotice(`Check-in recorded for ${result.memberName}.`)
      await load()
    } catch (cause) {
      setError(cause.message)
    }
  }, [token, load])
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
      'Member account created.',
      (result) => {
        if (result.member) setModal({ kind: 'credentials', member: result.member, temporaryPassword: result.temporaryPassword })
      }
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
  const faceEnrollmentPath = `/admin/members/${modal?.member?.id}/face-enrollment`
  const requestFaceChallenge = () =>
    apiRequest(faceEnrollmentPath + '/challenge', { token, method: 'POST' })
  const enrollFace = (details) =>
    act(
      faceEnrollmentPath,
      { method: 'POST', body: JSON.stringify(details) },
      'Face verification is ready.'
    )
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
          remind: Number(form.get('remind'))
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
        <section className="card clay illustrated-heading dashboard-overview">
          <div>
            <span className="dashboard-eyebrow">YOUR GYM, AT A GLANCE</span>
            <h2>Let’s keep the momentum going.</h2>
            <p>
              Welcome back, {currentUser?.name?.split(' ')[0] || 'coach'}. Here’s how your community
              is moving.
            </p>
            <div className="dashboard-quick-actions">
              {currentUser?.role === 'admin' && (
                <button className="btn" type="button" onClick={() => setModal({ kind: 'create' })}>
                  <Icon name="users" size={16} />
                  Add a member
                </button>
              )}
              <button className="btn ghost" type="button" onClick={() => setSection('Reports')}>
                <Icon name="chart" size={16} />
                Explore reports
              </button>
            </div>
          </div>
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
        <ActivityChart
          attendance={data.attendance}
          payments={data.payments}
          admin
          loading={loading}
        />
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
          {currentUser?.role === 'admin' && (
            <button className="btn" onClick={() => setModal({ kind: 'create' })}>
              Create Account
            </button>
          )}
        </div>
        <DataTable
          searchable={false}
          headings={['ID', 'Name', 'Contact', 'Plan', 'Expires', 'Status', 'Actions']}
        >
          {members
            .filter((member) =>
              `${member.name} ${member.memberCode || ''} ${member.id} ${member.email} ${member.phone || ''}`
                .toLowerCase()
                .includes(query.trim().toLowerCase())
            )
            .map((member) => (
              <tr key={member.id}>
                <td className="record-id">{member.memberCode || member.id}</td>
                <td>
                  <div className="member-table-person">
                    <ProfileAvatar user={member} memberId={member.id} />
                    <span>{member.name}</span>
                  </div>
                </td>
                <td>
                  <span>{member.email}</span>
                  <small className="table-secondary">{member.phone || 'No phone added'}</small>
                </td>
                <td>{member.plan}</td>
                <td>{date(member.membershipEnd)}</td>
                <td>
                  <Pill status={memberBadge(member)} />
                </td>
                <td className="acts member-record-actions">
                  <button
                    className="report-icon-button"
                    type="button"
                    aria-label={`View ${member.name}`}
                    onClick={() => setModal({ kind: 'view', member })}
                  >
                    <Icon name="eye" size={18} />
                  </button>
                  <button
                    className="report-icon-button"
                    type="button"
                    aria-label={`Edit ${member.name}`}
                    onClick={() => setModal({ kind: 'edit', member })}
                  >
                    <Icon name="edit" size={18} />
                  </button>
                  {currentUser?.role === 'admin' && (
                    <RecordDeleteButton
                      label={`Delete account for ${member.name}`}
                      disabled={pending}
                      onClick={() => setModal({ kind: 'delete-account', member })}
                    />
                  )}
                </td>
              </tr>
            ))}
        </DataTable>
      </article>
    ),
    Equipment: (
      <>
        <article className="card clay">
          <div className="record-section-heading">
            <h2>Equipment Monitoring</h2>
            <button className="btn" onClick={() => setModal({ kind: 'equipment' })}>
              Add Equipment
            </button>
          </div>
          <DataTable headings={['Name', 'Category', 'Condition', 'Last inspection', 'Actions']}>
            {data.equipment.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>
                  <EquipmentCategorySelect
                    value={item.category || ''}
                    aria-label={`Category for ${item.name}`}
                    disabled={loading || pending}
                    onChange={(event) =>
                      act(
                        `/admin/equipment/${item.id}`,
                        {
                          method: 'PATCH',
                          body: JSON.stringify({ category: event.target.value })
                        },
                        'Category updated.'
                      )
                    }
                  />
                </td>
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
                <td className="acts">
                  <button
                    className="btn sm"
                    type="button"
                    disabled={loading || pending}
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
                    disabled={loading || pending}
                    onClick={() => setModal({ kind: 'maintenance', item })}
                  >
                    Log repair
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        </article>
        <article className="card clay maintenance-log">
          <div className="record-section-heading">
            <h2>Maintenance & Repair Log</h2>
            {canDeleteHistory && (
              <RecordDeleteButton
                all
                label="Clear all maintenance records"
                disabled={loading || pending || !data.maintenance.length}
                onClick={() =>
                  setDeletion({
                    all: true,
                    category: 'maintenance',
                    count: data.maintenance.length
                  })
                }
              />
            )}
          </div>
          <DataTable
            headings={['Equipment', 'Note', 'Date', ...(canDeleteHistory ? ['Actions'] : [])]}
          >
            {data.maintenance.map((item) => (
              <tr key={item.id}>
                <td>{item.item}</td>
                <td>{item.note}</td>
                <td>{date(item.date)}</td>
                {canDeleteHistory && (
                  <td className="acts">
                    <RecordDeleteButton
                      label={`Delete maintenance record for ${item.item}`}
                      disabled={loading || pending}
                      onClick={() =>
                        setDeletion({ category: 'maintenance', id: item.id, label: item.item })
                      }
                    />
                  </td>
                )}
              </tr>
            ))}
          </DataTable>
        </article>
      </>
    ),
    Attendance: (
      <article className="card clay">
        <div className="record-section-heading">
          <div>
            <h2>Entrance check-ins</h2>
            <p>ESP32-CAM scans appear here automatically when members scan their QR passes.</p>
          </div>
          {canDeleteHistory && (
            <RecordDeleteButton
              all
              label="Clear all attendance records"
              disabled={loading || pending || !data.attendance.length}
              onClick={() =>
                setDeletion({ all: true, category: 'attendance', count: data.attendance.length })
              }
            />
          )}
        </div>
        {section === 'Attendance' && <WebcamQrScanner onScan={scanQr} />}
        <DataTable
          headings={[
            'Member',
            'Date & Time',
            'Recorded by',
            ...(canDeleteHistory ? ['Actions'] : [])
          ]}
        >
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
              {canDeleteHistory && (
                <td className="acts">
                  <RecordDeleteButton
                    label={`Delete attendance record for ${item.memberName}`}
                    disabled={loading || pending}
                    onClick={() =>
                      setDeletion({ category: 'attendance', id: item.id, label: item.memberName })
                    }
                  />
                </td>
              )}
            </tr>
          ))}
        </DataTable>
      </article>
    ),
    Payments: (
      <article className="card clay">
        <div className="record-section-heading">
          <h2>Payment History</h2>
          <div className="record-section-actions">
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
            {canDeleteHistory && (
              <RecordDeleteButton
                all
                label="Clear all payment records"
                disabled={loading || pending || !data.payments.length}
                onClick={() =>
                  setDeletion({ all: true, category: 'payments', count: data.payments.length })
                }
              />
            )}
          </div>
        </div>
        <DataTable
          headings={[
            'Member',
            'Plan',
            'Payment',
            'Amount',
            'Method',
            'Date',
            ...(canDeleteHistory ? ['Actions'] : [])
          ]}
        >
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
              {canDeleteHistory && (
                <td className="acts">
                  <RecordDeleteButton
                    label={`Delete payment record for ${item.memberName}`}
                    disabled={loading || pending}
                    onClick={() =>
                      setDeletion({ category: 'payments', id: item.id, label: item.memberName })
                    }
                  />
                </td>
              )}
            </tr>
          ))}
        </DataTable>
      </article>
    ),
    Notifications: (
      <AdminNotifications
        state={data.notificationState}
        canManage={canDeleteHistory}
        busy={pending || loading}
        onDelete={setDeletion}
        onReview={() => setSection('Equipment')}
      />
    ),
    Reports: (
      <AdminReports
        data={data}
        onChanged={load}
        onMemberAction={(kind, member) => setModal({ kind, member })}
      />
    ),
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
          <h2>Face verification</h2>
          <button
            type="button"
            className="btn ghost"
            disabled={!currentUser?.id}
            onClick={() => setModal({ kind: 'face', member: currentUser })}
          >
            Set up face sign-in
          </button>
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
      notificationCount={loading ? 0 : data.notificationState.notifications.length}
      loading={loading}
    >
      {loading && (
        <p className="dashboard-feedback" role="status">
          Loading gym records...
        </p>
      )}
      {error && (
        <p className="dashboard-feedback is-error" role="alert">
          {error}
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              load()
            }}
          >
            Retry
          </button>
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
      <AdminStaffDialogs
        modal={modal}
        setModal={setModal}
        currentUser={currentUser}
        pending={pending}
        error={error}
        deletion={deletion}
        setDeletion={setDeletion}
        load={load}
        setNotice={setNotice}
        renewals={renewals}
        money={money}
        date={date}
        members={members}
        data={data}
        planOptionLabel={planOptionLabel}
        act={act}
        createMember={createMember}
        updateMember={updateMember}
        enrollFace={enrollFace}
        requestFaceChallenge={requestFaceChallenge}
        recordPayment={recordPayment}
      />
    </DashboardShell>
  )
}
