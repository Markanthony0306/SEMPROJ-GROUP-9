import { useEffect, useState } from 'react'
import DashboardShell from '../components/DashboardShell'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'
import {
  formatDate,
  formatDateTime,
  heightsFor,
  monthIndexOf,
  trailingBuckets
} from '../utils/metrics'

function MemberWorkspace({ section, user, attendance }) {
  const content = {
    'My Membership': [
      'My membership',
      [
        `Plan: ${user?.plan || 'Unlimited Monthly'}`,
        `Status: ${user?.status === 'active' ? 'Active' : user?.status || 'Active'}`,
        user?.joined ? `Member since: ${formatDate(user.joined)}` : 'Member since: Not available'
      ]
    ],
    'My Attendance': [
      'My attendance',
      attendance.length
        ? attendance.map((item) => formatDateTime(item.date))
        : ['No attendance records are available yet.']
    ],
    'My Profile': [
      'My profile',
      [
        `Name: ${user?.name || 'FitPulse Member'}`,
        `Email: ${user?.email || 'Not available'}`,
        `Member ID: ${user?.id || 'Not available'}`
      ]
    ]
  }[section]
  if (!content) return null
  return (
    <section className="dashboard-card workspace-card">
      <p className="eyebrow">Member portal</p>
      <h2>{content[0]}</h2>
      {content[1].map((item) => (
        <p className="workspace-row" key={item}>
          {item}
        </p>
      ))}
    </section>
  )
}

export default function UserPage({ user, onSignOut }) {
  const { token } = useAuth()
  const [section, setSection] = useState('Dashboard')
  const [showPass, setShowPass] = useState(false)
  const [attendance, setAttendance] = useState([])
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    apiRequest('/attendance', { token })
      .then((result) => {
        if (!cancelled) setAttendance(result.attendance || [])
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message || 'Could not load your attendance.')
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const today = new Date()
  const visitsThisMonth = attendance.filter(
    (item) => monthIndexOf(new Date(item.date)) === monthIndexOf(today)
  ).length
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const daysRemaining = Math.max(0, lastDay.getDate() - today.getDate())
  const stats = [
    [
      'Membership status',
      user?.status === 'active' ? 'Active' : user?.status || 'Active',
      user?.plan || 'Unlimited Monthly'
    ],
    [
      'Days remaining',
      String(daysRemaining),
      `Renewal due ${lastDay.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`
    ],
    [
      'Visits this month',
      String(visitsThisMonth),
      visitsThisMonth > 0 ? `+${visitsThisMonth} this month` : 'No check-ins yet'
    ]
  ]
  const chartHeights = heightsFor(trailingBuckets(attendance, 8, 'week'))

  return (
    <DashboardShell
      role="member"
      user={user}
      onSignOut={onSignOut}
      activeSection={section}
      onSectionChange={setSection}
    >
      {loadError && (
        <p className="load-error" role="alert">
          {loadError}
        </p>
      )}
      {section !== 'Dashboard' ? (
        <MemberWorkspace section={section} user={user} attendance={attendance} />
      ) : (
        <>
          <section className="dashboard-heading">
            <div>
              <p className="eyebrow">Your fitness dashboard</p>
              <h1>Keep your pulse moving.</h1>
              <p>Every check-in is progress. You are doing great.</p>
            </div>
          </section>
          <section className="stat-grid member-stats">
            {stats.map(([label, value, detail], index) => (
              <article className="stat-card" key={label}>
                <p>{label}</p>
                <strong>{value}</strong>
                <small className={index === 2 ? 'trend' : ''}>{detail}</small>
              </article>
            ))}
          </section>
          <section className="dashboard-grid member-dashboard">
            <article className="dashboard-card chart-card">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">Your progress</p>
                  <h2>Attendance over time</h2>
                </div>
              </div>
              <p className="chart-description">Last 8 weeks</p>
              <div className="bar-chart">
                {chartHeights.map((height, index) => (
                  <div key={index}>
                    <i style={{ height: `${height}%` }} />
                    <span>W{index + 1}</span>
                  </div>
                ))}
              </div>
            </article>
            <article className="dashboard-card next-card">
              <p className="eyebrow">Membership</p>
              <h2>Ready for your next session?</h2>
              <p>Your digital check-in pass is available at the front desk.</p>
              <button className="button" onClick={() => setShowPass(true)}>
                View check-in code
              </button>
            </article>
          </section>
          {showPass && (
            <div
              className="modal-backdrop"
              role="dialog"
              aria-modal="true"
              aria-label="Member check-in code"
            >
              <section className="checkin-modal">
                <button
                  className="modal-close"
                  onClick={() => setShowPass(false)}
                  aria-label="Close check-in code"
                >
                  Close
                </button>
                <p className="eyebrow">FitPulse check-in</p>
                <h2>{user?.name || 'Member'}</h2>
                <div className="member-code">{user?.id || 'FP-MEMBER'}</div>
                <p>Show this member ID at the front desk to check in.</p>
              </section>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  )
}
