export class MemberUpdateWorkflowError extends Error {
  constructor(message, status = 500, code = null) {
    super(message)

    this.name = 'MemberUpdateWorkflowError'
    this.status = status
    this.code = code
  }
}

export class MemberUpdateWorkflow {
  constructor({ service, repository, authAdmin }) {
    this.service = service
    this.repository = repository
    this.authAdmin = authAdmin
  }

  // STEP 1: Validate everything before modifying records.
  async preflight({ member, body = {}, accounts = [] }) {
    const prepared = this.service.prepare({
      member,
      body,
      accounts
    })

    let authUserId

    try {
      authUserId =
        await this.repository.getLinkedAuthUserId(member.id)
    } catch {
      throw new MemberUpdateWorkflowError(
        'Unable to find the member login account.',
        500,
        'AUTH_LOOKUP_FAILED'
      )
    }

    if (!authUserId) {
      throw new MemberUpdateWorkflowError(
        'Unable to find the member login account.',
        500,
        'AUTH_ACCOUNT_MISSING'
      )
    }

    let duplicateEmail

    try {
      duplicateEmail =
        await this.repository.emailExistsForAnotherMember({
          memberId: member.id,
          email: prepared.input.email
        })
    } catch {
      throw new MemberUpdateWorkflowError(
        'Unable to check the member email.',
        500,
        'EMAIL_LOOKUP_FAILED'
      )
    }

    if (duplicateEmail) {
      throw new MemberUpdateWorkflowError(
        'An account with this email already exists.',
        409,
        'DUPLICATE_EMAIL'
      )
    }

    return {
      ...prepared,
      authUserId
    }
  }

  // STEP 2: Execute the member update.
  
  
  // STEP 2: Coordinate the complete member update.
  async execute({
    actorId,
    member,
    body = {},
    accounts = []
  }) {
    const prepared = await this.preflight({
      member,
      body,
      accounts
    })

    const {
      input,
      authUpdates,
      passwordChanged,
      authUserId
    } = prepared

    const emailChanged = Boolean(authUpdates.email)
    const planChanged = input.plan !== member.plan

    const profileChanged =
      input.name !== member.name ||
      input.phone !== (member.phone || '') ||
      emailChanged

    // 1. Reject credential fields we do not recognize.
    const supportedAuthFields = [
      'email',
      'email_confirm',
      'password'
    ]

    if (
      Object.keys(authUpdates).some(
        (key) => !supportedAuthFields.includes(key)
      )
    ) {
      throw new MemberUpdateWorkflowError(
        'Unsupported credential update.',
        400,
        'CREDENTIAL_UPDATE_NOT_READY'
      )
    }

    // 2. Plan and password operations require an actor ID.
    if ((planChanged || passwordChanged) && !actorId) {
      throw new MemberUpdateWorkflowError(
        'Administrator ID is required.',
        400,
        'ACTOR_ID_REQUIRED'
      )
    }

    if (
      (emailChanged || passwordChanged) &&
      !this.authAdmin?.updateUserById
    ) {
      throw new MemberUpdateWorkflowError(
        'Supabase Auth administration is not configured.',
        500,
        'AUTH_CLIENT_MISSING'
      )
    }

    // 3. Prepare the Supabase Auth changes.
    const credentials = {}

    if (emailChanged) {
      credentials.email = input.email
      credentials.email_confirm = true
    }

    if (passwordChanged) {
      credentials.password = body.password
    }

    let authVersion = null
    let authChanged = false

    // 4. Invalidate existing FitPulse sessions before
    // changing the password in Supabase Auth.
    if (passwordChanged) {
      try {
        authVersion =
          await this.repository.beginPasswordChange({
            actorId,
            memberId: member.id
          })
      } catch {
        throw new MemberUpdateWorkflowError(
          'Unable to confirm session invalidation. Verify the account before retrying.',
          500,
          'PASSWORD_SESSION_UPDATE_UNCERTAIN'
        )
      }
    }

    // 5. Synchronize login credentials with Supabase Auth.
    if (emailChanged || passwordChanged) {
      let authResult

      try {
        authResult = await this.authAdmin.updateUserById(
          authUserId,
          credentials
        )
      } catch {
        throw new MemberUpdateWorkflowError(
          'The login credential update could not be confirmed. Verify the account before retrying.',
          500,
          'AUTH_UPDATE_UNCERTAIN'
        )
      }

      if (authResult?.error) {
        throw new MemberUpdateWorkflowError(
          'Supabase Auth rejected the credential update.',
          500,
          'AUTH_UPDATE_FAILED'
        )
      }

      if (authResult?.data?.user?.id !== authUserId) {
        throw new MemberUpdateWorkflowError(
          'The login credential update could not be confirmed.',
          500,
          'AUTH_UPDATE_UNCERTAIN'
        )
      }

      if (
        emailChanged &&
        authResult.data.user.email?.toLowerCase() !==
          input.email
      ) {
        throw new MemberUpdateWorkflowError(
          'The login email could not be verified. Check the account before retrying.',
          500,
          'EMAIL_RECONCILIATION_REQUIRED'
        )
      }

      authChanged = true
    }

    // 6. Update the application database.
    let updatedProfile = {
      id: member.id,
      name: member.name,
      email: member.email,
      phone_number: member.phone || null
    }

    let subscriptionId = member.subscriptionId

    try {
      if (planChanged) {
        // Profile details and subscription plan are
        // updated together inside PostgreSQL.
        const result =
          await this.repository.updateDetailsAtomic({
            actorId,
            memberId: member.id,
            input,
            planChanged: true
          })

        updatedProfile = result.updatedProfile
        subscriptionId = result.subscriptionId
      }

      if (
        emailChanged ||
        (!planChanged && profileChanged)
      ) {
        // The plan RPC does not change login emails.
        // Save the full profile when needed.
        updatedProfile =
          await this.repository.updateProfile({
            memberId: member.id,
            input
          })
      }

      // 7. Finalize password metadata only after
      // Supabase Auth has confirmed the change.
      if (passwordChanged) {
        await this.repository.completePasswordChange({
          memberId: member.id,
          authVersion
        })
      }
    } catch (error) {
      // Some operations may already have succeeded.
      // Never automatically repeat the entire request.
      
      if (authChanged) {
        throw new MemberUpdateWorkflowError(
          'Login credentials may have changed, but the database update could not be completed. Verify both records before retrying.',
          500,
          emailChanged && !passwordChanged && !planChanged
            ? 'EMAIL_RECONCILIATION_REQUIRED'
            : 'MEMBER_RECONCILIATION_REQUIRED'
        )
      }

      throw new MemberUpdateWorkflowError(
        'Unable to save the member details. Verify the account before retrying.',
        500,
        error.code || 'MEMBER_UPDATE_FAILED'
      )
    }

    // 8. Return one consistent result to Express.
    return {
      updatedProfile,
      input,
      authVersion,
      subscriptionId,
      emailChanged,
      passwordChanged,
      planChanged
    }
  }
}
