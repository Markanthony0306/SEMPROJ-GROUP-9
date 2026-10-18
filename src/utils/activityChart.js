const manilaDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Manila',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

function calendarDate(value) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return null
  const parts = Object.fromEntries(
    manilaDate.formatToParts(date).map(({ type, value }) => [type, value])
  )
  return new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)))
}

// Bucket by Manila calendar dates rather than rolling 24-hour periods.
export function activityBuckets(records, range = 'week', metric = 'attendance', now = new Date()) {
  const today = calendarDate(now)
  const monthly = range === 'months'
  const count = monthly ? 6 : 7
  const key = (date) => (monthly ? date.toISOString().slice(0, 7) : date.toISOString().slice(0, 10))
  const buckets = Array.from({ length: count }, (_, index) => {
    const date = new Date(today)
    if (monthly) {
      date.setUTCDate(1)
      date.setUTCMonth(date.getUTCMonth() - (count - 1 - index))
    } else date.setUTCDate(date.getUTCDate() - (count - 1 - index))
    return {
      key: key(date),
      value: 0,
      label: date.toLocaleDateString('en-PH', {
        timeZone: 'UTC',
        [monthly ? 'month' : 'weekday']: 'short'
      }),
      description: date.toLocaleDateString('en-PH', {
        timeZone: 'UTC',
        month: 'long',
        ...(monthly ? { year: 'numeric' } : { day: 'numeric', year: 'numeric' })
      })
    }
  })
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]))
  for (const record of records) {
    const date = calendarDate(record.date)
    if (!date || new Date(record.date) > new Date(now)) continue
    const bucket = byKey.get(key(date))
    const value = metric === 'revenue' ? Number(record.amount) : 1
    if (bucket && Number.isFinite(value) && value > 0) bucket.value += value
  }
  return buckets
}
