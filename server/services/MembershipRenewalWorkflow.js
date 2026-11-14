
export class MembershipRenewalWorkflow {
  constructor({ service, repository }) {
    this.service = service
    this.repository = repository
  }

  async execute({ member, planRecord, paymentDetails, actorId }) {
    // 1. Preserve the original member information.
    const previousMember = structuredClone(member)

    // 2. Calculate the renewal without saving anything.
    const { member: renewedMember, payment } = this.service.renew(
      previousMember,
      planRecord,
      {
        ...paymentDetails,
        processedByUserId: actorId
      }
    )

    // 3. Save the renewal through the repository.
    const persisted = await this.repository.saveRenewal({
      previousMember,
      renewedMember,
      payment,
      planRecord,
      actorId
    })

    // 4. Return the result only after the database call succeeds.
    return {
      member: renewedMember,
      payment,
      persisted
    }
  }
}
