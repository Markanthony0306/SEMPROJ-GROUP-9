import { recoveryEmail } from './emailTemplates.js'
import { assertEmailAccepted } from './emailDelivery.js'

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
