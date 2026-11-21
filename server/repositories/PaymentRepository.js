
export class PaymentRepositoryError extends Error {
  constructor(message, status = 503) {
    super(message)
    this.name = 'PaymentRepositoryError'
    this.status = status
  }
}

export class PaymentRepository {
  constructor({ supabase, loadDatabase }) {
    this.supabase = supabase
    this.loadDatabase = loadDatabase
  }

  // STEP 1: Load existing accounts and payment configuration.
  async loadContext() {
    return this.loadDatabase([
      'accounts',
      'payments'
    ])
  }

  // STEP 2: Insert the payment into Supabase.
  async recordPayment({ payment, methodId }) {
    const paymentRow = {
      payment_id: payment.id,
      subscription_id: payment.subscriptionId,
      method_id: methodId,
      processed_by_user_id: payment.processedByUserId,
      amount_paid: payment.amount,
      created_at: payment.date,
      legacy_plan_name: payment.plan || null
    }

    let result

    try {
      result = await this.supabase
        .from('payments')
        .insert(paymentRow)
        .select('payment_id')
        .single()
    } catch {
      throw new PaymentRepositoryError(
        'Unable to confirm the payment was recorded. Check payment history before retrying.'
      )
    }

    if (
      result.error ||
      result.data?.payment_id !== payment.id
    ) {
      throw new PaymentRepositoryError(
        'Unable to confirm the payment was recorded. Check payment history before retrying.'
      )
    }

    return payment
  }
}
