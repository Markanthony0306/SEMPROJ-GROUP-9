
export class MemberDeactivationRepository {
  constructor(supabase) {
    this.supabase = supabase
  }

  async deactivate({ actorId, memberId }) {
    const { data, error } = await this.supabase.rpc(
      'deactivate_fitpulse_member_atomic',
      {
        p_actor_id: actorId,
        p_member_id: memberId
      }
    )

    if (error) {
      console.error('Member deactivation RPC failed:', {
        code: error.code,
        message: error.message
      })

      const knownErrors = {
        INVALID_MEMBER_INPUT: {
          message: 'Invalid member information.',
          status: 400
        },
        DEACTIVATION_NOT_ALLOWED: {
          message: 'You are not authorized to deactivate this member.',
          status: 403
        },
        MEMBER_NOT_FOUND: {
          message: 'Member account not found.',
          status: 404
        }
      }

      const failure = knownErrors[error.message] || {
        message: 'Unable to deactivate the member account.',
        status: 503
      }

      throw Object.assign(
        new Error(failure.message),
        { status: failure.status }
      )
    }

    if (!data || data.status !== 'inactive') {
      throw Object.assign(
        new Error('Member deactivation could not be verified.'),
        { status: 503 }
      )
    }

    return data
  }
}
