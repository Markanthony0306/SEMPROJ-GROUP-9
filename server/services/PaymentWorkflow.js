
export class PaymentWorkflow {
  constructor({ service, repository }) {
    this.service = service
    this.repository = repository
  }

  // Coordinate the complete payment process.
  async execute({ body, actorId }) {
    // STEP 1: Validate the submitted payment.
    const input = this.service.validateInput(body)

    // STEP 2: Load member and payment configuration.
    const database = await this.repository.loadContext()

    // STEP 3: Prepare the payment.
    const { payment, methodId } =
      this.service.prepare({
        input,
        database,
        processedByUserId: actorId
      })

    // STEP 4: Save the payment to Supabase.
    const savedPayment =
      await this.repository.recordPayment({
        payment,
        methodId
      })

    // STEP 5: Return the recorded payment.
    return savedPayment
  }
}
