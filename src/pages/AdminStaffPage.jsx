import { useEffect, useState } from 'react'
import DashboardShell from '../components/DashboardShell'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'
import {
  formatCurrency,
  formatDateTime,
  heightsFor,
  monthIndexOf,
  monthLabels,
  quarterLabels,
  totalBuckets,
  trailingBuckets,
  trailingQuarterBuckets
} from '../utils/metrics'

const ROLE_LABELS = { admin: 'Administrator', staff: 'Staff / Coach', user: 'Member' }

function AdminWorkspace({ section, user, members, attendance, payments }) {
  if (section === 'Dashboard') return null
  const staff = members.filter((account) => ['admin', 'staff'].includes(account.role))
  const roster = members.filter((account) => !['admin', 'staff'].includes(account.role))
  const planned = roster.reduce((counts, member) => {
    const plan = member.plan || 'Unlimited Monthly'
    counts[plan] = (counts[plan] || 0) + 1
    return counts
  }, {})
  const content = {
    Members: [
      'Members directory',
      roster.length
        ? roster.map((member) => `${member.name} - ${member.plan || 'No plan'}`)
        : ['No members yet. Create one from the dashboard.']
    ],
    'Staff / Coaches': [
      'Staff and coaches',
      staff.length
        ? staff.map((member) => `${member.name} - ${ROLE_LABELS[member.role] || member.role}`)
        : ['No staff accounts yet.']
    ],
    Memberships: [
      'Membership overview',
      [
        `${roster.length} member accounts`,
        `${roster.filter((member) => (member.status || 'active') === 'active').length} active memberships`,
        ...Object.entries(planned).map(([plan, count]) => `${count} × ${plan}`)
      ]
    ],
    Attendance: [
      'Attendance log',
      attendance.length
        ? attendance.map(
            (item) => `${item.memberName || item.memberId} - ${formatDateTime(item.date)}`
          )
        : ['No attendance records yet.']
    ],
    Payments: [
      'Payment records',
      payments.length
        ? payments.map(
            (item) =>
              `${item.memberName || item.memberId} - ${formatCurrency(item.amount)} - ${item.method}`
          )
        : ['No payment records yet.']
    ],
    'Profile / Account': [
      'Staff profile',
      [
        `${user?.name || 'FitPulse Staff'} - ${ROLE_LABELS[user?.role || 'admin'] || 'Administrator'}`,
        user?.email || 'admin@fitpulse.com'
      ]
    ]
  }[section]
  if (!content) return null
  return (
    <section className="dashboard-card workspace-card">
      <p className="eyebrow">FitPulse management</p>
      <h2>{content[0]}</h2>
      {content[1].map((item) => (
        <p className="workspace-row" key={item}>
          {item}
        </p>
      ))}
    </section>
  )
}

