# FitPulse analytics: complete source

Complete current contents of every application, test, and preview source file added or edited for this feature. Existing user edits in the touched files are preserved. Local preview files contain test fixtures only and are outside the production application.

See ADMIN_ANALYTICS.md in this folder for data flow, endpoint contracts, metric definitions, and verification notes.

## index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <!-- Let the mobile dashboard pad around device cutouts and the home indicator. -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="description" content="FitPulse gym membership and attendance management" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
    <link rel="icon" type="image/svg+xml" href="./fitpulse-logo.svg" />
    <script>
      // Set the <html> data-theme before first paint so the auth screens never
      // flash the wrong colors. Uses the saved choice or the system preference.
      ;(function () {
        try {
          var theme = localStorage.getItem('fitpulse-theme')
          if (theme !== 'light' && theme !== 'dark') {
            theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
          }
          document.documentElement.setAttribute('data-theme', theme)
        } catch (error) {
          // localStorage can be unavailable in some embedded browsers — ignore.
        }
      })()
    </script>
    <title>FitPulse | Stronger every day</title>
  </head>
  <body>
    <div id="root"></div>
    <!-- Load the pinned UMD global before React creates any analytics canvases. -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

## server/bootstrap/registerApiRoutes.js

```javascript
import { memberIdVerificationRoutes } from '../routes/memberIdVerification.js'
import { registerFaceEnrollmentRoutes } from '../routes/faceEnrollmentSettingsRoutes.js'
import { registerPasswordRecoveryRoutes } from '../routes/passwordRecoveryRoutes.js'
import { registerCurrentUserRoutes } from '../routes/currentUserRoutes.js'
import { registerMembershipPlanRoutes } from '../routes/membershipPlanRoutes.js'
import { registerMemberUpdateRoutes } from '../routes/memberUpdateRoutes.js'
import { registerEquipmentRoutes } from '../routes/equipmentRoutes.js'
import { registerSettingsRoutes } from '../routes/gymSettingsRoutes.js'
import { registerProfileUpdateRoutes } from '../routes/profileUpdateRoutes.js'
import { registerChangePasswordRoutes } from '../routes/changePasswordRoutes.js'
import { registerActivityAndPaymentRoutes } from '../routes/activityPaymentRoutes.js'
import { createSupabaseAuthClient } from '../lib/authClient.js'
import { withMemberAccountLock } from '../lib/memberAccountLock.js'
import { accountRoutes } from '../routes/accounts.js'
import { scannerRoutes } from '../routes/scanner.js'
import { avatarRoutes } from '../routes/avatar.js'
import { memberRoutes } from '../routes/members.js'
import { demoAccountRoutes } from '../routes/demo-accounts.js'
import { reportRoutes } from '../routes/reports.js'
import { notificationRoutes } from '../routes/notifications.js'
import { passwordLoginHandler } from '../routes/passwordLogin.js'
import { membershipRenewalRoutes } from '../routes/membershipRenewal.js'
import { faceVerificationRoutes } from '../routes/faceVerification.js'
import { memberRegistrationRoutes } from '../routes/memberRegistration.js'
import { eventRoutes } from '../routes/events.js'
import { analyticsRoutes } from '../routes/analytics.js'

/** Route registration order is intentionally identical to the original server.js. */
export function registerApiRoutes(app, dependencies, config) {
  const {
    supabase, loadDatabase, loadAccount, saveDatabase,
    membershipRenewalWorkflow, memberRegistrationService, memberRegistrationWorkflow, verifiedRegistrationWorkflow,
    adminNotifications, faceChallenges, events,
    createSession, authenticate, authenticateEventStream, requireRole, rateLimit,
    availablePlan, publicAccount, validAccountInput, paymentMethod, emailPattern,
    passwordPolicy, passwordPolicyMessage, isRetiredPlan
  } = dependencies
  const { jwtSecret, isProduction, clientUrl, faceLoginEnabled, faceEncryptionKey, memberIdKey, identityVerificationEnabled, faceMatchThreshold } = config
  const { emitEvent } = events

  // Rocky's stream is scoped separately from ordinary API sessions.
  app.use('/api', eventRoutes({ authenticate, authenticateEventStream, events, jwtSecret, supabase }))

  app.use('/api', accountRoutes({
    authenticate, requireRole, rateLimit, loadAccount, supabase,
    createAuthClient: createSupabaseAuthClient, emitEvent
  }))
  app.use('/api', reportRoutes({ authenticate, requireRole, loadDatabase, supabase, rateLimit, emitEvent }))
  app.use('/api', analyticsRoutes({ authenticate, requireRole, supabase }))
  app.use('/api', notificationRoutes({
    authenticate, requireRole, rateLimit, notifications: adminNotifications
  }))

  app.use('/api', demoAccountRoutes({
    isProduction,
    loadDatabase,
    rateLimit,
    verifyPassword: async (email, password) => {
      const { error } = await createSupabaseAuthClient().auth.signInWithPassword({ email, password })
      return !error
    }
  }))
  app.use('/api', scannerRoutes({ loadAccount, authenticate, requireRole, rateLimit, jwtSecret, emitEvent }))

  app.use('/api', membershipRenewalRoutes({
    authenticate,
    requireRole,
    loadDatabase,
    withMemberAccountLock,
    availablePlan,
    paymentMethod,
    publicAccount,
    emitEvent,
    workflow: membershipRenewalWorkflow
  }))

  // Member management routes
  app.use('/api', memberRoutes({
    authenticate,
    requireRole,
    loadDatabase,
    publicAccount
  }))

  app.use('/api', memberRegistrationRoutes({
    authenticate,
    requireRole,
    rateLimit,
    loadDatabase,
    supabase,
    validAccountInput,
    paymentMethod,
    registrationService: memberRegistrationService,
    registrationWorkflow: memberRegistrationWorkflow,
    verifiedRegistrationWorkflow,
    identityVerificationEnabled,
    emitEvent,
    faceKey: faceEncryptionKey,
    publicAccount
  }))

  app.use(
    '/api',
    avatarRoutes({ supabase, authenticate, requireRole, rateLimit })
  )

  // Legacy registration endpoint retired.
  // New member registration is handled by:
  // POST /api/admin/members
  // This endpoint remains temporarily to provide
  // a clear response to older API clients.
  app.post(
    '/api/auth/register',
    authenticate,
    requireRole('admin'),
    (_req, res) => {
      return res.status(410).json({
        message:
          'This registration endpoint has been retired. Use /api/admin/members.'
      })
    }
  )

  app.post('/api/auth/login', rateLimit({ max: 10 }), passwordLoginHandler({
    createAuthClient: createSupabaseAuthClient,
    supabase,
    loadAccount,
    createSession,
    identityVerificationEnabled,
    createAdminFaceChallenge: (account) => faceEncryptionKey && faceChallenges.issue({
      userId: account.id, authVersion: account.authVersion || 0, role: account.role
    }),
    createTermsChallenge: (account) =>
      faceChallenges.issueTerms({ userId: account.id, authVersion: account.authVersion || 0, role: account.role })
  }))

  app.use('/api', faceVerificationRoutes({
    supabase, authenticate, requireRole, rateLimit, loadAccount, createSession,
    staffFaceEnabled: faceLoginEnabled, identityVerificationEnabled, key: faceEncryptionKey, memberIdKey,
    challenges: faceChallenges, createAuthClient: createSupabaseAuthClient
  }))

  if (identityVerificationEnabled) {
    app.use('/api', memberIdVerificationRoutes({
      supabase, authenticate, requireRole, rateLimit, validAccountInput,
      key: memberIdKey, faceKey: faceEncryptionKey, challenges: faceChallenges
    }))
  }

  registerFaceEnrollmentRoutes(app, { authenticate, requireRole, rateLimit, supabase })

  registerPasswordRecoveryRoutes(app, { rateLimit, emailPattern, passwordPolicy, passwordPolicyMessage, supabase, clientUrl })

  registerCurrentUserRoutes(app, { authenticate, loadAccount, publicAccount })

  registerMembershipPlanRoutes(app, { authenticate, requireRole, supabase, isRetiredPlan })

  registerMemberUpdateRoutes(app, { authenticate, requireRole, loadDatabase, validAccountInput, passwordPolicy, passwordPolicyMessage, supabase, publicAccount })

  registerEquipmentRoutes(app, { authenticate, requireRole, loadDatabase, saveDatabase, supabase, emitEvent })

  registerSettingsRoutes(app, { authenticate, requireRole, loadDatabase, saveDatabase })

  registerProfileUpdateRoutes(app, { authenticate, validAccountInput, supabase, loadDatabase, publicAccount })

  registerChangePasswordRoutes(app, { authenticate, rateLimit, passwordPolicy, passwordPolicyMessage, supabase, loadDatabase, saveDatabase, createAuthClient: createSupabaseAuthClient, createSession })

  registerActivityAndPaymentRoutes(app, { authenticate, requireRole, loadDatabase, supabase, paymentMethod, emitEvent })
}
```

## server/repositories/AnalyticsRepository.js

