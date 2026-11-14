import { PasswordRecoveryService, PasswordRecoveryWorkflowError } from '../services/PasswordRecoveryService.js'
import { PasswordRecoveryRepository } from '../repositories/PasswordRecoveryRepository.js'
import { PasswordRecoveryWorkflow } from '../services/PasswordRecoveryWorkflow.js'

export function registerPasswordRecoveryRoutes(app, { rateLimit, emailPattern, passwordPolicy, passwordPolicyMessage, supabase, createAuthClient, clientUrl }) {
  // Same original password recovery routes; Supabase operations now live in an OOP workflow.
  const passwordRecoveryWorkflow = new PasswordRecoveryWorkflow({
    service: new PasswordRecoveryService({ emailPattern, passwordPolicy, passwordPolicyMessage }),
    repository: new PasswordRecoveryRepository({ supabase, createAuthClient }),
    clientUrl
  })

  app.post('/api/auth/forgot-password', rateLimit({ max: 5 }), async (req, res) => {
    try {
      return res.json(await passwordRecoveryWorkflow.forgotPassword(req.body))
    } catch (error) {
      if (error instanceof PasswordRecoveryWorkflowError) {
        return res.status(error.status).json({ message: error.message })
      }
      console.error('Forgot-password request failed:', error.message)
      return res.status(500).json({
        message: 'Unable to process your request. Please try again.'
      })
    }
  })

  app.post('/api/auth/reset-password/session', rateLimit({ max: 10 }), async (req, res) => {
    try {
      return res.json(await passwordRecoveryWorkflow.exchangeSession(req.body))
    } catch (error) {
      if (error instanceof PasswordRecoveryWorkflowError) {
        return res.status(error.status).json({ message: error.message })
      }
      console.error('Recovery session exchange failed:', error.message)
      return res.status(500).json({
        message: 'Unable to verify the reset link. Please try again.'
      })
    }
  })

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      return res.json(await passwordRecoveryWorkflow.resetPassword({
        body: req.body,
        authorization: req.headers.authorization || ''
      }))
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
