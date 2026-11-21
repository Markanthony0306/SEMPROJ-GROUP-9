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
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    return this.emailPattern.test(email) ? email : null
  }

  requireCode(body) {
    const code = typeof body.code === 'string' ? body.code : ''
    if (!code) {
      throw new PasswordRecoveryWorkflowError('The reset authorization code is missing.', 400)
    }
    return code
  }

  requirePassword(body) {
    const password = typeof body.password === 'string' ? body.password : ''
    if (!this.passwordPolicy(password)) {
      throw new PasswordRecoveryWorkflowError(this.passwordPolicyMessage, 400)
    }
    return password
  }

  requireToken(authorization) {
    const accessToken = authorization.replace(/^Bearer\s+/i, '')
    if (!accessToken) {
      throw new PasswordRecoveryWorkflowError(
        'Your reset link is invalid or expired. Request a new one.',
        401
      )
    }
    return accessToken
  }
}
