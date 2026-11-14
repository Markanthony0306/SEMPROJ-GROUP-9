import { withMemberAccountLock } from '../lib/memberAccountLock.js'

const deletionAuditTable = 'member_account_deletion_audit'

function deletionError(message, status = 503, cause) {
  return Object.assign(new Error(message, { cause }), { status })
}

export async function deleteMemberAccount({ supabase, account, beforeDelete }) {
  if (!['user', 'member'].includes(account.role))
    throw deletionError('Administrator and staff accounts cannot be deleted here.', 403)
  if (!account.authUserId)
    throw deletionError(
      'This account is not linked to a login. Contact the gym administrator.',
      409
    )

  // Check the account link and all required cleanup triggers before touching
  // Storage, which is outside the transaction that deletes the login.
  const check = account.idVerified
    ? 'check_fitpulse_account_deletion_with_id'
    : 'check_fitpulse_account_deletion'
  const migration = account.idVerified
    ? '013_member_id_account_deletion.sql'
    : '006_delete_member_accounts.sql'
  const { data: ready, error: checkError } = await supabase.rpc(check, {
    p_user_id: account.id,
    p_auth_user_id: account.authUserId
  })
  if (checkError) {
    const message = ['PGRST202', '42883'].includes(checkError.code)
      ? `Account deletion setup is missing. Apply ${migration} in Supabase.`
      : 'Unable to check account deletion setup. Please try again.'
    throw deletionError(message, 503, checkError)
  }
  if (ready !== true)
    throw deletionError(
      `The account link or cleanup setup changed. Check migration 001 and ${migration}, then refresh.`,
      409
    )

  // Scheduled cleanup rechecks expiry so a renewed membership is preserved.
  await beforeDelete?.(account)

  await removeMemberPhotos(supabase, account.id, () => beforeDelete?.(account))

  // Auth, the linked profile, and its database records are deleted in one transaction.
  await beforeDelete?.(account)
  const { error } = await supabase.auth.admin.deleteUser(account.authUserId)
  if (error) throw deletionError('Unable to delete the member login. Please try again.', 503, error)
}

async function removeMemberPhotos(supabase, memberId, beforeRemove) {
  const bucket = supabase.storage.from('avatars')
  const paths = []
  for (let offset = 0; ; offset += 100) {
    const { data: files, error } = await bucket.list(memberId, {
      limit: 100,
      offset,
      sortBy: { column: 'name', order: 'asc' }
    })
    if (error)
      throw deletionError('Unable to load the member photos. Please try again.', 503, error)
    for (const file of files || []) paths.push(`${memberId}/${file.name}`)
    if (!files || files.length < 100) break
  }
  for (let index = 0; index < paths.length; index += 100) {
    // A renewal may arrive while Storage.list is loading several pages.
    await beforeRemove?.()
    const { error } = await bucket.remove(paths.slice(index, index + 100))
    if (error)
      throw deletionError('Unable to remove the member photos. Please try again.', 503, error)
  }
}

async function finishPhotoCleanup(supabase, memberId) {
  const { data: entry, error: lookupError } = await supabase
    .from(deletionAuditTable)
    .select('photos_cleaned_at')
    .eq('member_id', memberId)
    .single()
  if (lookupError || !entry) throw lookupError || new Error('Deletion audit entry is missing.')
  if (entry.photos_cleaned_at) return

  await removeMemberPhotos(supabase, memberId)
  const { error } = await supabase
    .from(deletionAuditTable)
    .update({ photos_cleaned_at: new Date().toISOString() })
    .eq('member_id', memberId)
  if (error) throw error
}

export function deleteMemberAccountAsAdmin({ supabase, actor, memberId }) {
  return withMemberAccountLock(memberId, async () => {
    const { data, error } = await supabase.rpc('delete_fitpulse_member_account', {
      p_actor_id: actor.id,
      p_actor_auth_version: actor.authVersion || 0,
      p_member_id: memberId
    })
    if (error?.code === '42501') throw deletionError('Account deletion is forbidden.', 403)
    if (['P0002', '22P02'].includes(error?.code))
      throw deletionError('Member account not found.', 404)
    if (error?.code === '23514')
      throw deletionError('The member login or cleanup setup is unavailable.', 409)
    if (error?.code === 'PGRST202')
      throw deletionError('Account deletion requires Supabase migration 015.', 503, error)
    if (error || data !== true)
      throw deletionError('Unable to delete the member account. Try again.', 503, error)

    try {
      await finishPhotoCleanup(supabase, memberId)
    } catch (cause) {
      throw deletionError('Account removed. Photo cleanup is pending. Try again.', 503, cause)
    }
  })
}

export function startMemberPhotoCleanup(supabase) {
  let stopped = false

  async function retry() {
    try {
      let cursor
      for (;;) {
        let query = supabase
          .from(deletionAuditTable)
          .select('member_id')
          .is('photos_cleaned_at', null)
          .order('member_id')
          .limit(100)
        if (cursor) query = query.gt('member_id', cursor)
        const { data, error } = await query
        if (error) throw error
        for (const { member_id: memberId } of data) {
          try {
            await withMemberAccountLock(memberId, () => finishPhotoCleanup(supabase, memberId))
          } catch {
            console.error('Member photo cleanup failed. It will be retried.')
          }
        }
        if (data.length < 100) break
        cursor = data.at(-1).member_id
      }
    } catch (error) {
      console.error('Could not read pending member photo cleanup:', error.code || 'CLEANUP_ERROR')
    } finally {
      if (!stopped) {
        timer = setTimeout(retry, 60_000)
        timer.unref()
      }
    }
  }
  // Schedule the first check after startup and avoid overlapping batches.
  let timer = setTimeout(retry, 60_000)
  timer.unref()
  return () => {
    stopped = true
    clearTimeout(timer)
  }
}
