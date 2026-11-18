const manilaTime = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
})
const manilaDay = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila',
  month: 'short',
  day: 'numeric'
})

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
      <time dateTime={date.toISOString()}>
        <span>{manilaDay.format(date)}</span>
        <span>{manilaTime.format(date)}</span>
      </time>
    </li>
  )
}
