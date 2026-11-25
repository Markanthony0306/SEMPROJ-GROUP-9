export const RESET_LINK_LIFETIME_SECONDS = 60

export class PasswordRecoveryWorkflowError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'PasswordRecoveryWorkflowError'
    this.status = status
  }
}

/** Pure input rules for the three existing password-recovery routes. */
export class PasswordRecoveryService {
  constructor({ emailPattern, passwordPolicy, passwordPolicyMessage }) {
    this.emailPattern = emailPattern
    this.passwordPolicy = passwordPolicy
    this.passwordPolicyMessage = passwordPolicyMessage
  }

  normalizedEmail(body) {
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    return this.emailPattern.test(email) ? email : null
  }

  requirePassword(body) {
    const password = typeof body?.password === 'string' ? body.password : ''
    if (!this.passwordPolicy(password)) {
      throw new PasswordRecoveryWorkflowError(this.passwordPolicyMessage, 400)
    }
    if (body.confirmPassword !== password) {
      throw new PasswordRecoveryWorkflowError('The new passwords do not match.', 400)
    }
    return password
  }
}
