export const REPORT_COLLECTIONS = {
  payments: { table: 'payments', key: 'payment_id', sections: ['accounts', 'payments'] },
  attendance: {
    table: 'attendance_logs',
    key: 'attendance_id',
    sections: ['accounts', 'attendance']
  },
  maintenance: { table: 'gym_maintenance', key: 'id', sections: ['equipment', 'maintenance'] }
}

function invalid(message) {
  const error = new Error(message)
  error.status = 400
  throw error
}

export function reportRecordInput(
  kind,
  input,
  database,
  { existing, actorId, now = Date.now() } = {}
) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    invalid('Enter valid record details.')
  const date = input.date ?? existing?.date ?? new Date(now).toISOString()
  const timestamp = typeof date === 'string' ? Date.parse(date) : NaN
  if (!Number.isFinite(timestamp) || timestamp < Date.UTC(2000, 0, 1) || timestamp > now + 300000)
    invalid('Choose a valid record date between January 2000 and now.')
  const recordedAt = new Date(timestamp).toISOString()

  if (kind === 'maintenance') {
    const equipment = database.equipment.find((item) => item.id === input.equipmentId)
    if (!equipment) invalid('Choose an existing piece of equipment.')
    const note = typeof input.note === 'string' ? input.note.trim() : ''
    if (!note || note.length > 500) invalid('Enter a maintenance note of 1–500 characters.')
    return { equipment_id: equipment.id, item: equipment.name, note, date: recordedAt }
  }

  // Identity and the linked subscription cannot be reassigned while editing a record.
  const memberId = existing?.memberId || input.memberId
  const member = database.accounts.find(
    (account) => account.id === memberId && ['user', 'member'].includes(account.role)
  )
  if (!member) invalid('Choose an existing member.')

  if (kind === 'payments') {
    if (
      (typeof input.amount !== 'number' && typeof input.amount !== 'string') ||
      String(input.amount).trim() === ''
    )
      invalid('Enter a positive payment amount.')
    const amount = Number(input.amount)
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 100000000 ||
      Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001
    )
      invalid('Enter a positive amount with no more than two decimal places.')
    const method = database.paymentMethods.find(
      (item) =>
        ['cash', 'gcash'].includes(String(input.method).toLowerCase()) &&
        String(item.method_name).toLowerCase() === String(input.method).toLowerCase()
    )
    if (!method) invalid('Choose a configured Cash or GCash payment method.')
    const subscriptionId = existing?.subscriptionId || member.subscriptionId
    if (!subscriptionId) invalid('Renew this member’s membership before recording a payment.')
    return {
      subscription_id: subscriptionId,
      method_id: method.method_id,
      amount_paid: amount,
      created_at: recordedAt,
      ...(!existing ? { processed_by_user_id: actorId, legacy_plan_name: member.plan } : {})
    }
  }

  if (kind === 'attendance') {
    if (!existing) invalid('Check-in must be recorded by the entrance scanner.')
    return {
      user_id: member.id,
      member_name: member.name,
      check_in_time: recordedAt
    }
  }
  invalid('Unsupported report type.')
}
