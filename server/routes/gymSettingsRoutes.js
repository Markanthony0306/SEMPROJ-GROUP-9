export function registerSettingsRoutes(app, { authenticate, requireRole, loadDatabase, saveDatabase }) {
  app.get('/api/admin/settings', authenticate, requireRole('admin'), async (req, res) =>
    res.json({ settings: (await loadDatabase(['settings'])).settings })
  )
  app.patch('/api/admin/settings', authenticate, requireRole('admin'), async (req, res) => {
    const database = await loadDatabase(['settings'])
    if (typeof req.body.gym === 'string' && req.body.gym.trim())
      database.settings.gym = req.body.gym.trim()
    if (Number.isInteger(req.body.remind) && req.body.remind >= 1 && req.body.remind <= 30)
      database.settings.remind = req.body.remind
    database.settings.emailOn = false
    await saveDatabase(database)
    res.json({ settings: database.settings })
  })




}