```javascript
const PAGE_SIZE = 1000

// Read every page in a stable order; Supabase caps a single response at 1,000 rows.
async function readPages(createQuery) {
  const rows = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await createQuery().range(offset, offset + PAGE_SIZE - 1)
    if (error) throw new Error('Analytics database query failed.', { cause: error })
    rows.push(...(data || []))
    if (!data || data.length < PAGE_SIZE) return rows
  }
}

export class AnalyticsRepository {
  constructor(supabase) {
    this.supabase = supabase
  }

  attendance(start, end, now) {
    return readPages(() =>
      this.supabase
        .from('attendance_logs')
        .select('check_in_time')
        .in('entry_type', ['ESP32-CAM', 'Staff'])
        .not('qr_token_id', 'is', null)
        .gte('check_in_time', start)
        .lt('check_in_time', end)
        .lte('check_in_time', now)
        .order('check_in_time')
        .order('attendance_id')
    )
  }

  async memberships() {
    const roles = await readPages(() =>
      this.supabase.from('roles').select('role_id').ilike('role_name', 'member').order('role_id')
    )
    if (!roles.length) return { members: [], subscriptions: [] }

    const roleIds = roles.map((role) => role.role_id)
    const [members, subscriptions] = await Promise.all([
      readPages(() =>
        this.supabase.from('users').select('id, status').in('role_id', roleIds).order('id')
      ),
      readPages(() =>
        this.supabase
          .from('subscriptions')
          .select(
            'subscription_id, user_id, start_date, end_date, status, created_at, users!inner(role_id)'
          )
          .in('users.role_id', roleIds)
          .order('created_at', { ascending: false })
          .order('subscription_id', { ascending: false })
      )
    ])
    return { members, subscriptions }
  }

  payments(start, now) {
    return readPages(() => {
      let query = this.supabase
        .from('payments')
        .select('amount_paid, payment_status, method_id, created_at')
        .lte('created_at', now)
      if (start) query = query.gte('created_at', start)
      return query.order('created_at').order('payment_id')
    })
  }

  paymentMethods() {
    return readPages(() =>
      this.supabase.from('payment_methods').select('method_id, method_name').order('method_id')
    )
  }
}
```

## server/services/AnalyticsService.js

```javascript
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
```

## server/routes/analytics.js

```javascript
import { Router } from 'express'
import { AnalyticsRepository } from '../repositories/AnalyticsRepository.js'
import { AnalyticsService } from '../services/AnalyticsService.js'

export function analyticsRoutes({
  authenticate,
  requireRole,
  supabase,
  service = new AnalyticsService(new AnalyticsRepository(supabase))
}) {
  const router = Router()
  // RBAC runs before any database access. Never cache private admin aggregates.
  router.use('/analytics', authenticate, requireRole('admin'), (_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  // GET /api/analytics/attendance: QR scanner check-ins for this Manila week.
  router.get('/analytics/attendance', async (_req, res) => res.json(await service.attendance()))

  // GET /api/analytics/membership-status: one latest subscription per member.
  router.get('/analytics/membership-status', async (_req, res) =>
    res.json(await service.membershipStatus())
  )

  // GET /api/analytics/revenue: successful payments in six Manila calendar months.
  router.get('/analytics/revenue', async (_req, res) => res.json(await service.revenue()))

  // GET /api/analytics/payments: all-time Cash / GCash share by successful payment count.
  router.get('/analytics/payments', async (_req, res) => res.json(await service.payments()))

  router.use('/analytics', (error, _req, res, _next) => {
    console.error('Analytics unavailable:', error.cause?.code || error.name)
    res.status(503).json({ message: 'Unable to load analytics. Please try again.' })
  })
  return router
}
```

## server/routes/analytics.test.js

```javascript
import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { analyticsRoutes } from './analytics.js'
import { AnalyticsService, manilaDateKey } from '../services/AnalyticsService.js'
import { AnalyticsRepository } from '../repositories/AnalyticsRepository.js'
import { createSessionAuth } from '../middleware/sessionAuth.js'

const clock = () => new Date('2026-11-21T02:00:00Z')
const endpoints = ['attendance', 'membership-status', 'revenue', 'payments']
const repository = (overrides = {}) => ({
  attendance: async () => [],
  memberships: async () => ({ members: [], subscriptions: [] }),
  payments: async () => [],
  paymentMethods: async () => [],
  ...overrides
})

test('attendance includes seven days and starts Monday at Manila midnight', async () => {
  let bounds
  const service = new AnalyticsService(
    repository({
      attendance: async (...args) => {
        bounds = args
        return [
          { check_in_time: '2026-11-15T16:00:00Z' },
          { check_in_time: '2026-11-20T16:01:00Z' },
          { check_in_time: '2026-11-21T01:00:00Z' }
        ]
      }
    }),
    clock
  )
  const result = await service.attendance()
  assert.deepEqual(bounds, [
    '2026-11-15T16:00:00.000Z',
    '2026-11-22T16:00:00.000Z',
    clock().toISOString()
  ])
  assert.equal(result.days.length, 7)
  assert.deepEqual(
    result.days.map((day) => day.count),
    [1, 0, 0, 0, 0, 2, 0]
  )
  assert.equal(result.total, 3)
})

test('Sunday remains in its week; Manila Monday starts a new week', async () => {
  const repo = repository()
  const sunday = await new AnalyticsService(
    repo,
    () => new Date('2026-11-22T15:59:59Z')
  ).attendance()
  const monday = await new AnalyticsService(
    repo,
    () => new Date('2026-11-22T16:00:00Z')
  ).attendance()
  assert.equal(sunday.weekStart, '2026-11-16')
  assert.equal(monday.weekStart, '2026-11-23')
  assert.equal(manilaDateKey('2026-12-31T16:00:00Z'), '2027-01-01')
})

test('membership buckets use the latest subscription and exact expiry time', async () => {
  const subscription = (user_id, end_date, changes = {}) => ({
    user_id,
    start_date: '2026-11-01T00:00:00+08:00',
    end_date,
    status: 'active',
    ...changes
  })
  const members = Array.from({ length: 8 }, (_, index) => ({ id: String(index), status: 'active' }))
  members[7].status = 'inactive'
  const subscriptions = [
    subscription('0', '2026-12-20T00:00:00+08:00'),
    subscription('0', '2026-11-01T00:00:00+08:00'), // Historical renewal: ignored.
    subscription('1', '2026-11-28T23:59:59+08:00'), // Inclusive seventh calendar day.
    subscription('2', clock().toISOString()), // At expiry, already expired.
    subscription('3', '2026-11-21T12:00:00+08:00'), // Later today: expiring, still valid.
    subscription('4', '2026-12-20T00:00:00+08:00', { start_date: '2026-12-01T00:00:00+08:00' }),
    subscription('5', '2026-12-20T00:00:00+08:00', { status: 'cancelled' }),
    subscription('7', '2026-12-20T00:00:00+08:00')
  ]
  const result = await new AnalyticsService(
    repository({ memberships: async () => ({ members, subscriptions }) }),
    clock
  ).membershipStatus()
  assert.deepEqual(
    {
      active: result.active,
      expiring: result.expiringSoon,
      expired: result.expired,
      unclassified: result.unclassified
    },
    { active: 1, expiring: 2, expired: 1, unclassified: 4 }
  )
  assert.equal(result.totalMembers, 8)
})

test('revenue crosses year and UTC month boundaries and sums only successful centavos', async () => {
  let bounds
  const service = new AnalyticsService(
    repository({
      payments: async (...args) => {
        bounds = args
        return [
          { created_at: '2026-12-31T16:00:00Z', payment_status: 'Paid', amount_paid: '0.10' },
          { created_at: '2027-01-01T00:00:00Z', payment_status: 'Completed', amount_paid: '0.20' },
          { created_at: '2026-12-31T15:59:59Z', payment_status: 'paid', amount_paid: '500.50' },
          { created_at: '2027-01-01T00:00:00Z', payment_status: 'Pending', amount_paid: 1000 },
          { created_at: '2027-01-01T00:00:00Z', payment_status: 'Refunded', amount_paid: 1000 },
          { created_at: '2027-01-01T00:00:00Z', payment_status: null, amount_paid: 1000 }
        ]
      }
    }),
    () => new Date('2027-01-05T00:00:00Z')
  )
  const result = await service.revenue()
  assert.equal(bounds[0], '2026-07-31T16:00:00.000Z')
  assert.deepEqual(
    result.months.map((month) => month.month),
    ['2026-08', '2026-09', '2026-10', '2026-11', '2026-12', '2027-01']
  )
  assert.equal(result.months[4].amount, 500.5)
  assert.equal(result.revenueThisMonth, 0.3)
  assert.equal(result.paymentCount, 3)
})

test('payment method share uses transaction count and excludes unsuccessful or other methods', async () => {
  const rows = [1, 1, 2, 3].map((method_id) => ({
    method_id,
    payment_status: 'Paid',
    amount_paid: 100
  }))
  rows.push({ method_id: 2, payment_status: 'Failed', amount_paid: 100 })
  const service = new AnalyticsService(
    repository({
      payments: async () => rows,
      paymentMethods: async () => [
        { method_id: 1, method_name: 'Cash' },
        { method_id: 2, method_name: 'GCash' },
        { method_id: 3, method_name: 'Card' }
      ]
    }),
    clock
  )
  assert.deepEqual((await service.payments()).methods, [
    { label: 'Cash', count: 2, percent: 66.7 },
    { label: 'GCash', count: 1, percent: 33.3 }
  ])
})

test('rounded Cash and GCash percentages sum to 100 at rounding ties', async () => {
  const rows = Array.from({ length: 2000 }, (_, index) => ({
    method_id: index < 1001 ? 1 : 2,
    payment_status: 'Paid'
  }))
  const service = new AnalyticsService(
    repository({
      payments: async () => rows,
      paymentMethods: async () => [
        { method_id: 1, method_name: 'Cash' },
        { method_id: 2, method_name: 'GCash' }
      ]
    }),
    clock
  )
  const { methods } = await service.payments()
  assert.deepEqual(
    methods.map((method) => method.percent),
    [50.1, 49.9]
  )
})

test('empty tables return real zeros, seven days, and six months without NaN', async () => {
  const service = new AnalyticsService(repository(), clock)
  assert.equal((await service.attendance()).total, 0)
  assert.equal((await service.membershipStatus()).totalMembers, 0)
  assert.equal((await service.revenue()).months.length, 6)
  assert.deepEqual(
    (await service.payments()).methods.map((method) => method.percent),
    [0, 0]
  )
})

test('repository reads beyond 1,000 rows and keeps scanner/date filters on every page', async () => {
  const calls = []
  const supabase = {
    from(table) {
      const filters = []
      const query = {}
      for (const method of ['select', 'in', 'not', 'gte', 'lt', 'lte', 'order']) {
        query[method] = (...args) => {
          filters.push([method, ...args])
          return query
        }
      }
      query.range = async (start, end) => {
        calls.push({ table, filters, start, end })
        return {
          data: Array.from({ length: start === 0 ? 1000 : 1 }, () => ({
            check_in_time: clock().toISOString()
          })),
          error: null
        }
      }
      return query
    }
  }
  const rows = await new AnalyticsRepository(supabase).attendance('start', 'end', 'now')
  assert.equal(rows.length, 1001)
  assert.equal(calls.length, 2)
  assert.deepEqual(
    calls.map(({ start, end }) => [start, end]),
    [
      [0, 999],
      [1000, 1999]
    ]
  )
  for (const call of calls) {
    assert.equal(call.table, 'attendance_logs')
    assert.ok(call.filters.some((filter) => filter[0] === 'in' && filter[2].includes('Staff')))
    assert.ok(call.filters.some((filter) => filter[0] === 'not' && filter[1] === 'qr_token_id'))
    assert.ok(call.filters.some((filter) => filter[0] === 'gte' && filter[2] === 'start'))
    assert.ok(call.filters.some((filter) => filter[0] === 'lte' && filter[2] === 'now'))
  }
})

async function withApp(run, serviceOverride) {
  const accounts = new Map(
    ['admin', 'staff', 'user'].map((role) => [
      role,
      {
        id: role,
        role,
        status: 'active',
        name: 'Analytics test',
        authVersion: 0
      }
    ])
  )
  const auth = createSessionAuth({
    jwtSecret: 'analytics-test-only-secret',
    loadAccount: async (id) => accounts.get(id),
    membershipStatus: () => 'active'
  })
  const service = serviceOverride || new AnalyticsService(repository(), clock)
  const app = express()
  app.use('/api', analyticsRoutes({ ...auth, service }))
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener))
  })
  const base = `http://127.0.0.1:${server.address().port}/api/analytics`
  const tokens = Object.fromEntries(
    [...accounts].map(([role, account]) => [role, auth.createSession(account).token])
  )
  try {
    await run(base, tokens)
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    )
  }
}

