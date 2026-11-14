
export class MemberRegistrationError extends Error {
  constructor(message, status = 400) {
    super(message)

    this.name = 'MemberRegistrationError'
    this.status = status
  }
}

export class MemberRegistrationService {
  constructor({
    validAccountInput,
    paymentMethod,
    availablePlan
  }) {
    this.validAccountInput = validAccountInput
    this.paymentMethod = paymentMethod
    this.availablePlan = availablePlan
  }

  prepare({ body = {}, database }) {
    // 1. Validate basic member information.
    const input = this.validAccountInput(body)

    if (input.error) {
      throw new MemberRegistrationError(input.error)
    }

    // 2. Check whether payment recording is requested.
    const method = this.paymentMethod(body)
    const recordPayment = body.recordPayment === true

    if (recordPayment && !method) {
      throw new MemberRegistrationError(
        'Choose Cash or GCash for a recorded payment.'
      )
    }

    // 3. Find an active membership plan.
    const planRecord = database.membershipPlans.find(
      (plan) => this.availablePlan(plan, input.plan)
    )

    if (!planRecord) {
      throw new MemberRegistrationError(
        `The ${input.plan} membership plan is not active in Supabase.`
      )
    }

    // 4. Verify the configured payment method.
    if (
      recordPayment &&
      !database.paymentMethods.some(
        (item) =>
          String(item.method_name).toLowerCase() ===
          String(method).toLowerCase()
      )
    ) {
      throw new MemberRegistrationError(
        `The ${method} payment method is not configured in Supabase.`
      )
    }

    // 5. Check for duplicate emails in the loaded accounts.
    const duplicate = database.accounts.some(
      (account) =>
        String(account.email).toLowerCase() === input.email
    )

    if (duplicate) {
      throw new MemberRegistrationError(
        'An account with this email already exists.',
        409
      )
    }

    // 6. Return validated information.
    return {
      input,
      method,
      recordPayment,
      planRecord
    }
  }
}
