
export class ProfileUpdateError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ProfileUpdateError'
    this.status = status
  }
}

export class ProfileUpdateService {
  constructor({ validAccountInput }) {
    this.validAccountInput = validAccountInput
  }

  validateRequest(body) {
    if (body?.password) {
      throw new ProfileUpdateError(
        'Use the Change Password form to updateyour password.',
        400
      )
    }
  }

  prepare(account, accounts, body) {
    if (!account) {
      throw new ProfileUpdateError(
        'Account not found.',
        404
      )
    }

    const input = this.validAccountInput({
      ...account,
      ...(body || {})
    })

    if (input.error) {
      throw new ProfileUpdateError(input.error, 400)
    }

    const previousName = account.name
    const previousEmail = account.email.trim().toLowerCase()

    const nameChanged = input.name !== previousName
    const emailChanged = input.email !== previousEmail

    const duplicate = accounts.some(
      (item) =>
        item.id !== account.id &&
        String(item.email).toLowerCase() === input.email
    )

    if (duplicate) {
      throw new ProfileUpdateError(
        'An account with this email already exists.',
        409
      )
    }

    return {
      input,
      previousName,
      previousEmail,
      nameChanged,
      emailChanged,
      needsAuthUpdate: nameChanged || emailChanged
    }
  }

  buildAuthUpdates(input, emailChanged) {
    const updates = {
      user_metadata: { name: input.name }
    }

    if (emailChanged) {
      updates.email = input.email
      updates.email_confirm = true
    }

    return updates
  }

  applyUpdatedProfile(account, profile) {
    Object.assign(account, {
      name: profile.name,
      email: profile.email,
      phone: profile.phone_number || ''
    })

    return account
  }
}
