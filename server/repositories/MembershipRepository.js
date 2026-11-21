
export class MembershipRepository {
  constructor(supabase) {
    if (!supabase || typeof supabase.rpc !== 'function') {
      throw new TypeError(
        'MembershipRepository requires a Supabase client with rpc().'
      )
    }

    this.supabase = supabase
  }

  async saveRenewal({
    previousMember,
    renewedMember,
    payment,
    planRecord,
    actorId
  }) {
    const payload = {
      p_member_id: previousMember.id,
      p_actor_id: actorId,
      p_plan_id: planRecord.plan_id,
      p_method_name: payment.method,
      p_amount: payment.amount,
      p_expected_subscription_id:
        previousMember.subscriptionId ?? null,
      p_new_subscription_id: renewedMember.subscriptionId,
      p_new_payment_id: payment.id,
      p_start_date: renewedMember.membershipStart,
      p_end_date: renewedMember.membershipEnd,
      p_renewed_at: renewedMember.subscriptionCreatedAt
    }

    const { data, error } = await this.supabase.rpc(
      'renew_fitpulse_membership_atomic',
      payload
    )

    if (error) {
      console.error('MEMBERSHIP RENEWAL RPC ERROR:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })

      const conflict = error.message === 'MEMBERSHIP_RENEWAL_CONFLICT'
      const failure = new Error(
        conflict
          ? 'Membership changed during renewal. Refresh and try again.'
          : 'Unable to save membership renewal.'
      )
      failure.code = conflict
        ? 'MEMBERSHIP_RENEWAL_CONFLICT'
        : 'MEMBERSHIP_SAVE_FAILED'
      failure.cause = error
      throw failure
    }

    return data
  }
}
