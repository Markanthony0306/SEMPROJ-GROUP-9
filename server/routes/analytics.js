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
