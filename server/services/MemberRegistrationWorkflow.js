
const CONFIRMED_SQL_REJECTIONS = new Set([
  'REGISTRATION_INVALID_INPUT',
  'REGISTRATION_FORBIDDEN',
  'REGISTRATION_AUTH_USER_INVALID',
  'REGISTRATION_MEMBER_ROLE_MISSING',
  'REGISTRATION_PLAN_UNAVAILABLE',
  'REGISTRATION_PAYMENT_METHOD_UNAVAILABLE'
])

export class MemberRegistrationWorkflowError extends Error {
  constructor(code, message, { status = 500, cause } = {}) {
    super(message, { cause })

    this.name = 'MemberRegistrationWorkflowError'
    this.code = code
    this.status = status
  }
}

// Determine whether PostgreSQL definitely rejected the transaction.
function isConfirmedRollback(error) {
  const pg = error?.cause

  if (
    error?.code === 'REGISTRATION_CONFLICT' &&
    pg?.code === '23505'
  ) {
    return true
  }

  return (
    error?.code === 'REGISTRATION_SAVE_FAILED' &&
    pg?.code === 'P0001' &&
    CONFIRMED_SQL_REJECTIONS.has(pg?.message)
  )
}

export class MemberRegistrationWorkflow {
  constructor({
    authAdmin,
    repository,
    generateTemporaryPassword
  }) {
    this.authAdmin = authAdmin
    this.repository = repository
    this.generateTemporaryPassword = generateTemporaryPassword
  }

  async execute({ actorId, prepared }) {
    const {
      input,
      planRecord,
      recordPayment,
      method
    } = prepared

    // STEP 1: Generate the temporary password.
    const temporaryPassword = this.generateTemporaryPassword()

    let authUserId

    // STEP 2: Create the Supabase Auth account.
    try {
      const { data, error } = await this.authAdmin.createUser({
        email: input.email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { name: input.name }
      })

      if (error || !data?.user?.id) {
        throw new MemberRegistrationWorkflowError(
          'AUTH_CREATION_UNCONFIRMED',
          'Unable to confirm that the member login was created. Check Supabase Auth before retrying.',
          { status: 503, cause: error }
        )
      }

      authUserId = data.user.id

    } catch (error) {
      if (error instanceof MemberRegistrationWorkflowError) {
        throw error
      }

      throw new MemberRegistrationWorkflowError(
        'AUTH_CREATION_UNCONFIRMED',
        'Unable to confirm that the member login was created. Check Supabase Auth before retrying.',
        { status: 503, cause: error }
      )
    }

    // STEP 3: Save profile, subscription, and optional payment.
    try {
      const persisted = await this.repository.register({
        actorId,
        authUserId,
        input,
        planRecord,
        recordPayment,
        method
      })

      // STEP 4: Return only after successful database confirmation.
      return {
        persisted,
        authUserId,
        temporaryPassword
      }

    } catch (error) {

      // An unknown result might already have committed.
      // Do NOT delete the Auth account automatically.
      if (!isConfirmedRollback(error)) {
        throw new MemberRegistrationWorkflowError(
          'REGISTRATION_OUTCOME_UNCERTAIN',
          'Registration could not be confirmed. Check the member profile and Auth account before retrying.',
          { status: 503, cause: error }
        )
      }

      // PostgreSQL definitely rejected the transaction.
      // Clean up only the Auth account created by this workflow.
      try {
        const { error: cleanupError } =
          await this.authAdmin.deleteUser(authUserId)

        if (cleanupError) {
          throw cleanupError
        }

      } catch (cleanupError) {
        throw new MemberRegistrationWorkflowError(
          'AUTH_CLEANUP_UNCONFIRMED',
          'Database registration was rejected, but Auth cleanup needs review.',
          { status: 503, cause: cleanupError }
        )
      }

      const conflict = error.code === 'REGISTRATION_CONFLICT'

      throw new MemberRegistrationWorkflowError(
        conflict
          ? 'REGISTRATION_CONFLICT'
          : 'REGISTRATION_REJECTED',

        conflict
          ? 'A member account with conflicting details already exists.'
          : 'Registration was rejected by the database.',

        {
          status: conflict ? 409 : 400,
          cause: error
        }
      )
    }
  }
}