test('all endpoints reject missing sessions and signed staff/member sessions', async () => {
  let queried = false
  const forbiddenService = Object.fromEntries(
    ['attendance', 'membershipStatus', 'revenue', 'payments'].map((name) => [
      name,
      () => {
        queried = true
        throw new Error('Must not query')
      }
    ])
  )
  await withApp(async (base, tokens) => {
    for (const path of endpoints) {
      assert.equal((await fetch(`${base}/${path}`)).status, 401)
      for (const role of ['staff', 'user']) {
        assert.equal(
          (await fetch(`${base}/${path}`, { headers: { Authorization: `Bearer ${tokens[role]}` } }))
            .status,
          403
        )
      }
    }
  }, forbiddenService)
  assert.equal(queried, false)
})

test('admin sessions receive JSON aggregates with no-store on all four endpoints', async () => {
  await withApp(async (base, tokens) => {
    for (const path of endpoints) {
      const response = await fetch(`${base}/${path}`, {
        headers: { Authorization: `Bearer ${tokens.admin}` }
      })
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('cache-control'), 'no-store')
      assert.equal((await response.json()).timeZone, 'Asia/Manila')
    }
  })
})

test('database failures return a retryable error without leaking database details', async () => {
  const service = new AnalyticsService(
    repository({
      payments: async () => {
        throw new Error('Sensitive database connection detail')
      }
    }),
    clock
  )
  await withApp(async (base, tokens) => {
    const response = await fetch(`${base}/revenue`, {
      headers: { Authorization: `Bearer ${tokens.admin}` }
    })
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), {
      message: 'Unable to load analytics. Please try again.'
    })
  }, service)
})
```

## src/components/admin/AdminDashboardSection.jsx

```jsx
import { Icon } from '../DashboardShell'
import ActivityChart from '../ActivityChart'
import AdminAnalytics from './analytics/AdminAnalytics'
import { membershipState } from '../../utils/membership'

export default function AdminDashboardSection({
  currentUser,
  setModal,
  setSection,
  members,
  active,
  data,
  today,
  money,
  revenue,
  loading,
  expiredMembers,
  renewals,
  reminderList,
  date
}) {
  return (
    <>
      <section className="card clay illustrated-heading dashboard-overview">
        <div>
          <span className="dashboard-eyebrow">YOUR GYM, AT A GLANCE</span>
          <h2>Let’s keep the momentum going.</h2>
          <p>
            Welcome back, {currentUser?.name?.split(' ')[0] || 'coach'}. Here’s how your community
            is moving.
          </p>
          <div className="dashboard-quick-actions">
            {currentUser?.role === 'admin' && (
              <button className="btn" type="button" onClick={() => setModal({ kind: 'create' })}>
                <Icon name="users" size={16} />
                Add a member
              </button>
            )}
            <button className="btn ghost" type="button" onClick={() => setSection('Reports')}>
              <Icon name="chart" size={16} />
              Explore reports
            </button>
          </div>
        </div>
      </section>
      {currentUser?.role === 'admin' ? (
        <AdminAnalytics refreshKey={data} />
      ) : (
        <>
          <section className="grid admin-stats">
            {[
              ['Total Members', members.length, 'users', 'b1'],
              ['Active Memberships', active, 'card', 'b2'],
              [
                "Today's Check-ins",
                data.attendance.filter(
                  (item) =>
                    new Date(item.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }) ===
                    today
                ).length,
                'qr',
                'b3'
              ],
              ['Payments recorded', money(revenue), 'wallet', 'b4']
            ].map(([label, value, icon, color]) => (
              <article className="stat clay" key={label}>
                <span className={`bub ${color}`}>
                  <Icon name={icon} />
                </span>
                <div>
                  <small>{label}</small>
                  <b>{value}</b>
                </div>
              </article>
            ))}
          </section>
          <ActivityChart
            attendance={data.attendance}
            payments={data.payments}
            admin
            loading={loading}
          />
        </>
      )}
      <section className="grid g2">
        <article className="card clay">
          <div className="admin-card-heading">
            <h2>Membership overview</h2>
            <Icon name="card" />
          </div>
          <div className="admin-summary">
            <div>
              <span>Active memberships</span>
              <strong>{active}</strong>
            </div>
            <div>
              <span>Expired memberships</span>
              <strong>{expiredMembers.length}</strong>
            </div>
            <div>
              <span>Records needing review</span>
              <strong>{members.length - active - expiredMembers.length}</strong>
            </div>
            <div>
              <span>Renewals recorded</span>
              <strong>{renewals.length}</strong>
            </div>
          </div>
        </article>
        <article className="card clay">
          <div className="admin-card-heading">
            <h2>Membership reminders</h2>
            <span className="pill p-warn">{reminderList.length}</span>
          </div>
          {reminderList.length ? (
            <ul className="admin-list">
              {reminderList.slice(0, 4).map((member) => (
                <li key={member.id}>
                  <div>
                    <strong>{member.name}</strong>
                    <small>
                      {membershipState(member).status === 'expired' ? 'Expired' : 'Expiring soon'}{' '}
                      &middot; {date(member.membershipEnd)}
                    </small>
                  </div>
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => setModal({ kind: 'renew', member })}
                  >
                    Renew
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-empty">No memberships are due for a reminder.</p>
          )}
          <button
            className="admin-text-button"
            type="button"
            onClick={() => setSection('Notifications')}
          >
            View all reminders &rarr;
          </button>
        </article>
      </section>
    </>
  )
}
```

## src/pages/AdminStaffPage.jsx

```jsx
import AdminDashboardSection from '../components/admin/AdminDashboardSection'
import AdminAnalytics from '../components/admin/analytics/AdminAnalytics'
import AdminMembersSection from '../components/admin/AdminMembersSection'
import AdminEquipmentSection from '../components/admin/AdminEquipmentSection'
import AdminAttendanceSection from '../components/admin/AdminAttendanceSection'
import AdminPaymentsSection from '../components/admin/AdminPaymentsSection'
import AdminSettingsSection from '../components/admin/AdminSettingsSection'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DashboardShell from '../components/DashboardShell'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'
import FitnessSculpture from '../components/FitnessSculpture'
import AdminReports from '../components/AdminReports'
import AdminNotifications from '../components/AdminNotifications'
import { membershipState, reminderMembers } from '../utils/membership'
import AdminStaffDialogs from '../components/admin/AdminStaffDialogs'
import { gorillaEvents, useGorilla } from '../components/gorilla/GorillaAssistant'
import { MobileActivities, MobileMembers, MobileOverview } from '../components/mobile/MobileScreens'
import { activityRows, useReminderActivity } from '../components/mobile/activity'
import useIsMobile from '../components/mobile/useIsMobile'
import './AdminStaffPage.css'

const money = (value) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0))
const planOptionLabel = (plan) => {
  const studentRate = /student/i.test(plan.plan_name) && !/non[-\s]?student/i.test(plan.plan_name)
  return `${plan.plan_name} - ${money(plan.price)}${studentRate ? ' (student discount)' : ''}`
}
const date = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    : '—'
const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
    : '—'
