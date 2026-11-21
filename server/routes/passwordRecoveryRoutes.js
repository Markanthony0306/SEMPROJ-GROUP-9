import { PasswordRecoveryService, PasswordRecoveryWorkflowError } from '../services/PasswordRecoveryService.js'
import { PasswordRecoveryRepository } from '../repositories/PasswordRecoveryRepository.js'
import { PasswordRecoveryWorkflow } from '../services/PasswordRecoveryWorkflow.js'
import { createEmailDelivery, emailConfiguration } from '../services/emailDelivery.js'
import { recoveryEmail } from '../services/emailTemplates.js'

async function sendResetLink(profile, recoveryUrl) {
  const email = emailConfiguration()
  const mailer = createEmailDelivery(email)
  if (!mailer) {
    throw new PasswordRecoveryWorkflowError('Password reset email is currently unavailable.', 503)
  }
  try {
    await mailer.sendMail({
      from: email.from,
      to: profile.email,
      ...recoveryEmail({ name: profile.name, recoveryUrl, expiresInMinutes: 30 })
    })
  } finally {
    mailer.close()
  }
}

export function registerPasswordRecoveryRoutes(app, {
  rateLimit, emailPattern, passwordPolicy, passwordPolicyMessage, supabase, clientUrl
}) {
  const workflow = new PasswordRecoveryWorkflow({
    service: new PasswordRecoveryService({ emailPattern, passwordPolicy, passwordPolicyMessage }),
    repository: new PasswordRecoveryRepository({ supabase }),
    clientUrl,
    sendResetLink
  })

  const handle = (action, failure) => async (req, res) => {
    res.set('Cache-Control', 'no-store')
    try {
      return res.json(await action(req.body ?? {}))
    } catch (error) {
      if (error instanceof PasswordRecoveryWorkflowError) {
        return res.status(error.status).json({ message: error.message })
      }
      // Provider errors can include addresses or other request details.
      console.error(failure, error.code || 'RECOVERY_ERROR')
      return res.status(500).json({ message: failure })
    }
  }

  app.post('/api/auth/forgot-password', rateLimit({ max: 5 }),
    handle((body) => workflow.forgotPassword(body), 'Unable to send a reset link. Please try again.'))
  app.post('/api/auth/reset-password/check', rateLimit({ max: 20 }),
    handle((body) => workflow.checkToken(body), 'Unable to check this link. Please try again.'))
  app.post('/api/auth/reset-password', rateLimit({ max: 10 }),
    handle((body) => workflow.resetPassword(body), 'Unable to reset your password. Request a new link.'))
}
