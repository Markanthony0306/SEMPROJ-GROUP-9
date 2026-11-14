const PERMANENT_MEMBER_DELETION_ENABLED = false
export class MemberDeletionWorkflow {
  constructor({ service, repository }) {
    this.service = service
    this.repository = repository
  }

  // Coordinate the complete deletion process.
  async execute({ account, beforeDelete }) {
    // Phase 4 safety guard:
    // Preserve member accounts and transaction history.
    if (!PERMANENT_MEMBER_DELETION_ENABLED) {
      throw Object.assign(
        new Error(
          'Permanent member deletion is temporarily disabled.'
        ),
        {
          status: 409,
          code: 'PERMANENT_MEMBER_DELETION_DISABLED'
        }
      )
    }
    // STEP 1: Validate the target account.
    this.service.validate(account)

    // STEP 2: Check database migration and Auth linkage.
    await this.repository.checkDeletionReady(account)

    // STEP 3: Recheck membership state when requested.
    // Automatic cleanup uses this to protect renewed members.
    await beforeDelete?.(account)

    // STEP 4: Collect all member avatar paths.
    const paths =
      await this.repository.listAvatarPaths(account.id)

    // STEP 5: Delete photos in batches of 100.
    for (
      let index = 0;
      index < paths.length;
      index += 100
    ) {
      // Check again before each destructive batch.
      await beforeDelete?.(account)

      await this.repository.removeAvatarBatch(
        paths.slice(index, index + 100)
      )
    }

    // STEP 6: Final membership revalidation.
    await beforeDelete?.(account)

    // STEP 7: Delete the Auth account.
    // Database cleanup follows the existing cascade.
    await this.repository.deleteAuthUser(
      account.authUserId
    )
  }
}
