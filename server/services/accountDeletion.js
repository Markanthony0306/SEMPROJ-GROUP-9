function deletionError(message, status = 503) {
  return Object.assign(new Error(message), { status })
}

export async function deleteMemberAccount({ supabase, account }) {
  if (!['user', 'member'].includes(account.role))
    throw deletionError('Administrator and staff accounts cannot be deleted here.', 403)
  if (!account.authUserId)
    throw deletionError(
      'This account is not linked to a login. Contact the gym administrator.',
      409
    )

  // Check the migration and account link before touching either photos or Auth.
  const { data: ready, error: checkError } = await supabase.rpc('check_fitpulse_account_deletion', {
    p_user_id: account.id,
    p_auth_user_id: account.authUserId
  })
  if (checkError)
    throw deletionError(
      'Account deletion is unavailable. Apply migration 006_delete_member_accounts.sql.'
    )
  if (ready !== true)
    throw deletionError(
      'The account link or cleanup setup changed. Check migrations 001 and 006, then refresh.',
      409
    )

  // Auth refuses deletion for users who own Storage objects. Remove this
  // member's private avatar folder first, including abandoned older uploads.
  const bucket = supabase.storage.from('avatars')
  const paths = []
  for (let offset = 0; ; offset += 100) {
    const { data: files, error } = await bucket.list(account.id, {
      limit: 100,
      offset,
      sortBy: { column: 'name', order: 'asc' }
    })
    if (error) throw deletionError('Unable to load the member photos. Please try again.')
    for (const file of files || []) paths.push(`${account.id}/${file.name}`)
    if (!files || files.length < 100) break
  }
  for (let index = 0; index < paths.length; index += 100) {
    const { error } = await bucket.remove(paths.slice(index, index + 100))
    if (error) throw deletionError('Unable to remove the member photos. Please try again.')
  }

  // The Auth -> profile cascade and migration 006 cleanup run in one database
  // transaction. If a related delete fails, Auth and the profile remain intact.
  const { error } = await supabase.auth.admin.deleteUser(account.authUserId)
  if (error) throw deletionError('Unable to delete the member login. Please try again.')
}
