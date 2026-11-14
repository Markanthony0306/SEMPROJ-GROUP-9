
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
        'check_fitpulse_account_deletion',
        {
          p_user_id: account.id,
          p_auth_user_id: account.authUserId
        }
      )

    if (error) {
      throw deletionError(
        'Account deletion is unavailable. Apply migration 006_delete_member_accounts.sql.'
      )
    }

    if (ready !== true) {
      throw deletionError(
        'The account link or cleanup setup changed. Check migrations 001 and 006, then refresh.',
        409
      )
    }

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
  // Migration 006 handles the dependent database records.
  async deleteAuthUser(authUserId) {
    const { error } =
      await this.supabase.auth.admin.deleteUser(
        authUserId
      )

    if (error) {
      throw deletionError(
        'Unable to delete the member login. Please try again.'
      )
    }
  }
}
