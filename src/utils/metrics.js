const DAY_MS = 86_400_000
const WEEK_MS = 7 * DAY_MS

export function monthIndexOf(date) {
  return date.getFullYear() * 12 + date.getMonth()
}

function quarterIndexOf(date) {
  return date.getFullYear() * 4 + Math.floor(date.getMonth() / 3)
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount)
}

export function formatDate(iso) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  let hours = date.getHours() % 12
  if (hours === 0) hours = 12
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const suffix = date.getHours() < 12 ? 'AM' : 'PM'
  return `${formatDate(iso)} · ${hours}:${minutes} ${suffix}`
}

// Counts records that fall within the last `count` day/week/month buckets.
export function trailingBuckets(records, count, unit) {
  const buckets = Array.from({ length: count }, () => 0)
  const now = new Date()
  for (const record of records) {
    const date = new Date(record.date)
    if (Number.isNaN(date.getTime())) continue
    let diff
    if (unit === 'day' || unit === 'week') {
      diff = Math.floor((now.getTime() - date.getTime()) / (unit === 'day' ? DAY_MS : WEEK_MS))
    } else if (unit === 'month') {
      diff = monthIndexOf(now) - monthIndexOf(date)
    } else {
      continue
    }
    if (diff >= 0 && diff < count) buckets[count - 1 - diff] += 1
  }
  return buckets
}

// Sums record.amount across the last `count` month buckets.
export function totalBuckets(records, count) {
  const buckets = Array.from({ length: count }, () => 0)
  const now = new Date()
  for (const record of records) {
    const date = new Date(record.date)
    if (Number.isNaN(date.getTime())) continue
    const diff = monthIndexOf(now) - monthIndexOf(date)
    if (diff >= 0 && diff < count) buckets[count - 1 - diff] += Number(record.amount || 0)
  }
  return buckets
}

export function trailingQuarterBuckets(records, count = 4) {
  const buckets = Array.from({ length: count }, () => 0)
  const nowQuarter = quarterIndexOf(new Date())
  for (const record of records) {
    const date = new Date(record.date)
    if (Number.isNaN(date.getTime())) continue
    const diff = nowQuarter - quarterIndexOf(date)
    if (diff >= 0 && diff < count) buckets[count - 1 - diff] += 1
  }
  return buckets
}

// Scales counts into bar heights (0-92) so charts look consistent.
export function heightsFor(counts, maxHeight = 92) {
  const max = Math.max(...counts)
  if (max <= 0) return counts.map(() => 0)
  return counts.map((count) => (count > 0 ? Math.max(4, Math.round((count / max) * maxHeight)) : 0))
}

export function monthLabels(count) {
  const now = new Date()
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1)
    return date.toLocaleDateString('en-US', { month: 'short' })
  })
}

export function quarterLabels(count) {
  const nowQuarter = quarterIndexOf(new Date())
  return Array.from({ length: count }, (_, index) => {
    const quarter = ((((nowQuarter - (count - 1 - index)) % 4) + 4) % 4) + 1
    return `Q${quarter}`
  })
}
