import { Router } from 'express'

export function notificationRoutes({
  authenticate,
  requireRole,
  rateLimit,
  notifications,
  reminders,
  mailer
}) {
  const router = Router()
  router.use(
    '/admin/notifications',
    authenticate,
    requireRole('admin', 'staff'),
    rateLimit({ max: 100 })
  )
  router.get('/admin/notifications', async (req, res) => {
    res.json(await notifications.list(req.user.id))
  })
  router.post(
    '/admin/notifications/check-email',
    requireRole('admin'),
    rateLimit({ max: 5 }),
    async (req, res) => {
      if (!mailer)
        return res.status(503).json({ message: 'SMTP is not configured on the API server.' })
      const current = await notifications.list(req.user.id)
      if (!current.email.enabled)
        return res
          .status(409)
          .json({ message: 'Enable automatic email reminders in Gym Preferences first.' })
      if (!current.email.trackingReady)
        return res.status(503).json({ message: current.email.issue })
      res.json(await reminders.runDue())
    }
  )
  router.post(
    '/admin/notifications/check-smtp',
    requireRole('admin'),
    rateLimit({ max: 5 }),
    async (req, res) => {
      if (!mailer)
        return res.status(503).json({ message: 'SMTP is not configured on the API server.' })
      try {
        await mailer.verify()
        res.json({
          message: 'SMTP connection and authentication verified. No test email was sent.'
        })
      } catch (error) {
        const code = /^[A-Z_]{2,40}$/.test(error.code || '') ? error.code : 'SMTP_ERROR'
        res.status(503).json({
          message: `SMTP verification failed (${code}). Check the private server settings.`
        })
      }
    }
  )
  router.delete('/admin/notifications', requireRole('admin'), async (req, res) => {
    if (req.body?.confirmation !== 'CLEAR')
      return res.status(400).json({ message: 'Type CLEAR to confirm.' })
    if (req.body.group !== undefined && !['membership', 'equipment'].includes(req.body.group))
      return res.status(400).json({ message: 'Choose a valid notification group.' })
    res.json({ deleted: await notifications.dismiss(req.user.id, undefined, req.body.group) })
  })
  router.delete('/admin/notifications/:id', requireRole('admin'), async (req, res) => {
    if (!/^[a-f0-9]{64}$/.test(req.params.id))
      return res.status(400).json({ message: 'Invalid notification identifier.' })
    res.json({ deleted: await notifications.dismiss(req.user.id, req.params.id) })
  })
  router.use('/admin/notifications', (error, req, res, next) => {
    if (error.status) return res.status(error.status).json({ message: error.message })
    next(error)
  })
  return router
}