export default function AdminStaffPage({ user, onSignOut, navigate }) {
  const { token } = useAuth()
  const [section, setSection] = useState('Dashboard')
  const [period, setPeriod] = useState('Monthly')
  const [showAll, setShowAll] = useState(false)
  const [members, setMembers] = useState([])
  const [attendance, setAttendance] = useState([])
  const [payments, setPayments] = useState([])
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    Promise.all([
      apiRequest('/members', { token }),
      apiRequest('/attendance', { token }),
      apiRequest('/payments', { token })
    ])
      .then(([membersResult, attendanceResult, paymentsResult]) => {
        if (cancelled) return
        setMembers(membersResult.members || [])
        setAttendance(attendanceResult.attendance || [])
        setPayments(paymentsResult.payments || [])
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message || 'Could not load dashboard data.')
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const activeMemberships = members.filter(
    (member) => (member.status || 'active') === 'active'
  ).length
  const todayKey = new Date().toDateString()
  const todayCheckins = attendance.filter(
    (item) => new Date(item.date).toDateString() === todayKey
  ).length
  const thisMonthRevenue = payments
    .filter((item) => monthIndexOf(new Date(item.date)) === monthIndexOf(new Date()))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const stats = [
    ['Total Members', String(members.length), 'registered accounts'],
    ['Active Memberships', String(activeMemberships), 'active members'],
    ["Today's Check-ins", String(todayCheckins), 'checked in today'],
    ['Monthly Revenue', formatCurrency(thisMonthRevenue), 'this month']
  ]
  const joinedRecords = members
    .map((member) => ({ date: member.joined }))
    .filter((record) => record.date)
  const activeJoinedRecords = members
    .filter((member) => (member.status || 'active') === 'active')
    .map((member) => ({ date: member.joined }))
    .filter((record) => record.date)
  const statSpark = [
    heightsFor(trailingBuckets(joinedRecords, 6, 'week')),
    heightsFor(trailingBuckets(activeJoinedRecords, 6, 'week')),
    heightsFor(trailingBuckets(attendance, 6, 'day')),
    heightsFor(totalBuckets(payments, 6))
  ]

  const visitCounts = new Map()
  for (const item of attendance) {
    const name = item.memberName || item.memberId || 'Unknown'
    visitCounts.set(name, (visitCounts.get(name) || 0) + 1)
  }
  const leaderboard = [...visitCounts.entries()]
    .map(([name, visits]) => ({ name, visits }))
    .sort((a, b) => b.visits - a.visits)
  const visibleLeaderboard = showAll ? leaderboard : leaderboard.slice(0, 5)

  const growthSeries =
    period === 'Monthly'
      ? trailingBuckets(joinedRecords, 6, 'month')
      : trailingQuarterBuckets(joinedRecords, 4)
  const growthHeights = heightsFor(growthSeries)
  const growthLabels = period === 'Monthly' ? monthLabels(6) : quarterLabels(4)

  return (
    <DashboardShell
      role="admin"
      user={user}
      onSignOut={onSignOut}
      navigate={navigate}
      activeSection={section}
      onSectionChange={setSection}
    >
      {loadError && ready && (
        <p className="load-error" role="alert">
          {loadError}
        </p>
      )}
      {section !== 'Dashboard' ? (
        <AdminWorkspace
          section={section}
          user={user}
          members={members}
          attendance={attendance}
          payments={payments}
        />
      ) : (
        <>
          <section className="dashboard-heading">
            <div>
              <p className="eyebrow">Operations overview</p>
              <h1>Good morning, {user?.name?.split(' ')[0] || 'Coach'}.</h1>
              <p>Here is how FitPulse is moving today.</p>
            </div>
            <button className="button" onClick={() => navigate('register')}>
              Create account
            </button>
          </section>
          <section className="stat-grid">
            {stats.map(([label, value, detail], index) => (
              <article className="stat-card" key={label}>
                <p>{label}</p>
                <strong>{value}</strong>
                <small className="trend">{detail}</small>
                <div className="mini-chart">
                  {statSpark[index].map((height, bar) => (
                    <i key={bar} style={{ height: `${height}%` }} />
                  ))}
                </div>
              </article>
            ))}
          </section>
          <section className="dashboard-grid">
            <article className="dashboard-card chart-card">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">Analytics</p>
                  <h2>Member growth</h2>
                </div>
                <div className="chart-controls">
                  <button
                    className={period === 'Monthly' ? 'selected' : ''}
                    onClick={() => setPeriod('Monthly')}
                  >
                    Monthly
                  </button>
                  <button
                    className={period === 'Yearly' ? 'selected' : ''}
                    onClick={() => setPeriod('Yearly')}
                  >
                    Yearly
                  </button>
                </div>
              </div>
              <p className="chart-description">{period} member growth</p>
              <div className="bar-chart">
                {growthHeights.map((height, index) => (
                  <div key={index}>
                    <i style={{ height: `${height}%` }} />
                    <span>{growthLabels[index]}</span>
                  </div>
                ))}
              </div>
            </article>
            <article className="dashboard-card ranking-card">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">Leaderboard</p>
                  <h2>Most active</h2>
                </div>
                {leaderboard.length > 5 && (
                  <button onClick={() => setShowAll(!showAll)}>
                    {showAll ? 'Show less' : 'View all'}
                  </button>
                )}
              </div>
              {visibleLeaderboard.length ? (
                visibleLeaderboard.map(({ name, visits }, index) => (
                  <div className="rank-row" key={name}>
                    <b>{String(index + 1).padStart(2, '0')}</b>
                    <span>
                      {name
                        .split(' ')
                        .map((word) => word[0])
                        .join('')}
                    </span>
                    <div>
                      <strong>{name}</strong>
                      <small>
                        {visits} {visits === 1 ? 'visit' : 'visits'}
                      </small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="workspace-row">No check-ins yet.</p>
              )}
            </article>
          </section>
        </>
      )}
    </DashboardShell>
  )
}
