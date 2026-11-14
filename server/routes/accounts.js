import { Router } from 'express'
import { deleteMemberAccountAsAdmin } from '../services/accountDeletion.js'

const memberIdPattern = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i

export function accountRoutes({ authenticate, requireRole, rateLimit, supabase }) {
  const router = Router()
  const remove = async (req, res) => {
    const memberId = req.params.id.toLowerCase()
    if (memberId === req.user.id.toLowerCase())
      return res.status(403).json({ message: 'You cannot delete your own account.' })
    if (typeof req.body?.confirmation !== 'string' || req.body.confirmation.trim() !== 'DELETE')
      return res.status(400).json({ message: 'Type DELETE to confirm account deletion.' })
    if (!memberIdPattern.test(memberId))
      return res.status(404).json({ message: 'Member account not found.' })
    try {
      await deleteMemberAccountAsAdmin({ supabase, actor: req.user, memberId })
      return res.json({ message: 'Member account deleted.' })
    } catch (error) {
      if (!error.status || error.status >= 500) {
        console.error(
          'Member account deletion failed:',
          error.cause?.code || error.code || 'ACCOUNT_DELETE_ERROR'
        )
      }
      if (error.status) return res.status(error.status).json({ message: error.message })
      return res
        .status(503)
        .json({ message: 'Unable to delete the member account. Please try again.' })
    }
  }
  router.delete('/profile', authenticate, (_req, res) =>
    res.status(403).json({
      message: 'Only an administrator can delete member accounts. Please contact the gym.'
    })
  )
  router.delete(
    '/admin/members/:id',
    (req, res, next) => authenticate(req, res, next, 403),
    requireRole('admin'),
    rateLimit({ max: 5 }),
    remove
  )
  return router
}
