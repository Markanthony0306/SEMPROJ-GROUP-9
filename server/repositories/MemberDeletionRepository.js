
function deletionError(message, status = 503) {
  return Object.assign(new Error(message), { status })
}

export class MemberDeletionRepository {
  constructor(supabase) {
    this.supabase = supabase
  }

  // 1. Verify the deletion setup and account linkage.
  async checkDeletionReady(account) {
    const { data: ready, error } =
      await this.supabase.rpc(
        'fitpulse_member_deletion_readiness',
        {
          p_user_id: account.id,
          p_auth_user_id: account.authUserId
        }
      )

    if (error) {
      throw deletionError(
        error.code === 'PGRST202'
          ? 'Account deletion requires Supabase migration 023_member_deletion_readiness.sql.'
          : 'Supabase could not check the member’s login link. Please try again.'
      )
    }

    const issues = {
      profile_link_changed: 'This member’s login link changed. Refresh the member list and try again.',
      login_missing: 'This profile points to a Supabase login that no longer exists.',
      cascade_missing: 'The Supabase login-to-profile cascade is missing. Check migration 023.',
      cleanup_missing: 'The member history cleanup trigger is disabled or missing. Check migration 023.'
    }
    if (ready !== 'ready')
      throw deletionError(issues[ready] || 'Supabase returned an invalid deletion check result.', 409)

    return true
  }

  // 2. Find every avatar belonging to the member.
  async listAvatarPaths(memberId) {
    const bucket = this.supabase.storage.from('avatars')
    const paths = []

    for (let offset = 0; ; offset += 100) {
      const { data: files, error } = await bucket.list(
        memberId,
        {
          limit: 100,
          offset,
          sortBy: {
            column: 'name',
            order: 'asc'
          }
        }
      )

      if (error) {
        throw deletionError(
          'Unable to load the member photos. Please try again.'
        )
      }

      for (const file of files || []) {
        paths.push(`${memberId}/${file.name}`)
      }

      if (!files || files.length < 100) {
        break
      }
    }

    return paths
  }

  // 3. Remove one batch of member photos.
  async removeAvatarBatch(paths) {
    if (!paths.length) return

    const { error } = await this.supabase.storage
      .from('avatars')
      .remove(paths)

    if (error) {
      throw deletionError(
        'Unable to remove the member photos. Please try again.'
      )
    }
  }

  // 4. Delete the Supabase Auth account.
  // The Auth cascade and cleanup trigger remove the dependent database records.
  async deleteAuthUser(authUserId) {
    const { error } =
      await this.supabase.auth.admin.deleteUser(
        authUserId
      )

    if (error) {
      throw deletionError(
        'Supabase could not remove this login and its linked records. Check the Auth logs for the database or Storage error.'
      )
    }
  }
}
