import { ChangePasswordError } from './ChangePasswordService.js'

/** Coordinates the existing Auth password update and session invalidation. */
export class ChangePasswordWorkflow {
  constructor({ service, repository, authenticatePassword, createAuthClient }) {
    this.service = service
    this.repository = repository
    this.authenticatePassword = authenticatePassword
    this.createAuthClient = createAuthClient
  }

  async execute({ actorId, body }) {
    // Validate before making database calls, just like the existing route.
    const { currentPassword, password } = this.service.validate(body)

    const database = await this.repository.loadAccounts()
    const account = database.accounts.find((item) => item.id === actorId)
    if (!account) {
      throw new ChangePasswordError('Account not found.', 404)
    }

    const { data: profile, error: profileError } =
      await this.repository.findLinkedProfile(account.id)

    if (profileError || !profile?.auth_user_id || !profile.email) {
      console.error(
        'Password change: linked profile lookup failed:',
        profileError?.message || 'Missing linked Auth user or email.'
      )
      throw new ChangePasswordError(
        'Unable to verify your account. Please try again.',
        500
      )
    }

    const authUser = await this.authenticatePassword({
      createAuthClient: this.createAuthClient,
      email: profile.email,
      password: currentPassword
    })

    if (authUser.id !== profile.auth_user_id) {
      throw new ChangePasswordError('Current password is incorrect.', 400)
    }

    const { error: updateError } = await this.repository.updateAuthPassword(
      profile.auth_user_id,
      password
    )

    if (updateError) {
      console.error('Supabase password update failed:', updateError.message)
      throw new ChangePasswordError(
        'Unable to update your password. Please try again.',
        500
      )
    }

    // Preserve the existing order: update Auth, then update the profile state.
    this.service.markPasswordChanged(account)
    await this.repository.save(database)

    return account
  }
}
