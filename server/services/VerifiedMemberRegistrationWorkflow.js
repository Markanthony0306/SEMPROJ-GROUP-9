import { MemberIdError, requireMemberIdProof } from './memberIdRecords.js'
import { MemberRegistrationWorkflowError } from './MemberRegistrationWorkflow.js'

export class VerifiedMemberRegistrationWorkflow {
  constructor({ repository, authAdmin, generateTemporaryPassword }) {
    this.repository = repository
    this.authAdmin = authAdmin
    this.generateTemporaryPassword = generateTemporaryPassword
  }

  async execute({ actor, prepared, verificationId, faceKey }) {
    const { input, planRecord, recordPayment, method } = prepared
    if (!verificationId || typeof verificationId !== 'string')
      throw new MemberIdError(409, 'Complete ID and face verification before creating this account.', 'ID_VERIFICATION_REQUIRED')
    await requireMemberIdProof(this.repository.supabase, actor, input, verificationId)
    const temporaryPassword = this.generateTemporaryPassword()
    const { data: auth, error: authError } = await this.authAdmin.createUser({
      email: input.email, password: temporaryPassword, email_confirm: true,
      user_metadata: { name: input.name }, app_metadata: { fitpulse_member_signup: true }
    })
    if (authError || !auth?.user?.id)
      throw new MemberRegistrationWorkflowError('AUTH_CREATION_UNCONFIRMED',
        'Unable to confirm member login creation. Check Supabase Auth before retrying.',
        { status: 503, cause: authError })
    try {
      const saved = await this.repository.register({
        actorId: actor.id, authUserId: auth.user.id, input, verificationId,
        planRecord, recordPayment, method, faceKey
      })
      return { ...saved, temporaryPassword }
    } catch (error) {
      // The DB may have committed despite a lost network reply. Preserve the Auth
      // user until the operator verifies both Auth and profile state manually.
      if (error instanceof MemberIdError) throw error
      throw new MemberRegistrationWorkflowError('ENROLLMENT_OUTCOME_UNCERTAIN',
        'Enrollment could not be confirmed. Check member records and Supabase Auth before retrying.',
        { status: 503, cause: error })
    }
  }
}
