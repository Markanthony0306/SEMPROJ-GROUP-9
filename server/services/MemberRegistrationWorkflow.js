import { createHash } from 'node:crypto'
import { composeMemberName } from '../../shared/memberName.js'


const CONFIRMED_SQL_REJECTIONS = new Set([
  'REGISTRATION_INVALID_INPUT',
  'REGISTRATION_FORBIDDEN',
  'REGISTRATION_AUTH_USER_INVALID',
  'REGISTRATION_MEMBER_ROLE_MISSING',
  'REGISTRATION_PLAN_UNAVAILABLE',
  'REGISTRATION_PAYMENT_METHOD_UNAVAILABLE',
  'REGISTRATION_FACE_INVALID',
  'REGISTRATION_INVALID_RESULT'
])


// Avoid printing members' full email addresses in diagnostic logs.
function identityDiagnostic(email) {
  const normalized = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const [local, domain] = normalized.split('@')
  let projectHost = null
  try { projectHost = new URL(process.env.SUPABASE_URL).hostname } catch { /* unavailable */ }
  return {
    submittedEmailHint: local && domain ? `${local.slice(0, 2)}***@${domain}` : '(invalid)',
    submittedEmailFingerprint: normalized
      ? createHash('sha256').update(normalized).digest('hex').slice(0, 16)
      : null,
    supabaseProject: projectHost
  }
}

// Opt-in Auth diagnostics. Never log request credentials or the response user object.
function logAuthCreationDiagnostic(stage, error, email) {
  if (process.env.FITPULSE_AUTH_DEBUG !== '1') return

  // Supabase errors occasionally contain account emails; redact them in logs.
  const safeMessage = typeof error?.message === 'string'
    ? error.message
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
      .slice(0, 500)
    : null

  console.error('FitPulse Auth creation diagnostic:', {
    stage,
    ...identityDiagnostic(email),
    errorName: typeof error?.name === 'string' ? error.name : null,
    authCode: typeof error?.code === 'string' ? error.code : null,
    authStatus: Number.isInteger(error?.status) ? error.status : null,
    authMessage: safeMessage
  })
}

export class MemberRegistrationWorkflowError extends Error {
  constructor(code, message, { status = 500, cause } = {}) {
    super(message, { cause })

    this.name = 'MemberRegistrationWorkflowError'
    this.code = code
    this.status = status
  }
}

// Release only the Auth user created for a registration that definitely rolled back.
export async function cleanupRejectedAuthUser(authAdmin, authUserId) {
  try {
    const { error } = await authAdmin.deleteUser(authUserId)
    if (error) throw error
  } catch (cause) {
    throw new MemberRegistrationWorkflowError(
      'AUTH_CLEANUP_UNCONFIRMED',
      'Database registration was rejected, but Auth cleanup needs review.',
      { status: 503, cause }
    )
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
      method,
      enrollment
    } = prepared
    const registrationInput = input.firstName && input.lastName
      ? { ...input, name: composeMemberName(input.firstName, input.lastName) }
      : input

    // STEP 1: Generate the temporary password.
    const temporaryPassword = this.generateTemporaryPassword()

    let authUserId

    // STEP 2: Create the Supabase Auth account.
    try {
      const { data, error } = await this.authAdmin.createUser({
        email: registrationInput.email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { name: registrationInput.name }
      })

      if (error || !data?.user?.id) {
        logAuthCreationDiagnostic(error ? 'auth_api_rejected' : 'auth_user_id_missing', error, registrationInput.email)
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

      logAuthCreationDiagnostic('auth_api_exception', error, registrationInput.email)
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
        input: registrationInput,
        planRecord,
        recordPayment,
        method,
        enrollment
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
      await cleanupRejectedAuthUser(this.authAdmin, authUserId)

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
