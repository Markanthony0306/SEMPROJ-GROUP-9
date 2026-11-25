import { PasswordRecoveryService, PasswordRecoveryWorkflowError } from '../services/PasswordRecoveryService.js'
import { PasswordRecoveryRepository } from '../repositories/PasswordRecoveryRepository.js'
import { PasswordRecoveryWorkflow } from '../services/PasswordRecoveryWorkflow.js'
import { sendFitPulseResetEmail } from '../services/passwordRecovery.js'

export function registerPasswordRecoveryRoutes(app, {
  rateLimit, emailPattern, passwordPolicy, passwordPolicyMessage, supabase, clientUrl,
  sendResetEmail = sendFitPulseResetEmail
}) {
  const passwordRecoveryWorkflow = new PasswordRecoveryWorkflow({
    service: new PasswordRecoveryService({ emailPattern, passwordPolicy, passwordPolicyMessage }),
    repository: new PasswordRecoveryRepository({ supabase, sendResetEmail }),
    clientUrl
  })

  app.post('/api/auth/forgot-password', rateLimit({ max: 5 }), async (req, res) => {
    try {
      return res.json(await passwordRecoveryWorkflow.forgotPassword(req.body))
    } catch (error) {
      if (error instanceof PasswordRecoveryWorkflowError) {
        return res.status(error.status).json({ message: error.message })
      }
      console.error('Forgot-password request failed:', error.code || 'RECOVERY_EMAIL_FAILED')
      return res.status(500).json({
        message: 'Unable to process your request. Please try again.'
      })
    }
  })

  app.post('/api/auth/reset-password/session', rateLimit({ max: 30 }), (req, res) => {
    res.set('Cache-Control', 'no-store')
    try {
      return res.json(passwordRecoveryWorkflow.checkLink(req.body))
    } catch (error) {
      if (error instanceof PasswordRecoveryWorkflowError) {
        return res.status(error.status).json({ message: error.message })
      }
      console.error('Reset link verification failed:', error.code || 'RECOVERY_LINK_FAILED')
      return res.status(500).json({
        message: 'Unable to verify the reset link. Please try again.'
      })
    }
  })

  app.post('/api/auth/reset-password', rateLimit({ max: 10 }), async (req, res) => {
    res.set('Cache-Control', 'no-store')
    try {
      return res.json(await passwordRecoveryWorkflow.resetPassword(req.body))
    } catch (error) {
      if (error instanceof PasswordRecoveryWorkflowError) {
        return res.status(error.status).json({ message: error.message })
      }
      console.error('Password reset failed:', error.message)
      return res.status(500).json({
        message: 'Unable to reset your password. Please try again.'
      })
    }
  })



}
