import crypto from 'node:crypto'
import { withFaceEnrollmentLock } from '../services/faceVerification.js'
import { assertUniqueStagedFace, MemberIdError } from '../services/memberIdRecords.js'

export class VerifiedMemberRegistrationRepository {
  constructor(supabase) { this.supabase = supabase }

  async register({ actorId, authUserId, input, verificationId, planRecord, recordPayment, method, faceKey }) {
    const now = new Date().toISOString()
    const duration = Number(planRecord.duration_days)
    const end = new Date(now)
    end.setDate(end.getDate() + duration)
    const { data: methodRow, error: methodError } = recordPayment
      ? await this.supabase.from('payment_methods').select('method_id').ilike('method_name', method).maybeSingle()
      : { data: null, error: null }
    if (methodError) throw methodError
    if (recordPayment && !methodRow) throw new MemberIdError(400, 'The payment method is unavailable.')

    const memberId = crypto.randomUUID()
    const subscriptionId = crypto.randomUUID()
    return withFaceEnrollmentLock(async () => {
      await assertUniqueStagedFace(this.supabase, verificationId, faceKey)
      const { data, error } = await this.supabase.rpc('create_fitpulse_enrolled_member', {
        p_profile: {
          id: memberId, auth_user_id: authUserId, role_id: await this.memberRoleId(),
          name: input.name, email: input.email, phone_number: input.phone || null,
          must_change_password: true, id_verification_id: verificationId,
          id_verification_actor: actorId, created_at: now
        },
        p_subscription: {
          subscription_id: subscriptionId, plan_id: planRecord.plan_id,
          start_date: now, end_date: end.toISOString()
        },
        p_payment: methodRow ? {
          payment_id: crypto.randomUUID(), method_id: methodRow.method_id,
          amount_paid: Number(planRecord.price), legacy_plan_name: planRecord.plan_name
        } : null
      }).single()
      if (error?.code === 'PGRST202')
        throw new MemberIdError(503, 'The member enrollment schema is not installed on FitPulse-Test.')
      if (['23505','23514'].includes(error?.code))
        throw new MemberIdError(409, 'The ID, email, or enrollment is already linked, or the verification has changed.')
      if (error || !data) throw error || new Error('Member enrollment result was not returned.')
      return { profile: data, authUserId, now, membershipEnd: end.toISOString(), subscriptionId }
    })
  }

  async memberRoleId() {
    const { data, error } = await this.supabase.from('roles').select('role_id').ilike('role_name','member').maybeSingle()
    if (error || !data) throw error || new Error('Member role is missing from the database.')
    return data.role_id
  }
}
