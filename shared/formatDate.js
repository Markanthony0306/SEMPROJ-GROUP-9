export const MANILA_TIME_ZONE = 'Asia/Manila'

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: MANILA_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})
const timeOptions = { timeZone: MANILA_TIME_ZONE, hour: '2-digit', minute: '2-digit' }
const clock12 = new Intl.DateTimeFormat('en-PH', { ...timeOptions, hour12: true })
const clock24 = new Intl.DateTimeFormat('en-GB', { ...timeOptions, hourCycle: 'h23' })

function validDate(value) {
  if (value == null || value === '') return null
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date : null
}

export function formatDate(value, fallback = '—') {
  const date = validDate(value)
  if (!date) return fallback
  const parts = Object.fromEntries(dateFormatter.formatToParts(date).map(({ type, value }) => [type, value]))
  return `${parts.day}/${parts.month}/${parts.year.padStart(4, '0')}`
}

export function manilaDateKey(value) {
  return formatDate(value, '').split('/').reverse().join('-')
}

export function formatTime(value, { hour12 = true } = {}) {
  const date = validDate(value)
  return date ? (hour12 ? clock12 : clock24).format(date) : ''
}

export function formatDateTime(value, fallback = '—', options) {
  const date = validDate(value)
  return date ? `${formatDate(date)}, ${formatTime(date, options)}` : fallback
}
