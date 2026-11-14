import { Router } from 'express'
import {
  authenticatePassword,
  PasswordAuthenticationError
} from '../services/passwordAuthentication.js'

import {
  MemberDeactivationService
} from '../services/MemberDeactivationService.js'

import {
  MemberDeactivationRepository
} from '../repositories/MemberDeactivationRepository.js'

import {
  MemberDeactivationWorkflow
} from '../services/MemberDeactivationWorkflow.js'

export function accountRoutes({
  authenticate,
  requireRole,
  rateLimit,
  loadAccount,
  supabase,
  createAuthClient
}) {
  const router = Router()


  const deactivationWorkflow = new MemberDeactivationWorkflow({
    service: new MemberDeactivationService(),
    repository: new MemberDeactivationRepository(supabase)
  })

  // Permanent member deletion remains disabled. Use deactivation to retain records.
  router.delete('/profile', authenticate, (_req, res) => res.status(403).json({
    message: 'Member accounts cannot be permanently deleted. Contact the gym.'
  }))
  router.delete('/admin/members/:id', authenticate, requireRole('admin'), rateLimit({ max: 5 }), (_req, res) =>
    res.status(403).json({ message: 'Permanent deletion is disabled. Deactivate the member instead.' }))

  const deactivate = async (req, res) => {
    if (req.body?.confirmation !== 'DEACTIVATE') {
      return res.status(400).json({
        message: 'Type DEACTIVATE to confirm.'
      })
    }

    const password = req.body?.currentPassword

    if (
      typeof password !== 'string' ||
      !password ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      return res.status(400).json({
        message: 'Enter your current password.'
      })
    }

    try {
      const actor = await loadAccount(req.user.id)

      if (!actor) {
        return res.status(401).json({
          message: 'Administrator account not found.'
        })
      }

      // Require the administrator's current password.
      const verified = await authenticatePassword({
        createAuthClient,
        email: actor.email,
        password
      })

      if (verified.id !== actor.authUserId) {
        return res.status(401).json({
          message: 'Your login could not be verified.'
        })
      }

      const member = await loadAccount(req.params.id)

      const result = await deactivationWorkflow.execute({
        actor,
        member
      })

      return res.json({
        message: 'Member deactivated successfully.',
        member: result
      })
    } catch (error) {
      if (
        error instanceof PasswordAuthenticationError ||
        error.status
      ) {
        return res.status(error.status || 401).json({
          message: error.message
        })
      }

      console.error(
        'Member deactivation failed:',
        error.code || 'MEMBER_DEACTIVATION_ERROR'
      )

      return res.status(503).json({
        message: 'Unable to deactivate the member account.'
      })
    }
  }

  router.post(
    '/admin/members/:id/deactivate',
    authenticate,
    requireRole('admin'),
    rateLimit({ max: 5 }),
    deactivate
  )

  return router
}
