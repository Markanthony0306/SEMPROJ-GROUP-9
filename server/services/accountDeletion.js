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
    if (error) throw deletionError('Unable to load the member photos. Please try again.', 503, error)
    for (const file of files || []) paths.push(`${account.id}/${file.name}`)
    if (!files || files.length < 100) break
  }
  for (let index = 0; index < paths.length; index += 100) {
    // A renewal may arrive while Storage.list is loading several pages.
    await beforeDelete?.(account)
    const { error } = await bucket.remove(paths.slice(index, index + 100))
    if (error) throw deletionError('Unable to remove the member photos. Please try again.', 503, error)
  }

  // Auth, the linked profile, and its database records are deleted in one transaction.
  await beforeDelete?.(account)
  const { error } = await supabase.auth.admin.deleteUser(account.authUserId)
  if (error) throw deletionError('Unable to delete the member login. Please try again.', 503, error)
}