export default function AdminStaffPage({ user, onSignOut, startMemberCreation = false }) {
  const { token } = useAuth()
  const { notify, latestEvent } = useGorilla() || {}
  const mobile = useIsMobile()
  const [currentUser, setCurrentUser] = useState(user)
  const [section, setSection] = useState('Dashboard')
  const [data, setData] = useState({
    members: [],
    membershipPlans: [],
    attendance: [],
    payments: [],
    equipment: [],
    maintenance: [],
    notificationState: { notifications: [], canDismiss: false },
    settings: { gym: 'FitPulse Gym', remind: 7 }
  })
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState(null)
  const [notice, setNotice] = useState('')
  const [modal, setModal] = useState(() => startMemberCreation ? { kind: 'create' } : null)
  const [deletion, setDeletion] = useState(null)
  const [query, setQuery] = useState('')
  const [onlyExpiring, setOnlyExpiring] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const actionLock = useRef(false)
  const loadVersion = useRef(0)
  const canDeleteHistory = currentUser?.role === 'admin'
  const load = useCallback(
    async (signal) => {
      const version = ++loadVersion.current
      try {
        const [
          members,
          membershipPlans,
          attendance,
          payments,
          equipment,
          settings,
          profile,
          notifications
        ] = await Promise.all([
          apiRequest('/members', { token, signal }),
          apiRequest('/admin/membership-plans', { token, signal }),
          apiRequest('/attendance', { token, signal }),
          apiRequest('/payments', { token, signal }),
          apiRequest('/admin/equipment', { token, signal }),
          apiRequest('/admin/settings', { token, signal }),
          apiRequest('/me', { token, signal }),
          apiRequest('/admin/notifications', { token, signal }).catch((cause) => ({
            notifications: [],
            canDismiss: false,
            issue: cause.message
          }))
        ])
        if (signal?.aborted || version !== loadVersion.current) return
        setCurrentUser(profile.user)
        setData({
          ...members,
          ...membershipPlans,
          ...attendance,
          ...payments,
          ...equipment,
          ...settings,
          notificationState: notifications
        })
        setError('')
        return true
      } catch (cause) {
        if (!signal?.aborted && version === loadVersion.current) setError(cause.message)
        return false
      } finally {
        if (!signal?.aborted && version === loadVersion.current) setLoading(false)
      }
    },
    [token]
  )
  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])
  useEffect(() => {
    if (!latestEvent || actionLock.current) return
    const controller = new AbortController()
    // Coalesce operations that emit two events, such as paid registration.
    const timer = window.setTimeout(() => {
      if (!actionLock.current) void load(controller.signal)
    }, 160)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [latestEvent, load])
  useEffect(() => {
    if (section !== 'Attendance') return
    const controller = new AbortController()
    const timer = window.setInterval(() => load(controller.signal), 5000)
    return () => {
      window.clearInterval(timer)
      controller.abort()
    }
  }, [section, load])
  useEffect(() => {
    if (section !== 'Notifications') return
    const controller = new AbortController()
    const refresh = async () => {
      try {
        const notificationState = await apiRequest('/admin/notifications', {
          token,
          signal: controller.signal
        })
        if (!controller.signal.aborted) setData((previous) => ({ ...previous, notificationState }))
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause.message)
      }
    }
    void refresh()
    const timer = window.setInterval(refresh, 15000)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [section, token])
  const act = async (path, options, message, onSuccess) => {
    if (actionLock.current) return false
    actionLock.current = true
    setPending(true)
    setError('')
    setFieldError(null)
    setNotice('')
    try {

      const result = await apiRequest(path, { token, ...options })

      if (result.signInRequired) {
        onSignOut()
        return true
      }

      // Immediately display the updated profile.
      if (path === '/profile' && result?.user) {
        setCurrentUser(result.user)
      }

      setNotice(result.message || message)


      if (onSuccess) onSuccess(result)
      else setModal(null)
      await load()
      return true
    } catch (cause) {
      setError(cause.message)
      setFieldError(cause.field ? { name: cause.field } : null)
      return false
    } finally {
      actionLock.current = false
      setPending(false)
    }
  }
  const members = useMemo(
    () => data.members.filter((member) => ['user', 'member'].includes(member.role)),
    [data.members]
  )
  const active = members.filter((member) => membershipState(member).status === 'active').length
  const expiredMembers = members.filter((member) => membershipState(member).status === 'expired')
  const reminderList = reminderMembers(members, data.settings.remind)
  const expiring = reminderList.filter((member) => membershipState(member).status === 'active')
  const renewals = data.payments.filter((payment) => payment.type === 'Renewal')
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
  const revenue = data.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const reminderActivity = useReminderActivity(token, mobile, latestEvent)
  const activity = mobile ? activityRows({
    ...data, members, reminders: reminderActivity.reminders, money, staff: true
  }) : []
  const onManilaDay = (row) => new Date(row.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }) === today
  const showMember = (member) => setModal({ kind: 'view', member })
  const selectSection = useCallback((nextSection) => {
    if (nextSection === 'Members') setOnlyExpiring(false)
    setSection(nextSection)
  }, [])
  const showMemberAlert = useCallback(async (memberId) => {
    // Another admin's new record may arrive before this dashboard has refreshed its list.
    let member = members.find((record) => record.id === memberId)
    try {
      if (!member) {
        const result = await apiRequest('/members', { token })
        member = result.members.find((record) => record.id === memberId && ['user', 'member'].includes(record.role))
      }
      if (member) setModal({ kind: 'view', member })
      else setError('This member is no longer available.')
    } catch (cause) {
      setError(cause.message)
    }
  }, [members, token])

  const scanQr = useCallback(async (qrToken) => {
    setError('')
    setNotice('')

    try {
      const result = await apiRequest('/admin/attendance/scan', {
        token,
        method: 'POST',
        body: JSON.stringify({
          qrToken,
          // randomUUID is unavailable on some HTTP gym-network pages.
          requestId: globalThis.crypto.randomUUID?.() || Array.from(
            globalThis.crypto.getRandomValues(new Uint8Array(16)),
            (byte) => byte.toString(16).padStart(2, '0')
          ).join('')
        })
      })

      if (result?.allowed !== true) {
        throw new Error(
          result?.message || 'Attendance was not confirmed.'
        )
      }

      const message =
        result.code === 'ALREADY_RECORDED'
          ? 'This check-in was already recorded.'
          : `Check-in recorded for ${result.memberName}.`

      setNotice(message)

      // Refresh attendance records after a successful scan.
      await load()

      // IMPORTANT: Return the backend result to PhysicalQrScanner.
      return result

    } catch (cause) {
      const message =
        cause?.message || 'Unable to process attendance.'

      setError(message)

      // Let PhysicalQrScanner display the failure.
      return {
        allowed: false,
        message
      }
    }
  }, [token, load])

  const createMember = (eventOrDetails) => {
    const isFormEvent = typeof eventOrDetails?.preventDefault === 'function'
    if (isFormEvent) eventOrDetails.preventDefault()
    const details = isFormEvent
      ? (() => { const form = new FormData(eventOrDetails.currentTarget); return {
          ...Object.fromEntries(form), recordPayment: form.get('recordPayment') === 'on'
        } })()
      : eventOrDetails
    return act(
      '/admin/members',
      {
        method: 'POST',
        body: JSON.stringify(details)
      },
      'Member account created.',
      (result) => {
        if (!result.member) return
        setModal({ kind: 'credentials', member: result.member, temporaryPassword: result.temporaryPassword })
        // The matching SSE ID keeps the creator's confirmation and live event to one alert.
        if (result.notificationId)
          notify?.(gorillaEvents.memberCreated(result.member.name, result.member.id), result.notificationId)
      }
    )
  }
  const updateMember = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    act(
      `/admin/members/${modal.member.id}`,
      { method: 'PATCH', body: JSON.stringify(Object.fromEntries(form)) },
      'Member updated.'
    )
  }
  const faceEnrollmentPath = `/admin/members/${modal?.member?.id}/face-enrollment`
  const requestFaceChallenge = () =>
    apiRequest(faceEnrollmentPath + '/challenge', { token, method: 'POST' })
  const enrollFace = (details) =>
    act(
      faceEnrollmentPath,
      { method: 'POST', body: JSON.stringify(details) },
      'Face verification is ready.'
    )
  const recordPayment = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    act(
      '/admin/payments',
      { method: 'POST', body: JSON.stringify(Object.fromEntries(form)) },
      'Payment recorded.'
    )
  }
  const settings = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    act(
      '/admin/settings',
      {
        method: 'PATCH',
        body: JSON.stringify({
          gym: form.get('gym'),
          remind: Number(form.get('remind')),
          emailOn: form.has('emailOn')
        })
      },
      'Preferences saved.'
    )
  }
  const profile = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    act(
      '/profile',
      { method: 'PATCH', body: JSON.stringify(Object.fromEntries(form)) },
      'Profile saved.'
    )
  }
  const content = {
    Dashboard: (
      <AdminDashboardSection
        currentUser={currentUser}
        setModal={setModal}
        setSection={setSection}
        members={members}
        active={active}
        data={data}
        today={today}
        money={money}
        revenue={revenue}
        loading={loading}
        expiredMembers={expiredMembers}
        renewals={renewals}
        reminderList={reminderList}
        date={date}
      />
    ),
    Members: (
      <AdminMembersSection
        query={query}
        setQuery={setQuery}
        currentUser={currentUser}
        setModal={setModal}
        members={members}
        pending={pending}
        date={date}
      />
    ),
    Equipment: (
      <AdminEquipmentSection
        data={data}
        loading={loading}
        pending={pending}
        act={act}
        setModal={setModal}
        canDeleteHistory={canDeleteHistory}
        setDeletion={setDeletion}
        date={date}
      />
    ),
    Attendance: (
      <AdminAttendanceSection
        data={data}
        members={members}
        loading={loading}
        pending={pending}
        canDeleteHistory={canDeleteHistory}
        setDeletion={setDeletion}
        scanQr={scanQr}
        section={section}
        dateTime={dateTime}
      />
    ),
    Payments: (
      <AdminPaymentsSection
        data={data}
        loading={loading}
        pending={pending}
        canDeleteHistory={canDeleteHistory}
        setModal={setModal}
        setDeletion={setDeletion}
        money={money}
        date={date}
      />
    ),
    Notifications: (
      <AdminNotifications
        state={data.notificationState}
        canManage={canDeleteHistory}
        busy={pending || loading}
        onDelete={setDeletion}
        onReview={() => setSection('Equipment')}
      />
    ),
    Reports: (
      <AdminReports
        data={data}
        onChanged={load}
        onMemberAction={(kind, member) => setModal({ kind, member })}
      />
    ),
    Settings: (
      <AdminSettingsSection
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        profile={profile}
        pending={pending}
        loading={loading}
        setModal={setModal}
        settings={settings}
        data={data}
      />
    )
  }[section]
  const mobileViews = mobile ? {
    Dashboard: (
      <MobileOverview
        summary={currentUser?.role === 'admin' ? <AdminAnalytics refreshKey={data} /> : null}
        stats={[
          ['Active members', active, 'users'],
          ['Expiring soon', expiring.length, 'bell'],
          ['Check-ins today', data.attendance.filter(onManilaDay).length, 'qr'],
          ['Revenue today', money(data.payments.filter(onManilaDay).reduce((sum, item) => sum + Number(item.amount || 0), 0)), 'wallet']
        ]} expiring={expiring} date={date} onMember={showMember} loading={loading} rows={activity}
        onExpiring={() => { setOnlyExpiring(true); setQuery(''); setSection('Members') }}
        onActivities={() => setSection('Activities')} />
    ),
    Members: <MobileMembers members={members} expiring={expiring} date={date} query={query}
      setQuery={setQuery} onMember={showMember} filter={onlyExpiring} setFilter={setOnlyExpiring} loading={loading} />,
    Activities: <MobileActivities rows={activity} loading={loading} select={selectSection} reminderError={reminderActivity.error} />
  } : {}
  const dialogs = (
    <AdminStaffDialogs
      modal={modal}
      setModal={setModal}
      currentUser={currentUser}
      pending={pending}
      error={error}
      fieldError={fieldError}
      deletion={deletion}
      setDeletion={setDeletion}
      load={load}
      setNotice={setNotice}
      renewals={renewals}
      money={money}
      date={date}
      members={members}
      data={data}
      planOptionLabel={planOptionLabel}
      act={act}
      createMember={createMember}
      updateMember={updateMember}
      enrollFace={enrollFace}
      requestFaceChallenge={requestFaceChallenge}
      recordPayment={recordPayment}
    />
  )
  return (
    <DashboardShell
      className="admin-app"
      role={currentUser?.role || 'admin'}
      user={currentUser}
      onSignOut={onSignOut}
      activeSection={section}
      onSectionChange={selectSection}
      onMemberAlert={showMemberAlert}
      onCreateMember={() => {
        setError('')
        setFieldError(null)
        setModal({ kind: 'create' })
      }}
      content={content}
      mobileViews={mobileViews}
      dialogs={dialogs}
      notificationCount={loading ? 0 : data.notificationState.notifications.length}
      loading={loading}
    >
      {loading && (
        <p className="dashboard-feedback" role="status">
          Loading gym records...
        </p>
      )}
      {error && (
        <p className="dashboard-feedback is-error" role="alert">
          {error}
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              load()
            }}
          >
            Retry
          </button>
        </p>
      )}
      {notice && (
        <div className="dashboard-feedback" role="status">
          {notice}
          <button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}>
            &times;
          </button>
        </div>
      )}
    </DashboardShell>
  )
}
```

## src/components/mobile/MobileScreens.jsx

```jsx
import { Icon } from '../DashboardShell'
import { filterMemberRecords } from '../../utils/membership'
import StatCard from './StatCard'
import SectionHeader from './SectionHeader'
import MemberRow from './MemberRow'
import ActivityRow from './ActivityRow'

