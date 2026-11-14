
export class MemberDeactivationWorkflow {
  constructor({ service, repository }) {
    this.service = service
    this.repository = repository
  }

  async execute({ actor, member }) {
    // STEP 1: Validate the accounts.
    this.service.validate({ actor, member })

    // STEP 2: Deactivate the member in PostgreSQL.
    const result = await this.repository.deactivate({
      actorId: actor.id,
      memberId: member.id
    })

    // STEP 3: Return the saved account status.
    return {
      memberId: result.member_id,
      status: result.status,
      authVersion: result.auth_version
    }
  }
}
