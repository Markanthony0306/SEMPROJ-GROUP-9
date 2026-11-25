import { formatDate, formatTime } from '../../../shared/formatDate.js'

// Use the recorded event time, formatted in the gym's timezone.
export default function ActivityRow({ row, Icon }) {
  const date = new Date(row.date)
  return (
    <li className="fitpulse-activity-row">
      <span className="fitpulse-icon-chip" data-kind={row.icon}>
        <Icon name={row.icon} size={18} />
      </span>
      <span className="fitpulse-row-copy">
        <strong>{row.title}</strong>
        <small>{row.detail}</small>
      </span>
      <time dateTime={row.date}>
        <span>{formatDate(date)}</span>
        <span>{formatTime(date)}</span>
      </time>
    </li>
  )
}
