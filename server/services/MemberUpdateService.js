
export class MemberUpdateError extends Error {
  constructor(message, status = 400) {
    super(message)

    this.name = 'MemberUpdateError'
    this.status = status
  }
}

export class MemberUpdateService {
  constructor({
    validAccountInput,
    passwordPolicy,
    passwordPolicyMessage
  }) {
    this.validAccountInput = validAccountInput
    this.passwordPolicy = passwordPolicy
    this.passwordPolicyMessage = passwordPolicyMessage
  }

  prepare({ member, body = {}, accounts = [] }) {
    // 1. Combine existing member details with submitted changes.
    const input = this.validAccountInput({
      ...member,
      ...body
    })

    // 2. Validate member information.
    if (input.error) {
      throw new MemberUpdateError(input.error)
    }

    // 3. Check whether another account already uses this email.
    const duplicateAccount = accounts.some(
      (account) =>
        account.id !== member.id &&
        String(account.email || '')
          .trim()
          .toLowerCase() === input.email
    )

    if (duplicateAccount) {
      throw new MemberUpdateError(
        'An account with this email already exists.',
        409
      )
    }

    // 4. Validate the new password if supplied.
    if (
      body.password !== undefined &&
      body.password !== '' &&
      !this.passwordPolicy(body.password)
    ) {
      throw new MemberUpdateError(
        this.passwordPolicyMessage
      )
    }

    // 5. Prepare changes for Supabase Auth.
    const authUpdates = {}

    if (input.email !== member.email.toLowerCase()) {
      authUpdates.email = input.email
      authUpdates.email_confirm = true
    }

    const passwordChanged = Boolean(body.password)

    if (passwordChanged) {
      authUpdates.password = body.password
    }

    // 6. Return the prepared data without saving anything.
    return {
      input,
      authUpdates,
      passwordChanged
    }
  }
}
