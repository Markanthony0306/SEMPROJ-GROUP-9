import { Router } from 'express'

export function notificationRoutes({
  authenticate,
  requireRole,
  rateLimit,
  notifications
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
