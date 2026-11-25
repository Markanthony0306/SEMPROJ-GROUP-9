import { recoveryEmail } from './emailTemplates.js'
import { assertEmailAccepted, createEmailDelivery, emailConfiguration } from './emailDelivery.js'
import { PasswordRecoveryWorkflowError, RESET_LINK_LIFETIME_SECONDS } from './PasswordRecoveryService.js'

export async function sendFitPulseResetEmail({ email, name, recoveryUrl }) {
  const config = emailConfiguration()
  const mailer = createEmailDelivery(config)
  if (!mailer) {
    throw new PasswordRecoveryWorkflowError('Password reset email is unavailable. Contact the gym front desk.', 503)
  }
  try {
    await mailer.sendMail({
      from: config.from,
      to: email,
      ...recoveryEmail({ name, recoveryUrl, expiresInSeconds: RESET_LINK_LIFETIME_SECONDS })
    })
  } finally {
    mailer.close()
  }
}

export async function sendPasswordRecovery({
  supabaseAdmin,
  supabaseAuth,
  mailer,
  email,
  name,
  redirectTo,
  from
}) {
  if (!mailer) {
    const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) throw error
    return
  }
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo }
  })
  if (error) throw error
  const recoveryUrl = data?.properties?.action_link
  if (!recoveryUrl) throw new Error('No recovery link returned by the provider.')
  assertEmailAccepted(
    await mailer.sendMail({ from, to: email, ...recoveryEmail({ name, recoveryUrl }) })
  )
}
