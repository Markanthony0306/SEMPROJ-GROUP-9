const PROFILE_COLUMNS =
  'id,auth_user_id,member_code,role_id,name,email,phone_number,status,must_change_password'

export function getProviderRole(role) {
  const normalizedRole = typeof role === 'string' ? role.toLowerCase() : ''
  if (normalizedRole === 'user') return 'member'
  return ['admin', 'staff', 'member'].includes(normalizedRole) ? normalizedRole : null
}

function serviceError(message, status = 503, code = 'SUPABASE_UNAVAILABLE') {
  const error = new Error(message)
  error.status = status
  error.code = code
  return error
}

function requireResult(result, message) {
  if (result?.error) throw serviceError(message)
  return result?.data
}

const normalizedEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '')
const isLinked = (account) => Boolean(account.supabaseAuthId && account.supabaseProfileId)

function accountPatch(profile) {
  return {
    supabaseAuthId: profile.auth_user_id,
    supabaseProfileId: profile.id,
    ...(profile.member_code ? { memberCode: profile.member_code } : {})
  }
}

function profileFields(profile, role) {
  return {
    ...accountPatch(profile),
    name: profile.name,
    email: normalizedEmail(profile.email),
    phone: profile.phone_number || '',
    must_change_password: Boolean(profile.must_change_password),
    accountStatus: profile.status,
    role: getProviderRole(role)
  }
}

function loginError(error) {
  if (['invalid_credentials', 'email_not_confirmed', 'user_banned'].includes(error?.code)) {
    return serviceError('Invalid email or password.', 401, 'INVALID_CREDENTIALS')
  }
  if (error?.status === 429 || error?.code === 'over_request_rate_limit') {
    return serviceError('Too many login attempts. Please try again later.', 429, 'AUTH_RATE_LIMIT')
  }
  return serviceError('Account authentication is unavailable. Please try again later.')
}