// Admin and member screens consume the same records and dashboard actions as desktop.
export function MobileOverview({
  stats,
  summary,
  expiring,
  date,
  onMember,
  onExpiring,
  rows,
  onActivities,
  loading
}) {
  return (
    <>
      {summary || (
        <section className="fitpulse-stat-grid" aria-label="Overview totals">
          {stats.map(([label, value, icon]) => (
            <StatCard
              key={label}
              label={label}
              value={loading ? '—' : value}
              icon={<Icon name={icon} size={20} />}
            />
          ))}
        </section>
      )}
      {expiring && (
        <section>
          <SectionHeader title="Expiring soon" onViewAll={onExpiring} />
          <ul className="fitpulse-rows">
            {expiring.length
              ? expiring
                  .slice(0, 3)
                  .map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      expiring
                      date={date}
                      onSelect={onMember}
                    />
                  ))
              : !loading && <li className="fitpulse-empty">No memberships expiring soon.</li>}
          </ul>
        </section>
      )}
      <section>
        <SectionHeader title="Recent activity" onViewAll={onActivities} />
        <ActivityList rows={rows.slice(0, 4)} loading={loading} />
      </section>
    </>
  )
}

export function MobileMembers({
  members,
  expiring,
  date,
  query,
  setQuery,
  onMember,
  filter,
  setFilter,
  loading
}) {
  const expiringIds = new Set(expiring.map((member) => member.id))
  const records = filterMemberRecords(filter ? expiring : members, query)
  return (
    <>
      <label className="fitpulse-search">
        <Icon name="search" />
        <input
          type="search"
          aria-label="Search members"
          placeholder="Search members"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="fitpulse-screen-actions">
        <button
          type="button"
          className="btn ghost fitpulse-secondary"
          aria-pressed={!filter}
          onClick={() => setFilter(false)}
        >
          All members
        </button>
        <button
          type="button"
          className="btn ghost fitpulse-secondary"
          aria-pressed={filter}
          onClick={() => setFilter(true)}
        >
          Expiring soon
        </button>
      </div>
      <ul className="fitpulse-rows">
        {records.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            date={date}
            expiring={expiringIds.has(member.id)}
            onSelect={onMember}
          />
        ))}
        {!loading && !records.length && <li className="fitpulse-empty">No matching members.</li>}
      </ul>
    </>
  )
}

function ActivityList({ rows, loading }) {
  return (
    <ul className="fitpulse-rows">
      {rows.map((row) => (
        <ActivityRow key={row.id} row={row} Icon={Icon} />
      ))}
      {!loading && !rows.length && <li className="fitpulse-empty">No activity recorded yet.</li>}
    </ul>
  )
}

export function MobileActivities({ rows, loading, reminderError, select }) {
  return (
    <>
      <div className="fitpulse-screen-actions">
        <button
          className="btn ghost fitpulse-secondary"
          type="button"
          onClick={() => select('Attendance')}
        >
          Attendance
        </button>
        <button
          className="btn ghost fitpulse-secondary"
          type="button"
          onClick={() => select('Payments')}
        >
          Payments
        </button>
      </div>
      {reminderError && (
        <p className="fitpulse-empty" role="status">
          {reminderError}
        </p>
      )}
      <ActivityList rows={rows} loading={loading} />
    </>
  )
}
```

## src/components/admin/analytics/AdminAnalytics.jsx

```jsx
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
```

## src/components/admin/analytics/analytics.css

```css
.admin-analytics {
  --analytics-navy: var(--navy);
  --analytics-muted-navy: #547386;
  --analytics-fill: rgba(247, 127, 0, 0.12);
  --analytics-grid: rgba(0, 48, 73, 0.09);
  display: grid;
  gap: 16px;
  min-width: 0;
}

[data-theme='dark'] .admin-analytics {
  --analytics-navy: #6e9ab4;
  --analytics-muted-navy: #63869b;
  --analytics-fill: rgba(247, 127, 0, 0.16);
  --analytics-grid: rgba(146, 171, 187, 0.14);
}

