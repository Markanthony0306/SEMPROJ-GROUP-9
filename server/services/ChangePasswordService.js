export class ChangePasswordError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ChangePasswordError'
    this.status = status
  }
}

/** Existing change-password validation rules, without HTTP or database dependencies. */
export class ChangePasswordService {
  constructor({ passwordPolicy, passwordPolicyMessage }) {
    this.passwordPolicy = passwordPolicy
    this.passwordPolicyMessage = passwordPolicyMessage
  }

  validate(body) {
    const { currentPassword, password, confirmPassword } = body || {}

    if (
      typeof currentPassword !== 'string' ||
      !currentPassword ||
      Buffer.byteLength(currentPassword, 'utf8') > 72
    ) {
      throw new ChangePasswordError(
        'Enter your current password (up to 72 bytes).',
        400
      )
    }

    if (!this.passwordPolicy(password)) {
      throw new ChangePasswordError(this.passwordPolicyMessage, 400)
    }

    if (confirmPassword !== undefined && confirmPassword !== password) {
      throw new ChangePasswordError('The new passwords do not match.', 400)
    }

    if (currentPassword === password) {
      throw new ChangePasswordError(
        'Choose a password different from your current password.',
        400
      )
    }

    return { currentPassword, password }
  }

  markPasswordChanged(account) {
    account.authVersion = (account.authVersion || 0) + 1
    account.mustChangePassword = false
    return account
  }
}
