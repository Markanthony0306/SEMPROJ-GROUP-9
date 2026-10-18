import { useId, useMemo, useState } from 'react'
import { activityBuckets } from '../utils/activityChart'
import { Icon } from './DashboardShell'
import './ActivityChart.css'

export default function ActivityChart({
  attendance = [],
  payments = [],
  admin = false,
  loading = false
}) {
  const headingId = useId()
  const [range, setRange] = useState('week')
  const [metric, setMetric] = useState('attendance')
  const [selected, setSelected] = useState(null)
  const buckets = useMemo(
    () => activityBuckets(metric === 'revenue' ? payments : attendance, range, metric),
    [attendance, payments, range, metric]
  )
  const maximum = Math.max(1, ...buckets.map(({ value }) => value))
  const total = buckets.reduce((sum, bucket) => sum + bucket.value, 0)
  const active = buckets.find((bucket) => bucket.key === selected)
  const format = (value) =>
    metric === 'revenue'
      ? new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
          maximumFractionDigits: 0
        }).format(value)
      : `${value} ${value === 1 ? 'check-in' : 'check-ins'}`
  return (
    <article className="card clay activity-chart" aria-labelledby={headingId} aria-busy={loading}>
      <div className="activity-heading">
        <div>
          <span className="dashboard-eyebrow">
            {admin ? 'THE BIGGER PICTURE' : 'YOUR CONSISTENCY, VISUALIZED'}
          </span>
          <h2 id={headingId}>{admin ? 'Gym activity' : 'Your activity'}</h2>
          <p>
            {admin
              ? 'A little momentum, every day.'
              : 'Every visit is a step forward. Keep showing up.'}
          </p>
        </div>
        <span className="activity-icon">
          <Icon name="chart" size={24} />
        </span>
      </div>
      <div className="activity-controls">
        {admin && (
          <div className="clay-segment" role="group" aria-label="Chart metric">
            {[
              ['attendance', 'Check-ins'],
              ['revenue', 'Revenue']
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-pressed={metric === value}
                onClick={() => {
                  setMetric(value)
                  setSelected(null)
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="clay-segment" role="group" aria-label="Chart period">
          {[
            ['week', '7 days'],
            ['months', '6 months']
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-pressed={range === value}
              onClick={() => {
                setRange(value)
                setSelected(null)
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="activity-summary" aria-live="polite">
        <strong>{loading ? 'Loading…' : format(active ? active.value : total)}</strong>
        <span>
          {active
            ? active.description
            : range === 'week'
              ? 'in the last 7 days'
              : 'in the last 6 months'}
        </span>
        {active && (
          <button type="button" onClick={() => setSelected(null)}>
            Show total
          </button>
        )}
      </div>
      <div
        className="activity-plot"
        aria-label={`${metric === 'revenue' ? 'Revenue' : 'Check-ins'} by ${range === 'week' ? 'day' : 'month'}`}
      >
        <div className="activity-grid" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
        {buckets.map((bucket) => (
          <button
            className={`activity-column${selected === bucket.key ? ' is-selected' : ''}`}
            type="button"
            key={bucket.key}
            disabled={loading}
            aria-pressed={selected === bucket.key}
            aria-label={`${bucket.description}: ${format(bucket.value)}`}
            onClick={() => setSelected(selected === bucket.key ? null : bucket.key)}
          >
            <span className="activity-bar-space">
              <span
                className="activity-bar"
                style={{
                  '--bar-height': `${bucket.value ? Math.max(5, (bucket.value / maximum) * 100) : 2}%`
                }}
              >
                <span className="activity-tooltip">{format(bucket.value)}</span>
              </span>
            </span>
            <span className="activity-day">{bucket.label}</span>
          </button>
        ))}
      </div>
      <div className="activity-footer">
        <span>
          <i />
          {metric === 'revenue' ? 'Recorded payments' : 'Recorded visits'}
        </span>
        <small>
          {!loading && total === 0
            ? 'No activity in this period yet.'
            : 'Select a bar to explore · Asia/Manila'}
        </small>
      </div>
    </article>
  )
}
