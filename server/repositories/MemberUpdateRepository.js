export class MemberUpdateRepositoryError extends Error {
  constructor(message, code) {
    super(message)

    this.name = 'MemberUpdateRepositoryError'
    this.code = code
  }
}

export class MemberUpdateRepository {
  constructor(supabase) {
    this.supabase = supabase
  }

  // 1. Find the member's linked Supabase Auth account.
  async getLinkedAuthUserId(memberId) {
    const { data, error } = await this.supabase
      .from('users')
      .select('auth_user_id')
      .eq('id', memberId)
      .maybeSingle()

    if (error) {
      throw new MemberUpdateRepositoryError(
        'Unable to find the member login account.',
        'AUTH_LOOKUP_FAILED'
      )
    }

    return data?.auth_user_id || null
  }

  // 2. Check whether another profile uses the requested email.
  async emailExistsForAnotherMember({ memberId, email }) {
    const { data, error } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', memberId)
      .maybeSingle()

    if (error) {
      throw new MemberUpdateRepositoryError(
        'Unable to check the member email.',
        'EMAIL_LOOKUP_FAILED'
      )
    }

    return Boolean(data)
  }

  // 3. Update a member's public profile.
  async updateProfile({ memberId, input }) {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        name: input.name,
        email: input.email,
        phone_number: input.phone || null
      })
      .eq('id', memberId)
      .select('id, name, email, phone_number')
      .maybeSingle()

    if (error || !data) {
      throw new MemberUpdateRepositoryError(
        'Unable to update the member profile. Verify the account before retrying.',
        'PROFILE_UPDATE_FAILED'
      )
    }

    return data
  }

  // 4. Atomically update profile details and membership plan.
  async updateDetailsAtomic({
    actorId,
    memberId,
    input,
    planChanged = false
  }) {
    const { data, error } = await this.supabase.rpc(
      'update_fitpulse_member_details_atomic',
      {
        p_actor_id: actorId,
        p_member_id: memberId,
        p_name: input.name,
        p_phone: input.phone,
        p_plan_name: planChanged ? input.plan : null
      }
    )

    if (error) {
      throw new MemberUpdateRepositoryError(
        'Unable to save the member details. Verify the account before retrying.',
        'DETAILS_UPDATE_FAILED'
      )
    }

    if (!data?.member || data.member.id !== memberId) {
      throw new MemberUpdateRepositoryError(
        'The member update returned an invalid result.',
        'DETAILS_UPDATE_INVALID_RESULT'
      )
    }

    return {
      updatedProfile: data.member,
      subscriptionId: data.subscription_id,
      planChanged: data.plan_changed
    }
  }

  // 5. Invalidate existing sessions before updating
  // the member's Supabase Auth password.
  async beginPasswordChange({ actorId, memberId }) {
    const { data, error } = await this.supabase.rpc(
      'begin_fitpulse_member_password_change',
      {
        p_actor_id: actorId,
        p_member_id: memberId
      }
    )

    if (
      error ||
      !Number.isSafeInteger(data) ||
      data < 1
    ) {
      throw new MemberUpdateRepositoryError(
        'Unable to invalidate existing member sessions.',
        'PASSWORD_SESSION_UPDATE_FAILED'
      )
    }

    return data
  }

  // 6. Mark the required password change as completed.
  // Only finalize the exact auth version reserved earlier.
  async completePasswordChange({
    memberId,
    authVersion
  }) {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        must_change_password: false
      })
      .eq('id', memberId)
      .eq('auth_version', authVersion)
      .select('id, auth_version, must_change_password')
      .maybeSingle()

    if (error || !data) {
      throw new MemberUpdateRepositoryError(
        'The password was changed, but its account state could not be finalized.',
        'PASSWORD_FINALIZATION_FAILED'
      )
    }

    return data
  }
}
