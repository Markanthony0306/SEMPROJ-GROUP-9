
import { randomUUID } from 'node:crypto'

export class PaymentValidationError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = 'PaymentValidationError'
    this.status = status
  }
}

export class PaymentService {
  constructor({ paymentMethod }) {
    this.paymentMethod = paymentMethod
  }

  // STEP 1: Validate the submitted payment information.
  validateInput(body = {}) {
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      throw new PaymentValidationError(
        'Invalid payment information.'
      )
    }

    const memberId =
      typeof body.memberId === 'string'
        ? body.memberId.trim()
        : ''

    const amount = Number(body.amount)
    const method = this.paymentMethod(body)

    if (!method) {
      throw new PaymentValidationError(
        'Choose Cash or GCash for a recorded payment.'
      )
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new PaymentValidationError(
        'A positive payment amount is required.'
      )
    }

    return {
      memberId,
      amount,
      method
    }
  }

  // STEP 2: Validate the member, subscription and payment method.
  prepare({ input, database, processedByUserId }) {
    const { memberId, amount, method } = input

    const member = database.accounts.find(
      (account) => account.id === memberId
    )

    if (!member) {
      throw new PaymentValidationError(
        'Unknown member id.'
      )
    }

    const configuredMethod = (
      database.paymentMethods || []
    ).find(
      (item) =>
        String(item.method_name).toLowerCase() ===
        method.toLowerCase()
    )

    if (!configuredMethod?.method_id) {
      throw new PaymentValidationError(
        `The ${method} payment method is not configured in Supabase.`
      )
    }

    if (!member.subscriptionId) {
      throw new PaymentValidationError(
        'This member has no subscription. Renew the membership before recording a payment.',
        409
      )
    }

    // STEP 3: Prepare the payment record.
    const payment = {
      id: randomUUID(),
      memberId,
      memberName: member.name,
      amount,
      method,
      type: 'Membership',
      plan: member.plan,
      date: new Date().toISOString(),
      subscriptionId: member.subscriptionId,
      processedByUserId
    }

    return {
      payment,
      methodId: configuredMethod.method_id
    }
  }
}