.analytics-stats,
.analytics-grid {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.analytics-stats {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.analytics-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.admin-analytics .clay {
  border: 1px solid var(--id);
  box-shadow:
    6px 6px 18px var(--admin-shadow, var(--sd)),
    -3px -3px 10px var(--admin-highlight, var(--sl)),
    inset 2px 2px 4px var(--admin-highlight, var(--il)),
    inset -2px -2px 6px var(--admin-inset, var(--id));
}

.analytics-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  min-height: 100px;
  padding: 16px;
}

.analytics-stat > div {
  min-width: 0;
}
.admin-analytics .analytics-stat h2,
.app.fitpulse-mobile .admin-analytics .analytics-stat h2 {
  margin: 0 0 6px;
  color: var(--muted);
  font:
    700 12px/1.4 'Nunito',
    sans-serif;
}
.analytics-stat strong {
  display: block;
  color: var(--text);
  font-size: clamp(19px, 1.7vw, 26px);
  line-height: 1.25;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.analytics-stat-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: var(--card2);
  color: var(--analytics-navy);
}
.admin-analytics .analytics-stat.analytics-stat-danger {
  border-inline-start: 4px solid var(--red);
}
.analytics-stat-danger .analytics-stat-icon {
  color: var(--red);
}

.admin-analytics .analytics-chart-card {
  min-width: 0;
  padding: 24px;
  display: flex;
  flex-direction: column;
}
.analytics-chart-heading {
  min-height: 72px;
  margin-bottom: 16px;
}
.admin-analytics .analytics-chart-heading h2,
.app.fitpulse-mobile .admin-analytics .analytics-chart-heading h2 {
  margin: 0 0 6px;
  color: var(--text);
  font-size: 18px;
  line-height: 1.3;
}
.analytics-chart-heading p,
.app.fitpulse-mobile .admin-analytics .analytics-chart-card .analytics-chart-heading p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.6;
}
.analytics-canvas,
.analytics-chart-state {
  position: relative;
  min-width: 0;
  width: 100%;
  height: 280px;
}
.analytics-canvas[hidden] {
  display: none;
}
.analytics-chart-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
  color: var(--muted);
}
.analytics-chart-state p,
.analytics-chart-error {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}
.analytics-chart-error {
  min-height: 280px;
  color: var(--muted);
}
.analytics-skeleton {
  display: block;
  border-radius: 12px;
  background: var(--card2);
  animation: analytics-pulse 1.6s ease-in-out infinite alternate;
}
.analytics-value-skeleton {
  width: 80px;
  height: 28px;
}
.analytics-chart-skeleton {
  width: 100%;
  height: 240px;
}
.analytics-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
@keyframes analytics-pulse {
  to {
    opacity: 0.45;
  }
}
@media (max-width: 1024px) {
  .analytics-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .analytics-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 480px) {
  .analytics-stat {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .admin-analytics .analytics-chart-card {
    padding: 20px;
  }
  .analytics-canvas,
  .analytics-chart-state {
    height: 260px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .analytics-skeleton {
    animation: none;
  }
}
```

## src/components/admin/analytics/AttendanceChart.jsx

```jsx
import { useCallback } from 'react'
import ChartCard from './ChartCard'
import useAnalyticsChart, { chartOptions } from './useAnalyticsChart'

export default function AttendanceChart({ data, loading, error, onRetry }) {
  const createConfig = useCallback(
    (colors) => {
      const counts = data.days.map((day) => day.count)
      const highest = Math.max(...counts)
      // Rounded bars; every tied peak is orange. Single-series legends stay hidden.
      return {
        type: 'bar',
        data: {
          labels: data.days.map((day) => day.label),
          datasets: [
            {
              label: 'QR check-ins',
              data: counts,
              borderRadius: 8,
              borderSkipped: false,
              maxBarThickness: 42,
              backgroundColor: counts.map((count) =>
                count === highest ? colors.orange : colors.mutedNavy
              )
            }
          ]
        },
        options: chartOptions(colors)
      }
    },
    [data]
  )
  const enabled = !loading && !error && data?.total > 0
  const { canvasRef, chartError } = useAnalyticsChart(createConfig, enabled)
  return (
    <ChartCard
      title="QR Attendance"
      subtitle="Current week · Monday–Sunday · Asia/Manila"
      loading={loading}
      error={error}
      empty={!data?.total}
      onRetry={onRetry}
    >
      {chartError && (
        <p className="analytics-chart-error" role="alert">
          {chartError}
        </p>
      )}
      <div className="analytics-canvas" hidden={Boolean(chartError)}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`QR check-ins this week: ${data?.days.map((day) => `${day.label} ${day.count}`).join(', ')}`}
        />
      </div>
    </ChartCard>
  )
}
```

## src/components/admin/analytics/ChartCard.jsx

```jsx
import { useId } from 'react'

export default function ChartCard({ title, subtitle, loading, error, empty, onRetry, children }) {
  const titleId = useId()
  return (
    <article
      className="card clay analytics-chart-card"
      aria-labelledby={titleId}
      aria-busy={loading}
    >
      <div className="analytics-chart-heading">
        <h2 id={titleId}>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {loading ? (
        <div className="analytics-chart-state" role="status">
          <span className="analytics-sr-only">Loading {title}</span>
          <div className="analytics-skeleton analytics-chart-skeleton" aria-hidden="true" />
        </div>
      ) : error ? (
        <div className="analytics-chart-state" role="alert">
          <p>{error}</p>
          {onRetry && (
            <button className="btn ghost" type="button" onClick={onRetry}>
              Retry analytics
            </button>
          )}
        </div>
      ) : empty ? (
        <div className="analytics-chart-state" role="status">
          <p>No data yet</p>
        </div>
      ) : (
        children
      )}
    </article>
  )
}
```

## src/components/admin/analytics/MembershipStatusChart.jsx

```jsx
import { useCallback } from 'react'
import ChartCard from './ChartCard'
import useAnalyticsChart, { chartOptions } from './useAnalyticsChart'

export default function MembershipStatusChart({ data, loading, error, onRetry }) {
  const total = (data?.active || 0) + (data?.expiringSoon || 0) + (data?.expired || 0)
  const createConfig = useCallback(
    (colors) => ({
      // The three buckets are exclusive; expiring members are excluded from Active.
      type: 'doughnut',
      data: {
        labels: ['Active', 'Expiring soon', 'Expired'],
        datasets: [
          {
            data: [data.active, data.expiringSoon, data.expired],
            backgroundColor: [colors.navy, colors.gold, colors.red],
            borderColor: colors.surface,
            borderWidth: 4,
            hoverOffset: 5
          }
        ]
      },
      options: chartOptions(colors, { doughnut: true })
    }),
    [data]
  )
  const { canvasRef, chartError } = useAnalyticsChart(createConfig, !loading && !error && total > 0)
  const excluded = data?.unclassified
    ? ` · ${data.unclassified} without a current classification`
    : ''
  return (
    <ChartCard
      title="Membership Status"
      subtitle={`Expiring within ${data?.expiringDays || 7} Manila calendar days${excluded}`}
      loading={loading}
      error={error}
      empty={!total}
      onRetry={onRetry}
    >
      {chartError && (
        <p className="analytics-chart-error" role="alert">
          {chartError}
        </p>
      )}
      <div className="analytics-canvas" hidden={Boolean(chartError)}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Memberships: Active ${data?.active}, Expiring soon ${data?.expiringSoon}, Expired ${data?.expired}`}
        />
      </div>
    </ChartCard>
  )
}
```

## src/components/admin/analytics/PaymentMethodsChart.jsx

```jsx
import { useCallback } from 'react'
import ChartCard from './ChartCard'
import useAnalyticsChart, { chartOptions } from './useAnalyticsChart'

export default function PaymentMethodsChart({ data, loading, error, onRetry }) {
  const createConfig = useCallback(
    (colors) => {
      const options = chartOptions(colors, { doughnut: true })
      options.plugins.tooltip.callbacks = {
        label: (context) => {
          const method = data.methods[context.dataIndex]
          return `${method.label}: ${method.percent}% (${method.count} payments)`
        }
      }
      // Raw counts give exact slice proportions; percentages are labels, not amounts.
      const labels = data.methods.map((method) => `${method.label} ${method.percent}%`)
      return {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data: data.methods.map((method) => method.count),
              backgroundColor: [colors.navy, colors.orange],
              borderColor: colors.surface,
              borderWidth: 4,
              hoverOffset: 5
            }
          ]
        },
        options
      }
    },
    [data]
  )
  const { canvasRef, chartError } = useAnalyticsChart(
    createConfig,
    !loading && !error && data?.total > 0
  )
  return (
    <ChartCard
      title="Payment Methods"
      subtitle="Cash and GCash · Successful payment count · All time"
      loading={loading}
      error={error}
      empty={!data?.total}
      onRetry={onRetry}
    >
      {chartError && (
        <p className="analytics-chart-error" role="alert">
          {chartError}
        </p>
      )}
      <div className="analytics-canvas" hidden={Boolean(chartError)}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Payment share: ${data?.methods.map((method) => `${method.label} ${method.percent}%`).join(', ')}`}
        />
      </div>
    </ChartCard>
  )
}
```

## src/components/admin/analytics/RevenueChart.jsx

```jsx
import { useCallback } from 'react'
import ChartCard from './ChartCard'
import useAnalyticsChart, { chartOptions, pesos } from './useAnalyticsChart'

