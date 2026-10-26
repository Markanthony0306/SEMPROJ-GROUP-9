import { Router } from 'express'
import {
  authenticatePassword,
  PasswordAuthenticationError
} from '../services/passwordAuthentication.js'
import { deleteMemberAccount } from '../services/accountDeletion.js'
import { sendPasswordRecovery } from '../services/passwordRecovery.js'

export function accountRoutes({
  authenticate,
  requireRole,
  rateLimit,
  loadAccount,
  supabase,
  createAuthClient,
  mailer,
  from,
  clientUrl
}) {
  const router = Router()
  const remove = async (req, res) => {
    if (req.body?.confirmation !== 'DELETE')
      return res.status(400).json({ message: 'Type DELETE to confirm account deletion.' })
    const password = req.body?.currentPassword
    if (typeof password !== 'string' || !password || Buffer.byteLength(password, 'utf8') > 72)
      return res.status(400).json({ message: 'Enter your current password.' })
    try {
      const actor = await loadAccount(req.user.id)
      if (!actor) return res.status(401).json({ message: 'Your account could not be found.' })
      const verified = await authenticatePassword({
        createAuthClient,
        email: actor.email,
        password
      })
      if (verified.id !== actor.authUserId)
        return res.status(401).json({ message: 'Your login could not be verified.' })
      const account = await loadAccount(req.params.id)
      if (!account) return res.status(404).json({ message: 'Member account not found.' })
      await deleteMemberAccount({ supabase, account })
      return res.json({ message: 'Member account permanently deleted.' })
    } catch (error) {
      if (error instanceof PasswordAuthenticationError || error.status)
        return res.status(error.status).json({ message: error.message })
      console.error('Member account deletion failed:', error.code || 'ACCOUNT_DELETE_ERROR')
      return res
        .status(503)
        .json({ message: 'Unable to delete the member account. Please try again.' })
    }
  }
  router.delete(
    '/profile',
    authenticate,
    (_req, res) => res.status(403).json({
      message: 'Only an administrator can delete member accounts. Please contact the gym.'
    })
  )
  router.delete(
    '/admin/members/:id',
    authenticate,
    requireRole('admin'),
    rateLimit({ max: 5 }),
    remove
  )
  router.post(
    '/admin/members/:id/send-access',
    authenticate,
    requireRole('admin', 'staff'),
    rateLimit({ max: 5 }),
    async (req, res) => {
      if (!mailer)
        return res.status(503).json({ message: 'SMTP is not configured on the API server.' })
      try {
        const account = await loadAccount(req.params.id)
        if (!account || !['user', 'member'].includes(account.role))
          return res.status(404).json({ message: 'Member account not found.' })
        if (account.status !== 'active' || !account.authUserId)
          return res.status(409).json({ message: 'The member needs an active linked login first.' })
        await sendPasswordRecovery({
          supabaseAdmin: supabase,
          supabaseAuth: createAuthClient(),
          mailer,
          email: account.email,
          name: account.name,
          redirectTo: `${clientUrl}/reset-password`,
          from
        })
        return res.json({ message: 'A password setup link was accepted by the mail server.' })
      } catch (error) {
        console.error('Member access email failed:', error.code || 'EMAIL_ERROR')
        return res
          .status(503)
          .json({
            message: 'The sign-in email could not be sent. Check SMTP in Notifications, then retry.'
          })
      }
    }
  )
  return router
}
