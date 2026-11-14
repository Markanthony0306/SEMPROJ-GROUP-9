
import {
  ProfileUpdateError
} from './ProfileUpdateService.js'

export class ProfileUpdateWorkflow {
  constructor({ service, repository }) {
    this.service = service
    this.repository = repository
  }

  async execute({ actorId, body }) {
    // STEP 1: Preserve the password-change restriction.
    this.service.validateRequest(body)

    // STEP 2: Load the current profile.
    const database = await this.repository.loadAccounts()

    const account = database.accounts.find(
      (item) => item.id === actorId
    )

    // STEP 3: Validate inputs and duplicate emails.
    const prepared = this.service.prepare(
      account,
      database.accounts,
      body
    )

    const {
      input,
      previousName,
      previousEmail,
      emailChanged,
      needsAuthUpdate
    } = prepared

    const { data: existingProfile, error: lookupError } =
      await this.repository.findDuplicateEmail(
        input.email,
        account.id
      )

    if (lookupError) {
      throw new ProfileUpdateError(
        'Unable to verify the email address.',
        503
      )
    }

    if (existingProfile) {
      throw new ProfileUpdateError(
        'An account with this email already exists.',
        409
      )
    }

    if (needsAuthUpdate && !account.authUserId) {
      throw new ProfileUpdateError(
        'This profile is not linked to a Supabase login.',
        409
      )
    }

    // STEP 4: Synchronize Supabase Auth first.
    let authUpdated = false

    if (needsAuthUpdate) {
      const updates = this.service.buildAuthUpdates(
        input,
        emailChanged
      )

      const { error: authError } =
        await this.repository.updateAuthUser(
          account.authUserId,
          updates
        )

      if (authError) {
        console.error(
          'Profile Auth update failed:',
          authError.code || authError.message
        )

        throw new ProfileUpdateError(
          'Unable to update your logindetails.',
          503
        )
      }

      authUpdated = true
    }

    // STEP 5: Save the public profile.
    let updatedProfile = null
    let profileError = null

    try {
      const { data, error } =
        await this.repository.updateProfile(
          account.id,
          input
        )

      updatedProfile = data
      profileError = error
    } catch (error) {
      profileError = error
    }

    // STEP 6: Preserve the original rollback behavior.
    if (profileError || !updatedProfile) {
      if (authUpdated) {
        try {
          const rollback = {
            user_metadata: { name: previousName }
          }

          if (emailChanged) {
            rollback.email = previousEmail
            rollback.email_confirm = true
          }

          const { error: rollbackError } =
            await this.repository.updateAuthUser(
              account.authUserId,
              rollback
            )

          if (rollbackError) {
            console.error(
              'Profile Auth rollback failed:',
              rollbackError.code || rollbackError.message
            )
          }
        } catch (rollbackError) {
          console.error(
            'Profile rollback unavailable:',
            rollbackError.code || rollbackError.name
          )
        }
      }

      console.error(
        'Profile database update failed:',
        profileError?.code || 'PROFILE_NOT_UPDATED'
      )

      throw new ProfileUpdateError(
        'Unable to complete the profile update. If your login details changed, contact the administrator before retrying.',
        503
      )
    }

    // STEP 7: Return the successfully updated account.
    return this.service.applyUpdatedProfile(
      account,
      updatedProfile
    )
  }
}