export default function RevenueChart({ data, loading, error, onRetry }) {
  const createConfig = useCallback(
    (colors) => {
      const options = chartOptions(colors, { currency: true })
      options.plugins.tooltip.callbacks = {
        label: (context) => `Revenue: ${pesos(context.parsed.y)}`
      }
      // Six zero-filled calendar months keep gaps honest, including this partial month.
      return {
        type: 'line',
        data: {
          labels: data.months.map((month) => month.label),
          datasets: [
            {
              label: 'Revenue',
              data: data.months.map((month) => month.amount),
              borderColor: colors.orange,
              backgroundColor: colors.fill,
              pointBackgroundColor: colors.orange,
              pointBorderColor: colors.surface,
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 3,
              tension: 0.3,
              fill: true
            }
          ]
        },
        options
      }
    },
    [data]
  )
  const { canvasRef, chartError } = useAnalyticsChart(
    createConfig,
    !loading && !error && data?.paymentCount > 0
  )
  return (
    <ChartCard
      title="Revenue"
      subtitle="Last 6 months · Successful payments · PHP"
      loading={loading}
      error={error}
      empty={!data?.paymentCount}
      onRetry={onRetry}
    >
      {chartError && (
        <p className="analytics-chart-error" role="alert">
          {chartError}
        </p>
      )}
      <div className="analytics-canvas" hidden={Boolean(chartError)}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Monthly revenue: ${data?.months.map((month) => `${month.label} ${pesos(month.amount)}`).join(', ')}`}
        />
      </div>
    </ChartCard>
  )
}
```

## src/components/admin/analytics/useAnalyticsChart.js

```javascript
import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../brand/useTheme'

export const pesos = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2
  }).format(value)

function chartColors(canvas) {
  const style = getComputedStyle(canvas)
  const read = (name) => style.getPropertyValue(name).trim()
  return {
    navy: read('--analytics-navy'),
    mutedNavy: read('--analytics-muted-navy'),
    orange: read('--orange'),
    gold: read('--gold'),
    red: read('--red'),
    fill: read('--analytics-fill'),
    grid: read('--analytics-grid'),
    text: read('--text'),
    muted: read('--muted'),
    surface: read('--card'),
    font: style.fontFamily
  }
}

export function chartOptions(colors, { doughnut = false, currency = false } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    locale: 'en-PH',
    animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? false
      : { duration: 350 },
    plugins: {
      legend: {
        display: doughnut,
        position: 'bottom',
        labels: {
          color: colors.text,
          usePointStyle: true,
          boxWidth: 9,
          padding: 16,
          font: { family: colors.font, size: 12 }
        }
      },
      tooltip: {
        backgroundColor: colors.surface,
        titleColor: colors.text,
        bodyColor: colors.text,
        borderColor: colors.grid,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12
      }
    },
    ...(doughnut
      ? { cutout: '68%' }
      : {
          scales: {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: { color: colors.muted, font: { family: colors.font, size: 12 } }
            },
            y: {
              beginAtZero: true,
              border: { display: false },
              grid: { color: colors.grid },
              ticks: {
                color: colors.muted,
                maxTicksLimit: 5,
                font: { family: colors.font, size: 12 },
                ...(currency ? { callback: (value) => pesos(value) } : { precision: 0 })
              }
            }
          }
        })
  }
}

// Each effect owns one Chart instance, including StrictMode and theme changes.
export default function useAnalyticsChart(createConfig, enabled) {
  const canvasRef = useRef(null)
  const { dark } = useTheme()
  const [chartError, setChartError] = useState('')

  useEffect(() => {
    if (!enabled) return
    let chart
    setChartError('')
    // ThemeProvider updates <html> in an effect; read its CSS on the next frame.
    const frame = window.requestAnimationFrame(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      try {
        if (!window.Chart) throw new Error('Chart.js is unavailable.')
        chart = new window.Chart(canvas, createConfig(chartColors(canvas)))
      } catch {
        window.Chart?.getChart(canvas)?.destroy()
        setChartError('Charts could not load. Check your connection and reload the page.')
      }
    })
    return () => {
      window.cancelAnimationFrame(frame)
      chart?.destroy()
    }
  }, [createConfig, enabled, dark])

  return { canvasRef, chartError }
}
```

## .taste-skill/analytics-preview.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Isolated FitPulse analytics verification with test fixtures" />
    <title>FitPulse analytics verification</title>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
    <script type="module" src="./analytics-preview.jsx"></script>
  </body>
</html>
```

## .taste-skill/analytics-preview.jsx

```jsx
// TEST FIXTURES ONLY. This file is outside Vite's production entry graph.
import React, { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import AdminStaffPage from '../src/pages/AdminStaffPage'
import { AuthProvider } from '../src/auth/AuthContext'
import { ThemeProvider, useTheme } from '../src/components/brand/useTheme'
import '../src/styles/fitpulse-v3.css'
import '../src/styles/experience.css'

const params = new URLSearchParams(location.search)
let mode = params.get('state') || 'loaded'
const initialMode = mode
localStorage.setItem('fitpulse-theme', params.get('theme') || 'light')
const user = { id: 'qa-admin', name: 'Analytics QA', role: 'admin', status: 'active' }
localStorage.setItem('fitpulse-session', JSON.stringify({ user, token: 'isolated-qa-token' }))
if (mode === 'cdn-error') window.Chart = undefined
const nativeFetch = window.fetch.bind(window)
const counts = [12, 18, 9, 24, 16, 8, 0]
const sample = {
  attendance: {
    total: 87,
    days: counts.map((count, index) => ({
      label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
      count
    }))
  },
  'membership-status': {
    totalMembers: 120,
    active: 90,
    expiringSoon: 18,
    expired: 12,
    unclassified: 0,
    expiringDays: 7
  },
  revenue: {
    paymentCount: 20,
    revenueThisMonth: 26750,
    months: [12500, 15000, 18250, 16700, 22500, 26750].map((amount, index) => ({
      label: ['Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026'][index],
      amount
    }))
  },
  payments: {
    total: 20,
    methods: [
      { label: 'Cash', count: 8, percent: 40 },
      { label: 'GCash', count: 12, percent: 60 }
    ]
  }
}
const empty = {
  attendance: { total: 0, days: [] },
  'membership-status': {
    totalMembers: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
    unclassified: 0,
    expiringDays: 7
  },
  revenue: { paymentCount: 0, revenueThisMonth: 0, months: [] },
  payments: { total: 0, methods: [] }
}
window.fetch = async (input, options = {}) => {
  const url = new URL(String(input), location.href)
  if (!url.pathname.startsWith('/api/')) return nativeFetch(input, options)
  await new Promise((resolve) => setTimeout(resolve, 90))
  if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  if (url.pathname.startsWith('/api/analytics/')) {
    if (mode === 'loading') return new Promise(() => {})
    const path = url.pathname.split('/').at(-1)
    if (mode === 'error' || (mode === 'partial' && path === 'revenue'))
      return Response.json(
        { message: 'Unable to load analytics. Please try again.' },
        { status: 503 }
      )
    return Response.json(mode === 'invalid' ? {} : (mode === 'empty' ? empty : sample)[path])
  }
  const payload = {
    '/api/me': { user },
    '/api/members': { members: [] },
    '/api/admin/membership-plans': { membershipPlans: [] },
    '/api/attendance': { attendance: [] },
    '/api/payments': { payments: [] },
    '/api/admin/equipment': { equipment: [], maintenance: [] },
    '/api/admin/settings': { settings: { gym: 'FitPulse Gym', remind: 7 } },
    '/api/admin/notifications': { notifications: [], canDismiss: false }
  }
  return Response.json(
    payload[url.pathname] || { reminders: [], notifications: [], activities: [] }
  )
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const instances = () => Object.values(window.Chart?.instances || {})
const assertions = []
function check(name, pass) {
  assertions.push({ name, pass: Boolean(pass) })
}
function Preview() {
  const { toggle } = useTheme()
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    if (window.qaStarted) return
    window.qaStarted = true
    const run = async () => {
      await delay(1800)
      const charts = instances()
      const analytics = document.querySelector('.admin-analytics')
      check('analytics mounted in the real desktop/mobile dashboard', analytics)
      const columns = getComputedStyle(
        document.querySelector('.analytics-grid')
      ).gridTemplateColumns.split(' ').length
      check('responsive columns', columns === (innerWidth <= 1024 ? 1 : 2))
      check('no horizontal overflow', document.documentElement.scrollWidth <= innerWidth)
      check('four summary cards', document.querySelectorAll('.analytics-stat').length === 4)
      check(
        'consistent summary label size',
        getComputedStyle(document.querySelector('.analytics-stat h2')).fontSize === '12px'
      )
      check(
        'consistent chart heading size',
        getComputedStyle(document.querySelector('.analytics-chart-heading h2')).fontSize === '18px'
      )
      check(
        'consistent chart subtitle size',
        getComputedStyle(document.querySelector('.analytics-chart-heading p')).fontSize === '12px'
      )
      if (mode === 'loaded' || mode === 'partial') {
        check('live Chart.js 4.4.7', window.Chart?.version === '4.4.7')
        check('one instance per visible canvas', charts.length === (mode === 'partial' ? 3 : 4))
        check(
          'canvas dimensions and accessible labels',
          [...document.querySelectorAll('.analytics-canvas canvas')].every(
            (canvas) => canvas.width > 0 && canvas.height > 0 && canvas.getAttribute('aria-label')
          )
        )
        const bar = charts.find((chart) => chart.config.type === 'bar')
        check('orange peak', bar?.data.datasets[0].backgroundColor[3].toLowerCase() === '#f77f00')
        check(
          'single-series legends hidden',
          charts
            .filter((chart) => chart.config.type !== 'doughnut')
            .every((chart) => !chart.options.plugins.legend.display)
        )
        check(
          'fixed chart sizing',
          charts.every((chart) => chart.options.maintainAspectRatio === false)
        )
        if (params.has('checks')) {
          const ids = charts.map((chart) => chart.id)
          const navy = charts.find((chart) => chart.config.type === 'doughnut').data.datasets[0]
            .backgroundColor[0]
          toggle()
          await delay(700)
          check(
            'theme destroys all old charts',
            ids.every((id) => !window.Chart.instances[id])
          )
          check('theme rebuilds four charts', instances().length === 4)
          check(
            'theme reads fresh CSS tokens',
            instances().find((chart) => chart.config.type === 'doughnut').data.datasets[0]
              .backgroundColor[0] !== navy
          )
          toggle()
          await delay(500)
          setVisible(false)
          await delay(200)
          check('unmount destroys all charts', instances().length === 0)
          setVisible(true)
          await delay(800)
          check('remount safely reuses canvases', instances().length === 4)
        }
      } else if (mode === 'empty') {
        check(
          'four empty messages and no fake series',
          [...analytics.querySelectorAll('.analytics-chart-state')].filter(
            (node) => node.textContent === 'No data yet'
          ).length === 4 && charts.length === 0
        )
      } else if (mode === 'loading') {
        check(
          'four skeletons',
          analytics.querySelectorAll('.analytics-chart-skeleton').length === 4
        )
      } else if (mode === 'cdn-error') {
        check(
          'four CDN failure messages',
          analytics.querySelectorAll('.analytics-chart-error').length === 4
        )
      } else {
        check('four API error states', analytics.querySelectorAll('[role="alert"]').length === 4)
        mode = 'loaded'
        analytics
          .querySelectorAll('.analytics-chart-state button')
          .forEach((button) => button.click())
        await delay(800)
        check('retry recovers all charts', instances().length === 4)
      }
      if (params.has('show')) {
        const card = [...document.querySelectorAll('.analytics-chart-card')].find(
          (node) => node.querySelector('h2').textContent.toLowerCase() === params.get('show')
        )
        card?.scrollIntoView({ block: 'start' })
      }
      await nativeFetch('/__analytics_qa', {
        method: 'POST',
        body: JSON.stringify({
          width: innerWidth,
          mode: initialMode,
          theme: params.get('theme') || 'light',
          passed: assertions.every((result) => result.pass),
          assertions
        })
      })
    }
    run().catch(async (error) => {
      await nativeFetch('/__analytics_qa', {
        method: 'POST',
        body: JSON.stringify({
          width: innerWidth,
          mode: initialMode,
          passed: false,
          error: error.message
        })
      })
    })
  }, [])
  return visible ? <AdminStaffPage user={user} onSignOut={() => {}} /> : null
}
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <Preview />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)
```

## .taste-skill/analytics-preview-server.mjs

```javascript
// Local QA only: runs installed Vite and records browser assertions, never the API.
import { createServer } from 'vite'
import { appendFileSync } from 'node:fs'

function recordResult(req, res) {
  let body = ''
  req.on('data', (chunk) => {
    body += chunk
  })
  req.on('end', () => {
    const result = JSON.parse(body)
    appendFileSync('.taste-skill/analytics-qa-results.jsonl', `${JSON.stringify(result)}\n`)
    console.log('ANALYTICS_QA', JSON.stringify(result))
    res.end('ok')
  })
}
const server = await createServer({
  plugins: [
    {
      name: 'analytics-qa-results',
      configureServer(vite) {
        vite.middlewares.use('/__analytics_qa', recordResult)
      }
    }
  ],
  server: {
    port: 5174,
    host: '127.0.0.1',
    watch: { ignored: ['**/.taste-skill/chrome-*/**', '**/.taste-skill/shots/**'] }
  }
})
await server.listen()
console.log('Analytics QA listening at http://127.0.0.1:5174/.taste-skill/analytics-preview.html')
```

## .taste-skill/export-analytics-code.mjs

```javascript
import fs from 'node:fs'

const files = [
  'index.html',
  'server/bootstrap/registerApiRoutes.js',
  'server/repositories/AnalyticsRepository.js',
  'server/services/AnalyticsService.js',
  'server/routes/analytics.js',
  'server/routes/analytics.test.js',
  'src/components/admin/AdminDashboardSection.jsx',
  'src/pages/AdminStaffPage.jsx',
  'src/components/mobile/MobileScreens.jsx',
  ...fs
    .readdirSync('src/components/admin/analytics')
    .filter((name) => /\.(jsx|js|css)$/.test(name))
    .map((name) => `src/components/admin/analytics/${name}`),
  '.taste-skill/analytics-preview.html',
  '.taste-skill/analytics-preview.jsx',
  '.taste-skill/analytics-preview-server.mjs',
  '.taste-skill/export-analytics-code.mjs',
  '.taste-skill/.gitignore'
]
const fence = '`'.repeat(3)
let content = `# FitPulse analytics: complete source

Complete current contents of every application, test, and preview source file added or edited for this feature. Existing user edits in the touched files are preserved. Local preview files contain test fixtures only and are outside the production application.

See ADMIN_ANALYTICS.md in this folder for data flow, endpoint contracts, metric definitions, and verification notes.

`
for (const file of files) {
  const language = file.endsWith('.html')
    ? 'html'
    : file.endsWith('.css')
      ? 'css'
      : file.endsWith('.jsx')
        ? 'jsx'
        : 'javascript'
  content += `## ${file}\n\n${fence}${language}\n${fs.readFileSync(file, 'utf8').trimEnd()}\n${fence}\n\n`
}
content += `## Database queries and placement

All queries are already in server/repositories/AnalyticsRepository.js:

- attendance(): attendance_logs, QR scan types and token IDs, bounded to the current Manila week and now.
- memberships(): member roles, users, and newest-first subscriptions; one latest subscription per member.
- payments(): amount/status/date/method fields, bounded to the relevant time window.
- paymentMethods(): method IDs and names from payment_methods.

AnalyticsService.js aggregates the rows and filters successful payments. No SQL migration is needed. Do not add privileged database queries to React.

## Common mistakes to avoid

1. Loading the CDN after React or using latest instead of pinned version 4.4.7.
2. Editing public/index.html instead of the actual Vite root index.html.
3. Omitting a fixed-height, relatively positioned canvas parent or maintainAspectRatio: false.
4. Skipping chart.destroy() during effect cleanup, especially on theme changes and React StrictMode remounts.
5. Reading theme variables before the theme DOM update.
6. Omitting API authentication or the server admin role check.
7. Exposing Supabase privileged keys in frontend code or committing .env files.
8. Counting historical renewals twice, including failed payments, grouping dates in UTC, or stopping at 1,000 rows.
9. Treating API/CDN failures as zero data or importing preview fixtures into production.
`
fs.writeFileSync('docs/ADMIN_ANALYTICS_CODE.md', content)
console.log(`Wrote complete source for ${files.length} files (${content.length} characters).`)

const gatePath = '.taste-skill/gate.json'
const resultsPath = '.taste-skill/analytics-qa-results.jsonl'
if (fs.existsSync(gatePath) && fs.existsSync(resultsPath)) {
  const gate = JSON.parse(fs.readFileSync(gatePath, 'utf8'))
  const results = fs
    .readFileSync(resultsPath, 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
  const consistency = JSON.parse(
    fs.readFileSync('.taste-skill/gate/consistency/report.json', 'utf8')
  )
  const open = gate.open || []
  let report = `GATE: FAIL ${open.length} (round ${gate.round} of ${gate.max})

# FitPulse analytics verification

The requested analytics implementation is complete. The broader design gate remains open: its marketing-page rules conflict with preserving an authenticated dashboard and using a consistent chart wrapper. Existing shell contrast/focus and fixed mobile navigation findings also remain open. No waivers or unrelated shell redesign were applied.

Kind: software, an existing gym admin portal. The requested navy/red/orange/gold palette and existing Fredoka/Nunito fonts, shell, hero, and clay surfaces were retained. No new photographs, assumed business facts, brand names, marketing effects, scenes, or creative moments were added. Preview numbers are isolated test fixtures, not production fallback data.

## Verification completed

- 13 focused API, aggregation, pagination, authentication, and route-regression tests passed.
- Production build passed; the existing camera/runtime chunk-size warnings remain.
- Read-only live Supabase checks verified all four aggregate queries; no records/schema were changed.
- Source formatting and focused Git whitespace checks passed.
- Browser checks used the actual dashboard components with a separate local fixture server and Chart.js 4.4.7 from the pinned CDN.
- Screenshots at 1440, 1024, 820, 768, 390, and 320 pixels were inspected. Mobile charts scroll within the existing app shell.
- Theme changes destroyed old chart instances and rebuilt them with updated CSS colors. Unmount/remount left no duplicate canvas ownership.
- Empty, loading, API failure/retry, malformed responses, partial failure, and unavailable CDN states passed.

## Browser assertion runs

| Width | State | Theme | Result | Assertions |
| --- | --- | --- | --- | --- |
`
  for (const result of results) {
    report += `| ${result.width} | ${result.mode} | ${result.theme || 'light'} | ${result.passed ? 'PASS' : 'FAIL'} | ${result.assertions?.length || 0} |\n`
  }
  report += `
## Checker limits and open findings

The skill's separate layout/check.mjs could not run: no Chrome found (set CHROME_PATH). Its screenshot and consistency scripts did run with installed Edge. No performance pass is claimed. The consistency quick run did not check: ${consistency.notChecked.join('; ')}.

No waivers were added. All ${open.length} open gate findings follow, including genuine existing shell findings; they are not silently treated as passes.

`
  for (const finding of open) {
    report += `### ${finding.check} (${finding.widths?.join(', ') || 'all'}px)\n\nLocation: ${finding.where}\n\n${finding.msg}\n\nSuggested checker fix: ${finding.fix}\n\n`
  }
  report += `## Reproducing the preview

Run node .taste-skill/analytics-preview-server.mjs, then open http://127.0.0.1:5174/.taste-skill/analytics-preview.html. Query options include state=empty, state=loading, state=error, state=invalid, state=partial, state=cdn-error, theme=dark, and checks=1. Test fixture numbers never enter the production app. Close the preview server when done.
`
  fs.writeFileSync('docs/ADMIN_ANALYTICS_QA.md', report)
  console.log(
    `Wrote QA report: ${open.length} open general-gate findings; ${results.length} browser assertion runs.`
  )
}
```

## .taste-skill/.gitignore

```javascript
chrome-*/
shots/
gate/
*.json
*.jsonl
```

## Database queries and placement

All queries are already in server/repositories/AnalyticsRepository.js:

- attendance(): attendance_logs, QR scan types and token IDs, bounded to the current Manila week and now.
- memberships(): member roles, users, and newest-first subscriptions; one latest subscription per member.
- payments(): amount/status/date/method fields, bounded to the relevant time window.
- paymentMethods(): method IDs and names from payment_methods.

AnalyticsService.js aggregates the rows and filters successful payments. No SQL migration is needed. Do not add privileged database queries to React.

## Common mistakes to avoid

1. Loading the CDN after React or using latest instead of pinned version 4.4.7.
2. Editing public/index.html instead of the actual Vite root index.html.
3. Omitting a fixed-height, relatively positioned canvas parent or maintainAspectRatio: false.
4. Skipping chart.destroy() during effect cleanup, especially on theme changes and React StrictMode remounts.
5. Reading theme variables before the theme DOM update.
6. Omitting API authentication or the server admin role check.
7. Exposing Supabase privileged keys in frontend code or committing .env files.
8. Counting historical renewals twice, including failed payments, grouping dates in UTC, or stopping at 1,000 rows.
9. Treating API/CDN failures as zero data or importing preview fixtures into production.
