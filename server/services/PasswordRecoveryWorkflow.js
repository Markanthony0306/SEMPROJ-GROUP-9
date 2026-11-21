import {
  invalidResetMessage,
  PasswordRecoveryWorkflowError
} from './PasswordRecoveryService.js'

export class PasswordRecoveryWorkflow {
  constructor({ service, repository, clientUrl, sendResetLink }) {
    this.service = service
    this.repository = repository
    this.clientUrl = clientUrl
    this.sendResetLink = sendResetLink
  }

  async forgotPassword(body) {
    const email = this.service.normalizedEmail(body)
    if (!email) {
      throw new PasswordRecoveryWorkflowError('Please enter a valid email address.', 400)
    }

    const profile = await this.repository.findProfileByEmail(email)
    if (!profile?.auth_user_id || !['active', 'expired'].includes(profile.status)) {
      throw new PasswordRecoveryWorkflowError('No account found with this email.', 404)
    }

    const token = this.service.newToken()
    const hash = this.service.tokenHash({ token })
    const resetUrl = new URL(this.clientUrl + '/reset-password')
    // Fragments are kept out of HTTP requests and access logs.
    resetUrl.hash = new URLSearchParams({ token }).toString()

    await this.repository.saveToken(profile, hash)
    try {
      await this.sendResetLink(profile, resetUrl.href)
    } catch (error) {
      // Remove only this request's token. Another request may have replaced it.
      await this.repository.removeToken(hash).catch(() => {})
      throw error
    }
    return { message: 'Check your email for the password reset link.' }
  }

  async checkToken(body) {
    if (!await this.repository.findToken(this.service.tokenHash(body))) {
      throw new PasswordRecoveryWorkflowError(invalidResetMessage, 401)
    }
    return { valid: true }
  }

  async resetPassword(body) {
    const hash = this.service.tokenHash(body)
    const password = this.service.requirePassword(body)
    const profile = await this.repository.consumeToken(hash)
    if (!profile) throw new PasswordRecoveryWorkflowError(invalidResetMessage, 401)

    // Only the request that consumed the token can update the Auth password.
    // Supabase Auth hashes it. If the update fails, request a fresh link.
    await this.repository.setAuthPassword(profile.auth_user_id, password)
    await this.repository.updatePasswordState(profile)
    return { message: 'Password reset successfully. Log in with your new password.' }
  }
}
