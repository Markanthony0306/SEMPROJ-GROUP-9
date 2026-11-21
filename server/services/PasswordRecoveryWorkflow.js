import { PasswordRecoveryWorkflowError } from './PasswordRecoveryService.js'

/** Coordinates existing forgot/reset flows without changing response semantics. */
export class PasswordRecoveryWorkflow {
  constructor({ service, repository, clientUrl }) {
    this.service = service
    this.repository = repository
    this.clientUrl = clientUrl
  }

  async forgotPassword(body) {
    const response = { message: 'If that email exists, a reset link was sent.' }
    const email = this.service.normalizedEmail(body)
    if (!email) return response

    const { data: profile, error: profileError } =
      await this.repository.findProfileByEmail(email)

    if (profileError) {
      console.error('Forgot-password profile lookup failed:', profileError.message)
      throw new PasswordRecoveryWorkflowError(
        'Unable to process your request. Please try again.',
        500
      )
    }

    if (!profile || profile.status !== 'active') return response

    const { error } = await this.repository.sendResetLink(
      profile.email,
      `${this.clientUrl}/reset-password`
    )
    if (error) throw error
    return response
  }

  async exchangeSession(body) {
    const code = this.service.requireCode(body)
    const { data, error } = await this.repository.exchangeCode(code)
    if (error || !data?.session?.access_token) {
      throw new PasswordRecoveryWorkflowError(
        'This reset link is invalid or expired. Request a new one.',
        401
      )
    }
    return { accessToken: data.session.access_token }
  }

  async resetPassword({ body, authorization }) {
    const password = this.service.requirePassword(body)
    const accessToken = this.service.requireToken(authorization)

    const { data: authData, error: authError } =
      await this.repository.getAuthUser(accessToken)
    if (authError || !authData?.user) {
      throw new PasswordRecoveryWorkflowError(
        'Your reset link is invalid or expired. Request a new one.',
        401
      )
    }
    const authUserId = authData.user.id
    const { data: profile, error: profileError } =
      await this.repository.findLinkedProfile(authUserId)

    if (profileError || !profile) {
      console.error('Reset-password profile lookup failed:', profileError?.message)
      throw new PasswordRecoveryWorkflowError('Unable to find your FitPulse account.', 400)
    }

    const { error: updateError } =
      await this.repository.setAuthPassword(authUserId, password)
    if (updateError) {
      console.error('Supabase password reset failed:', updateError.message)
      throw new PasswordRecoveryWorkflowError(
        'Unable to reset your password. Please try again.',
        500
      )
    }

    const { error: profileUpdateError } =
      await this.repository.updatePasswordState(profile)
    if (profileUpdateError) {
      console.error('Supabase password state update failed:', profileUpdateError.message)
      throw new PasswordRecoveryWorkflowError(
        'Unable to reset your password. Please try again.',
        500
      )
    }

    return { message: 'Password reset successfully. Please log in with your new password.' }
  }
}
