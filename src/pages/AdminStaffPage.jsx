import AdminDashboardSection from '../components/admin/AdminDashboardSection'
import AdminMembersSection from '../components/admin/AdminMembersSection'
import AdminEquipmentSection from '../components/admin/AdminEquipmentSection'
import AdminAttendanceSection from '../components/admin/AdminAttendanceSection'
import AdminPaymentsSection from '../components/admin/AdminPaymentsSection'
import AdminSettingsSection from '../components/admin/AdminSettingsSection'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DashboardShell from '../components/DashboardShell'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'
import FitnessSculpture from '../components/FitnessSculpture'
import AdminReports from '../components/AdminReports'
import AdminNotifications from '../components/AdminNotifications'
import { membershipState, reminderMembers } from '../utils/membership'
import AdminStaffDialogs from '../components/admin/AdminStaffDialogs'
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

      if (result.signInRequired) {
        onSignOut()
        return true
      }

      // Immediately display the updated profile.
      if (path === '/profile' && result?.user) {
        setCurrentUser(result.user)
      }

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
    () => data.members.filter((member) => ['user', 'member'].includes(member.role)),
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
        body: JSON.stringify({
          qrToken,
          requestId: crypto.randomUUID()
        })
      })

      if (result?.allowed !== true) {
        throw new Error(
          result?.message || 'Attendance was not confirmed.'
        )
      }

      const message =
        result.code === 'ALREADY_RECORDED'
          ? 'This check-in was already recorded.'
          : `Check-in recorded for ${result.memberName}.`

      setNotice(message)

      // Refresh attendance records after a successful scan.
      await load()

      // IMPORTANT: Return the backend result to PhysicalQrScanner.
      return result

    } catch (cause) {
      const message =
        cause?.message || 'Unable to process attendance.'

      setError(message)

      // Let PhysicalQrScanner display the failure.
      return {
        allowed: false,
        message
      }
    }
  }, [token, load])

  const createMember = (eventOrDetails) => {
    const isFormEvent = typeof eventOrDetails?.preventDefault === 'function'
    if (isFormEvent) eventOrDetails.preventDefault()
    const details = isFormEvent
      ? (() => { const form = new FormData(eventOrDetails.currentTarget); return {
          ...Object.fromEntries(form), recordPayment: form.get('recordPayment') === 'on'
        } })()
      : eventOrDetails
    return act(
      '/admin/members',
      {
        method: 'POST',
        body: JSON.stringify(details)
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
      <AdminDashboardSection
        currentUser={currentUser}
        setModal={setModal}
        setSection={setSection}
        members={members}
        active={active}
        data={data}
        today={today}
        money={money}
        revenue={revenue}
        loading={loading}
        expiredMembers={expiredMembers}
        renewals={renewals}
        reminderList={reminderList}
        date={date}
      />
    ),
    Members: (
      <AdminMembersSection
        query={query}
        setQuery={setQuery}
        currentUser={currentUser}
        setModal={setModal}
        members={members}
        pending={pending}
        date={date}
      />
    ),
    Equipment: (
      <AdminEquipmentSection
        data={data}
        loading={loading}
        pending={pending}
        act={act}
        setModal={setModal}
        canDeleteHistory={canDeleteHistory}
        setDeletion={setDeletion}
        date={date}
      />
    ),
    Attendance: (
      <AdminAttendanceSection
        data={data}
        members={members}
        loading={loading}
        pending={pending}
        canDeleteHistory={canDeleteHistory}
        setDeletion={setDeletion}
        scanQr={scanQr}
        section={section}
        dateTime={dateTime}
      />
    ),
    Payments: (
      <AdminPaymentsSection
        data={data}
        loading={loading}
        pending={pending}
        canDeleteHistory={canDeleteHistory}
        setModal={setModal}
        setDeletion={setDeletion}
        money={money}
        date={date}
      />
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
      <AdminSettingsSection
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        profile={profile}
        pending={pending}
        loading={loading}
        setModal={setModal}
        settings={settings}
        data={data}
      />
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
