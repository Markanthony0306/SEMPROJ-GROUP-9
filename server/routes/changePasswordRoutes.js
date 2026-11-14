import { ChangePasswordService, ChangePasswordError } from '../services/ChangePasswordService.js'
import { ChangePasswordRepository } from '../repositories/ChangePasswordRepository.js'
import { ChangePasswordWorkflow } from '../services/ChangePasswordWorkflow.js'
import { authenticatePassword, PasswordAuthenticationError } from '../services/passwordAuthentication.js'

export function registerChangePasswordRoutes(app, { authenticate, rateLimit, passwordPolicy, passwordPolicyMessage, supabase, loadDatabase, saveDatabase, createAuthClient, createSession }) {
  const changePasswordWorkflow = new ChangePasswordWorkflow({
    service: new ChangePasswordService({ passwordPolicy, passwordPolicyMessage }),
    repository: new ChangePasswordRepository({ supabase, loadDatabase, saveDatabase }),
    authenticatePassword,
    createAuthClient
  })

  app.post(
    '/api/profile/change-password',
    authenticate,
    rateLimit({ max: 10 }),
    async (req, res) => {
      try {
        const account = await changePasswordWorkflow.execute({
          actorId: req.user.id,
          body: req.body
        })
        return res.json({
          message: 'Password updated.',
          session: createSession(account, {
            faceVerified: req.user.faceVerified === true,
            allowUnenrolledAdmin: req.user.role === 'admin' && req.user.faceVerified !== true
          })
        })
      } catch (error) {
        if (error instanceof ChangePasswordError) {
          return res.status(error.status).json({ message: error.message })
        }
        if (error instanceof PasswordAuthenticationError) {
          return res.status(error.status === 401 ? 400 : error.status).json({
            message: error.status === 401 ? 'Current password is incorrect.' : error.message,
            code: error.code
          })
        }
        console.error('Password change failed:', error.message)
        return res.status(500).json({
          message: 'Unable to change your password. Please try again.'
        })
      }
    }
  )



}
