import { createHash, randomBytes } from 'node:crypto'

export const invalidResetMessage = 'This reset link is invalid or expired. Request a new one.'

export class PasswordRecoveryWorkflowError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'PasswordRecoveryWorkflowError'
    this.status = status
  }
}

/** Validates recovery inputs and keeps raw tokens out of the database. */
export class PasswordRecoveryService {
  constructor({ emailPattern, passwordPolicy, passwordPolicyMessage }) {
    this.emailPattern = emailPattern
    this.passwordPolicy = passwordPolicy
    this.passwordPolicyMessage = passwordPolicyMessage
  }

  normalizedEmail(body = {}) {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    return this.emailPattern.test(email) ? email : null
  }

  newToken() {
    return randomBytes(32).toString('base64url')
  }

  tokenHash({ token } = {}) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      throw new PasswordRecoveryWorkflowError(invalidResetMessage, 401)
    }
    return createHash('sha256').update(token).digest('hex')
  }

  requirePassword(body = {}) {
    const password = typeof body.password === 'string' ? body.password : ''
    if (!this.passwordPolicy(password)) {
      throw new PasswordRecoveryWorkflowError(this.passwordPolicyMessage, 400)
    }
    if (password !== body.confirmPassword) {
      throw new PasswordRecoveryWorkflowError('The passwords do not match.', 400)
    }
    return password
  }
}
