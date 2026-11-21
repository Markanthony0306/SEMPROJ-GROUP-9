import { useEffect, useState } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import { apiRequest } from '../../../utils/api'
import { Icon } from '../../DashboardShell'
import AttendanceChart from './AttendanceChart'
import MembershipStatusChart from './MembershipStatusChart'
import RevenueChart from './RevenueChart'
import PaymentMethodsChart from './PaymentMethodsChart'
import { pesos } from './useAnalyticsChart'
import './analytics.css'

const validPayload = {
  attendance: (data) => Array.isArray(data.days) && Number.isFinite(data.total),
  'membership-status': (data) =>
    ['totalMembers', 'active', 'expiringSoon', 'expired', 'unclassified'].every((key) =>
      Number.isFinite(data[key])
    ),
  revenue: (data) =>
    Array.isArray(data.months) &&
    Number.isFinite(data.paymentCount) &&
    Number.isFinite(data.revenueThisMonth),
  payments: (data) => Array.isArray(data.methods) && Number.isFinite(data.total)
}

function useAnalyticsResource(path, token, refreshKey) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setState({ data: null, loading: true, error: '' })
    apiRequest(`/analytics/${path}`, { token, signal: controller.signal })
      .then((data) => {
        if (!validPayload[path](data))
          throw new Error('The analytics response was incomplete. Please try again.')
        if (!controller.signal.aborted) setState({ data, loading: false, error: '' })
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setState({ data: null, loading: false, error: cause.message })
      })
    return () => controller.abort()
  }, [path, token, refreshKey, attempt])
  return { ...state, onRetry: () => setAttempt((value) => value + 1) }
}

export default function AdminAnalytics({ refreshKey }) {
  const { token } = useAuth()
  const attendance = useAnalyticsResource('attendance', token, refreshKey)
  const membership = useAnalyticsResource('membership-status', token, refreshKey)
  const revenue = useAnalyticsResource('revenue', token, refreshKey)
  const payments = useAnalyticsResource('payments', token, refreshKey)
  const stats = [
    {
      label: 'Total members',
      value: membership.data?.totalMembers,
      resource: membership,
      icon: 'users'
    },
    {
      label: 'Check-ins this week',
      value: attendance.data?.total,
      resource: attendance,
      icon: 'qr'
    },
    {
      label: 'Expiring soon',
      value: membership.data?.expiringSoon,
      resource: membership,
      icon: 'bell',
      danger: true
    },
    {
      label: 'Revenue this month',
      value: revenue.data ? pesos(revenue.data.revenueThisMonth) : null,
      resource: revenue,
      icon: 'wallet'
    }
  ]
  return (
    <div className="admin-analytics">
      <section className="analytics-stats" aria-label="Gym analytics totals">
        {stats.map(({ label, value, resource, icon, danger }) => (
          <article
            className={`clay analytics-stat${danger ? ' analytics-stat-danger' : ''}`}
            key={label}
            aria-busy={resource.loading}
          >
            <span className="analytics-stat-icon">
              <Icon name={icon} />
            </span>
            <div>
              <h2>{label}</h2>
              {resource.loading ? (
                <span
                  className="analytics-skeleton analytics-value-skeleton"
                  aria-label={`Loading ${label}`}
                />
              ) : (
                <strong title={resource.error || undefined}>
                  {resource.error ? 'Unavailable' : value}
                </strong>
              )}
            </div>
          </article>
        ))}
      </section>
      <section className="analytics-grid" aria-label="Gym analytics charts">
        <AttendanceChart {...attendance} />
        <MembershipStatusChart {...membership} />
        <RevenueChart {...revenue} />
        <PaymentMethodsChart {...payments} />
      </section>
    </div>
  )
}
