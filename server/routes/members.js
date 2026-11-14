
import { Router } from 'express'

export function memberRoutes({
  authenticate,
  requireRole,
  loadDatabase,
  publicAccount
}) {
  const router = Router()

  // GET /api/members
  // Retrieve members for the admin dashboard
  router.get(
    '/members',
    authenticate,
    requireRole('admin'),

    async (req, res) => {
      try {
        const database = await loadDatabase(['accounts'])

        const members = database.accounts
          .slice()
          .sort(
            (a, b) =>
              Date.parse(b.joined || 0) -
              Date.parse(a.joined || 0)
          )
          .map((account) => ({
            ...publicAccount(account),
            memberCode: account.memberCode,
            accountStatus: account.status,
            createdAt: account.joined
          }))

        return res.json({ members })

      } catch (error) {
        console.error('Unable to load members:', error.message)

        return res.status(500).json({
          message: 'Unable to load members.'
        })
      }
    }
  )

  return router
}

