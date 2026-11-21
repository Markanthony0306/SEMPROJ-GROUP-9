const TIME_ZONE = 'Asia/Manila'
const DAY_MS = 86400000
const EXPIRING_DAYS = 7
const SUCCESSFUL_PAYMENTS = new Set(['paid', 'completed', 'success', 'successful'])
const dateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

export function manilaDateKey(value) {
  const parts = Object.fromEntries(
    dateFormat.formatToParts(new Date(value)).map(({ type, value: part }) => [type, part])
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}

function addDays(key, days) {
  return new Date(Date.parse(`${key}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)
}

function midnight(key) {
  return new Date(`${key}T00:00:00+08:00`).toISOString()
}

// Keep money in integer centavos while summing to avoid floating-point drift.
function centavos(payment) {
  const amount = Number(payment.amount_paid)
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : 0
}

function successful(payment) {
  return SUCCESSFUL_PAYMENTS.has(
    String(payment.payment_status || '')
      .trim()
      .toLowerCase()
  )
}

export class AnalyticsService {
  constructor(repository, clock = () => new Date()) {
    this.repository = repository
    this.clock = clock
  }

  async attendance() {
    const now = this.clock()
    const today = manilaDateKey(now)
    const weekday = new Date(`${today}T00:00:00Z`).getUTCDay()
    const weekStart = addDays(today, -((weekday + 6) % 7))
    const weekEnd = addDays(weekStart, 7)
    const rows = await this.repository.attendance(
      midnight(weekStart),
      midnight(weekEnd),
      now.toISOString()
    )
    const days = Array.from({ length: 7 }, (_, index) => ({
      date: addDays(weekStart, index),
      label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
      count: 0
    }))
    const counts = new Map(days.map((day) => [day.date, day]))
    for (const row of rows) {
      const day = counts.get(manilaDateKey(row.check_in_time))
      if (day) day.count += 1
    }
    return {
      timeZone: TIME_ZONE,
      weekStart,
      weekEnd: addDays(weekEnd, -1),
      days,
      total: days.reduce((sum, day) => sum + day.count, 0)
    }
  }

  async membershipStatus() {
    const now = this.clock()
    const expiringThrough = addDays(manilaDateKey(now), EXPIRING_DAYS)
    const { members, subscriptions } = await this.repository.memberships()
    const latest = new Map()
    // The repository orders newest first; renewed members must never be counted twice.
    for (const subscription of subscriptions) {
      if (!latest.has(subscription.user_id)) latest.set(subscription.user_id, subscription)
    }
    const counts = { active: 0, expiringSoon: 0, expired: 0, unclassified: 0 }
    for (const member of members) {
      const subscription = latest.get(member.id)
      const start = Date.parse(subscription?.start_date)
      const end = Date.parse(subscription?.end_date)
      if (
        !subscription ||
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        end <= start ||
        start > now.getTime() ||
        !['active', 'expired'].includes(String(member.status).toLowerCase()) ||
        !['active', 'expired'].includes(String(subscription.status).toLowerCase())
      ) {
        counts.unclassified += 1
      } else if (end <= now.getTime()) {
        counts.expired += 1
      } else if (manilaDateKey(end) <= expiringThrough) {
        counts.expiringSoon += 1
      } else {
        counts.active += 1
      }
    }
    return {
      timeZone: TIME_ZONE,
      totalMembers: members.length,
      expiringDays: EXPIRING_DAYS,
      ...counts
    }
  }

  async revenue() {
    const now = this.clock()
    const [year, month] = manilaDateKey(now).split('-').map(Number)
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(Date.UTC(year, month - 6 + index, 1))
      return {
        month: date.toISOString().slice(0, 7),
        label: date.toLocaleDateString('en-PH', {
          timeZone: 'UTC',
          month: 'short',
          year: 'numeric'
        }),
        centavos: 0
      }
    })
    const rows = await this.repository.payments(
      midnight(`${months[0].month}-01`),
      now.toISOString()
    )
    const totals = new Map(months.map((month) => [month.month, month]))
    let paymentCount = 0
    for (const row of rows) {
      const month = totals.get(manilaDateKey(row.created_at).slice(0, 7))
      if (month && successful(row)) {
        month.centavos += centavos(row)
        paymentCount += 1
      }
    }
    return {
      timeZone: TIME_ZONE,
      currency: 'PHP',
      paymentCount,
      months: months.map(({ centavos: value, ...month }) => ({ ...month, amount: value / 100 })),
      revenueThisMonth: months.at(-1).centavos / 100
    }
  }

  async payments() {
    const [rows, methods] = await Promise.all([
      this.repository.payments(null, this.clock().toISOString()),
      this.repository.paymentMethods()
    ])
    const names = new Map(
      methods.map((method) => [method.method_id, String(method.method_name).trim().toLowerCase()])
    )
    const counts = { cash: 0, gcash: 0 }
    for (const row of rows) {
      const name = names.get(row.method_id)
      if (successful(row) && Object.hasOwn(counts, name)) counts[name] += 1
    }
    const total = counts.cash + counts.gcash
    // Round one share and use its complement so displayed percentages sum to 100.
    const cashPercent = total ? Math.round((counts.cash * 1000) / total) / 10 : 0
    const gcashPercent = total ? Math.round((100 - cashPercent) * 10) / 10 : 0
    return {
      timeZone: TIME_ZONE,
      total,
      basis: 'successful payment count',
      methods: ['cash', 'gcash'].map((method) => ({
        label: method === 'cash' ? 'Cash' : 'GCash',
        count: counts[method],
        percent: method === 'cash' ? cashPercent : gcashPercent
      }))
    }
  }
}