// All SDK instances are injected so tests cannot accidentally contact a real project.
export function createSupabaseAccountService({ adminClient, createAuthClient }) {
  if (!adminClient?.auth?.admin || typeof createAuthClient !== 'function') {
    throw new Error('Supabase account services require administrator and isolated Auth clients.')
  }
  let rolesPromise
  const createdAccounts = new Map()
  const accountLocks = new Map()

  async function withAccountLock(key, action) {
    const previous = accountLocks.get(key) || Promise.resolve()
    const pending = previous.catch(() => {}).then(action)
    accountLocks.set(key, pending)
    try {
      return await pending
    } finally {
      if (accountLocks.get(key) === pending) accountLocks.delete(key)
    }
  }

  function isolatedAuthClient() {
    const client = createAuthClient()
    if (!client?.auth || client === adminClient) {
      throw serviceError('Account authentication requires a separate Auth client.')
    }
    return client
  }

  async function roleDefinitions() {
    if (!rolesPromise) {
      rolesPromise = (async () => {
        const roles = requireResult(
          await adminClient.from('roles').select('role_id,role_name'),
          'Unable to verify account permissions.'
        )
        return (roles || []).map((role) => ({
          id: role.role_id,
          name: getProviderRole(role.role_name)
        }))
      })().catch((error) => {
        rolesPromise = null
        throw error
      })
    }
    return rolesPromise
  }

  async function trustedRole(account) {
    const role = getProviderRole(account.role)
    if (!role)
      throw serviceError('This account does not have a supported role.', 403, 'ROLE_DENIED')
    const providerRole = (await roleDefinitions()).find((item) => item.name === role)
    if (!providerRole) throw serviceError('The account role is not configured in Supabase.')
    return providerRole
  }

  async function findProfile(column, value) {
    const query = adminClient.from('users').select(PROFILE_COLUMNS)
    const lookup =
      column === 'email'
        ? query.ilike(column, value.replace(/[\\%_]/g, '\\$&'))
        : query.eq(column, value)
    return requireResult(await lookup.maybeSingle(), 'Unable to read the linked account profile.')
  }

  async function validateProfile(account, profile, authUser, { requireActive = false } = {}) {
    if (
      !profile ||
      !authUser ||
      profile.auth_user_id !== authUser.id ||
      (account.supabaseAuthId && account.supabaseAuthId !== authUser.id) ||
      (account.supabaseProfileId && account.supabaseProfileId !== profile.id) ||
      normalizedEmail(profile.email) !== normalizedEmail(authUser.email)
    ) {
      throw serviceError(
        'The account profile is not linked correctly.',
        403,
        'PROFILE_LINK_INVALID'
      )
    }
    const role = await trustedRole(account)
    if (Number(profile.role_id) !== Number(role.id)) {
      throw serviceError('The linked account role does not match FitPulse.', 403, 'ROLE_MISMATCH')
    }
    const accountStatus =
      Date.parse(authUser.banned_until) > Date.now() ? 'suspended' : profile.status
    if (requireActive && accountStatus !== 'active') {
      throw serviceError(
        'Your account is unavailable. Please contact the gym.',
        403,
        'ACCOUNT_INACTIVE'
      )
    }
    return { ...profile, status: accountStatus }
  }

  async function loadLinkedProfile(account) {
    if (!isLinked(account)) {
      throw serviceError('This account is not linked to Supabase.', 409, 'ACCOUNT_NOT_LINKED')
    }
    const [profile, authResult] = await Promise.all([
      findProfile('id', account.supabaseProfileId),
      adminClient.auth.admin.getUserById(account.supabaseAuthId)
    ])
    const authData = requireResult(authResult, 'Unable to verify the linked login account.')
    return validateProfile(account, profile, authData?.user)
  }

  async function findAuthCollision(account) {
    for (let page = 1; ; page += 1) {
      const data = requireResult(
        await adminClient.auth.admin.listUsers({ page, perPage: 500 }),
        'Unable to check for an existing login account.'
      )
      const users = data?.users || []
      const match = users.find(
        (user) =>
          user.id === account.id || normalizedEmail(user.email) === normalizedEmail(account.email)
      )
      if (match) return match
      if (users.length < 500) return null
    }
  }

  async function findCollision(account) {
    const [emailProfile, idProfile, authUser] = await Promise.all([
      findProfile('email', normalizedEmail(account.email)),
      findProfile('id', account.id),
      findAuthCollision(account)
    ])
    return { emailProfile, idProfile, authUser }
  }

  async function checkCollision(account) {
    const { emailProfile, idProfile, authUser } = await findCollision(account)
    return Boolean(emailProfile || idProfile || authUser)
  }

  async function deleteCreatedAccount(patch) {
    const key = `${patch?.supabaseAuthId}:${patch?.supabaseProfileId}`
    const created = createdAccounts.get(key)
    if (!created) {
      throw serviceError(
        'Only an account created by this operation can be rolled back.',
        409,
        'ROLLBACK_DENIED'
      )
    }
    requireResult(
      await adminClient
        .from('users')
        .delete()
        .eq('id', created.profileId)
        .eq('auth_user_id', created.authId),
      'The new profile could not be rolled back. Contact the administrator.'
    )
    requireResult(
      await adminClient.auth.admin.deleteUser(created.authId),
      'The new login could not be rolled back. Contact the administrator.'
    )
    createdAccounts.delete(key)
  }

  async function provisionAccount(account, passwordAttributes) {
    const role = await trustedRole(account)
    const authData = requireResult(
      await adminClient.auth.admin.createUser({
        id: account.id,
        email: normalizedEmail(account.email),
        ...passwordAttributes,
        email_confirm: true,
        app_metadata: { fitpulse_account_id: account.id, fitpulse_role: role.name },
        user_metadata: { name: account.name }
      }),
      'Unable to create the member login. The email may already be registered.'
    )
    const authId = authData?.user?.id
    if (!authId) throw serviceError('Supabase did not return the created login account.')
    let profile
    try {
      profile = requireResult(
        await adminClient
          .from('users')
          .insert({
            id: account.id,
            auth_user_id: authId,
            role_id: role.id,
            name: account.name,
            email: normalizedEmail(account.email),
            phone_number: account.phone || null,
            status: 'active',
            must_change_password: Boolean(account.must_change_password),
            ...(account.memberCode ? { member_code: account.memberCode } : {})
          })
          .select(PROFILE_COLUMNS)
          .single(),
        'Unable to create the member profile.'
      )
      if (!profile || profile.auth_user_id !== authId) {
        throw serviceError('Supabase did not return the created account profile.')
      }
    } catch (error) {
      const rollback = await adminClient.auth.admin.deleteUser(authId)
      if (rollback?.error) {
        throw serviceError(
          'Profile creation failed and the new login needs administrator cleanup.',
          503,
          'ROLLBACK_FAILED'
        )
      }
      throw error
    }
    const patch = accountPatch(profile)
    createdAccounts.set(`${authId}:${profile.id}`, { authId, profileId: profile.id })
    return { accountPatch: patch, pending: false }
  }

  async function importAccount(account) {
    return withAccountLock(normalizedEmail(account.email), async () => {
      if (isLinked(account)) {
        return { accountPatch: accountPatch(await loadLinkedProfile(account)), pending: false }
      }
      const { emailProfile, idProfile, authUser } = await findCollision(account)
      if (emailProfile || idProfile || authUser) {
        // Reuse only a previous import owned by this exact local account. This
        // makes retrying a migration safe when its cloud write preceded a crash.
        const ownedImport =
          idProfile?.id === account.id &&
          emailProfile?.id === account.id &&
          idProfile.auth_user_id === authUser?.id &&
          authUser?.app_metadata?.fitpulse_account_id === account.id &&
          normalizedEmail(idProfile.email) === normalizedEmail(account.email) &&
          normalizedEmail(authUser.email) === normalizedEmail(account.email)
        if (!ownedImport) return { pending: true }
        const profile = await validateProfile(account, idProfile, authUser)
        return { accountPatch: accountPatch(profile), pending: false }
      }
      if (typeof account.passwordHash !== 'string' || !/^\$2[aby]\$/.test(account.passwordHash)) {
        throw serviceError(
          'The existing password hash cannot be imported.',
          409,
          'HASH_IMPORT_UNSUPPORTED'
        )
      }
      return provisionAccount(account, { password_hash: account.passwordHash })
    })
  }

  async function login(account, password) {
    const imported = isLinked(account) ? null : await importAccount(account)
    const linkedAccount = { ...account, ...(imported?.accountPatch || {}) }
    const result = await isolatedAuthClient().auth.signInWithPassword({
      email: normalizedEmail(account.email),
      password
    })
    if (result?.error) {
      // A collision retains the local account until its owner proves cloud ownership.
      if (imported?.pending && result.error.code === 'invalid_credentials') return { pending: true }
      throw loginError(result.error)
    }
    const user = result?.data?.user
    const profile = user ? await findProfile('auth_user_id', user.id) : null
    const validatedProfile = await validateProfile(linkedAccount, profile, user, {
      requireActive: true
    })
    if (normalizedEmail(user.email) !== normalizedEmail(account.email)) {
      throw serviceError(
        'The linked login does not match this account.',
        403,
        'PROFILE_LINK_INVALID'
      )
    }
    return {
      accountPatch: accountPatch(profile),
      profile: profileFields(validatedProfile, account.role),
      user: { id: user.id, email: normalizedEmail(user.email) },
      pending: false
    }
  }

  async function verifyCurrentPassword(account, password) {
    try {
      const result = await login(account, password)
      return !result.pending
    } catch (error) {
      if (error.status === 401) return false
      throw error
    }
  }

  async function updateAccount(account, updates) {
    return withAccountLock(account.supabaseAuthId || account.id, async () => {
      const before = await loadLinkedProfile(account)
      const nextEmail = updates.email === undefined ? before.email : normalizedEmail(updates.email)
      const authUpdates = {
        ...(updates.email !== undefined && nextEmail !== normalizedEmail(before.email)
          ? { email: nextEmail, email_confirm: true }
          : {}),
        ...(updates.password !== undefined ? { password: updates.password } : {})
      }
      const authChanged = Object.keys(authUpdates).length > 0
      if (authChanged) {
        requireResult(
          await adminClient.auth.admin.updateUserById(account.supabaseAuthId, authUpdates),
          'Unable to update the login account.'
        )
      }
      const profileUpdates = {
        name: updates.name === undefined ? before.name : updates.name,
        email: nextEmail,
        phone_number: updates.phone === undefined ? before.phone_number : updates.phone || null,
        role_id: before.role_id,
        must_change_password:
          updates.must_change_password === undefined
            ? Boolean(before.must_change_password)
            : Boolean(updates.must_change_password)
      }
      let profile
      try {
        profile = requireResult(
          await adminClient
            .from('users')
            .update(profileUpdates)
            .eq('id', before.id)
            .eq('auth_user_id', account.supabaseAuthId)
            .select(PROFILE_COLUMNS)
            .single(),
          'Unable to update the account profile.'
        )
        if (!profile) throw serviceError('The linked profile was not updated.')
      } catch (error) {
        // A failed profile write may have committed before its network response failed.
        const rollback = await adminClient
          .from('users')
          .update({
            name: before.name,
            email: before.email,
            phone_number: before.phone_number,
            role_id: before.role_id,
            must_change_password: Boolean(before.must_change_password)
          })
          .eq('id', before.id)
          .eq('auth_user_id', account.supabaseAuthId)
        let emailRollbackError = null
        if (authUpdates.email) {
          const authRollback = await adminClient.auth.admin.updateUserById(account.supabaseAuthId, {
            email: before.email,
            email_confirm: true
          })
          emailRollbackError = authRollback?.error
        }
        const partial = serviceError(
          updates.password !== undefined
            ? 'The login password changed, but its profile could not be updated. Try signing in with the new password.'
            : 'The profile could not be updated. Please try again later.',
          503,
          rollback?.error || emailRollbackError ? 'ROLLBACK_FAILED' : 'PROFILE_UPDATE_FAILED'
        )
        partial.passwordChanged = updates.password !== undefined
        throw partial
      }
      return {
        accountPatch: accountPatch(profile),
        profile: profileFields(profile, account.role),
        pending: false
      }
    })
  }

  async function createAccount(account, password) {
    return withAccountLock(normalizedEmail(account.email), async () => {
      if (await checkCollision(account)) {
        throw serviceError('An account with this email already exists.', 409, 'ACCOUNT_EXISTS')
      }
      return provisionAccount(account, { password })
    })
  }

  async function verifyRecovery({ tokenHash, accessToken } = {}) {
    const client = isolatedAuthClient()
    let user
    if (typeof tokenHash === 'string' && tokenHash) {
      const result = await client.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
      if (result?.error) {
        throw serviceError('This reset link is invalid or has expired.', 400, 'RECOVERY_INVALID')
      }
      user = result?.data?.user
    } else if (typeof accessToken === 'string' && accessToken) {
      const result = await client.auth.getUser(accessToken)
      if (result?.error) {
        throw serviceError('This reset link is invalid or has expired.', 400, 'RECOVERY_INVALID')
      }
      user = result?.data?.user
      // getUser validates the signature with Supabase before claims are inspected.
      let claims
      try {
        claims = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'))
      } catch {
        throw serviceError('This reset link is invalid or has expired.', 400, 'RECOVERY_INVALID')
      }
      const recoveryMethod =
        Array.isArray(claims.amr) &&
        claims.amr.some((entry) =>
          typeof entry === 'string' ? entry === 'recovery' : entry?.method === 'recovery'
        )
      if (
        !recoveryMethod ||
        claims.sub !== user?.id ||
        !Number.isFinite(claims.exp) ||
        claims.exp * 1000 <= Date.now()
      ) {
        throw serviceError(
          'A verified password recovery link is required.',
          400,
          'RECOVERY_INVALID'
        )
      }
    }
    if (!user?.id) {
      throw serviceError('This reset link is invalid or has expired.', 400, 'RECOVERY_INVALID')
    }
    return user.id
  }

  async function generateRecovery(account) {
    await loadLinkedProfile(account)
    const data = requireResult(
      await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email: normalizedEmail(account.email)
      }),
      'Unable to prepare the password recovery email.'
    )
    if (!data?.properties?.hashed_token)
      throw serviceError('The recovery link could not be created.')
    return data.properties.hashed_token
  }

  return {
    importAccount,
    login,
    verifyCurrentPassword,
    updateAccount,
    loadProfile: async (account) => profileFields(await loadLinkedProfile(account), account.role),
    createAccount,
    deleteCreatedAccount,
    verifyRecovery,
    updatePassword: (account, password, { mustChangePassword = false } = {}) =>
      updateAccount(account, { password, must_change_password: mustChangePassword }),
    generateRecovery
  }
}
