export function registerCurrentUserRoutes(app, { authenticate, loadAccount, publicAccount }) {
  app.get('/api/me', authenticate, async (req, res) => {
    try {
      const account = await loadAccount(req.user.id)

      if (!account) {
        return res.status(401).json({
          message: 'Your session is invalid or has expired.'
        })
      }

      if (account.status !== 'active') {
        return res.status(401).json({
          message: 'Your account is unavailable.'
        })
      }
      if (!['admin', 'user', 'member'].includes(account.role)) {
        return res.status(403).json({
          message: 'Your account role is not supported.'
        })
      }

      return res.json({
        user: {
          ...publicAccount(account),
          accountStatus: account.status,
          mustChangePassword: account.mustChangePassword
        }
      })
    } catch (error) {
      console.error('Unable to load current user:', error.message)
      return res.status(500).json({
        message: 'Unable to load your profile.'
      })
    }
  })


}
