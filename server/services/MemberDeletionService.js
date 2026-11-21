
function deletionError(message, status = 503) {
  return Object.assign(new Error(message), { status })
}

export class MemberDeletionService {
  // Validate which accounts may be deleted.
  validate(account) {
    if (!account) {
      throw deletionError(
        'Member account not found.',
        404
      )
    }

    // Prevent administrator and staff deletion.
    if (!['user', 'member'].includes(account.role)) {
      throw deletionError(
        'Administrator and staff accounts cannot be deleted here.',
        403
      )
    }

    // The member must have a linked Auth account.
    if (!account.authUserId) {
      throw deletionError(
        'This account is not linked to a login. Contact the gym administrator.',
        409
      )
    }

    return account
  }
}
