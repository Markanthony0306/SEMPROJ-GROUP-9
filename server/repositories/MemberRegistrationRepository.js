
export class MemberRegistrationPersistenceError extends Error {
  constructor(code, message, cause) {
    super(message, { cause })

    this.name = 'MemberRegistrationPersistenceError'
    this.code = code
  }
}

export class MemberRegistrationRepository {
  constructor(supabase) {
    if (!supabase || typeof supabase.rpc !== 'function') {
      throw new TypeError(
        'MemberRegistrationRepository requires a Supabase client with rpc().'
      )
    }

    this.supabase = supabase
  }

  async register({
    actorId,
    authUserId,
    input,
    planRecord,
    recordPayment = false,
    method
  }) {
    // 1. Convert application values into SQL function parameters.
    const payload = {
      p_actor_id: actorId,
      p_auth_user_id: authUserId,
      p_name: input.name,
      p_email: input.email,
      p_phone: input.phone || null,
      p_plan_id: planRecord.plan_id,
      p_record_payment: recordPayment === true,
      p_method_name: recordPayment === true ? method : null
    }

    // 2. Execute the atomic PostgreSQL registration function.
    const { data, error } = await this.supabase.rpc(
      'register_fitpulse_member_atomic',
      payload
    )

    // 3. Handle database errors.
    if (error) {
      const isConflict = error.code === '23505'

      throw new MemberRegistrationPersistenceError(
        isConflict
          ? 'REGISTRATION_CONFLICT'
          : 'REGISTRATION_SAVE_FAILED',

        isConflict
          ? 'A member account with conflicting details already exists.'
          : 'Unable to save member registration.',

        error
      )
    }

    // 4. Verify that the database returned the required identifiers.
    if (!data || !data.member_id || !data.subscription_id) {
      throw new MemberRegistrationPersistenceError(
        'REGISTRATION_INVALID_RESULT',
        'Member registration did not return the expected records.'
      )
    }

    // 5. Return the saved registration information.
    return data
  }
}
