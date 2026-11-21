const PAGE_SIZE = 1000

// Read every page in a stable order; Supabase caps a single response at 1,000 rows.
async function readPages(createQuery) {
  const rows = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await createQuery().range(offset, offset + PAGE_SIZE - 1)
    if (error) throw new Error('Analytics database query failed.', { cause: error })
    rows.push(...(data || []))
    if (!data || data.length < PAGE_SIZE) return rows
  }
}

export class AnalyticsRepository {
  constructor(supabase) {
    this.supabase = supabase
  }

  attendance(start, end, now) {
    return readPages(() =>
      this.supabase
        .from('attendance_logs')
        .select('check_in_time')
        .in('entry_type', ['ESP32-CAM', 'Staff'])
        .not('qr_token_id', 'is', null)
        .gte('check_in_time', start)
        .lt('check_in_time', end)
        .lte('check_in_time', now)
        .order('check_in_time')
        .order('attendance_id')
    )
  }

  async memberships() {
    const roles = await readPages(() =>
      this.supabase.from('roles').select('role_id').ilike('role_name', 'member').order('role_id')
    )
    if (!roles.length) return { members: [], subscriptions: [] }

    const roleIds = roles.map((role) => role.role_id)
    const [members, subscriptions] = await Promise.all([
      readPages(() =>
        this.supabase.from('users').select('id, status').in('role_id', roleIds).order('id')
      ),
      readPages(() =>
        this.supabase
          .from('subscriptions')
          .select(
            'subscription_id, user_id, start_date, end_date, status, created_at, users!inner(role_id)'
          )
          .in('users.role_id', roleIds)
          .order('created_at', { ascending: false })
          .order('subscription_id', { ascending: false })
      )
    ])
    return { members, subscriptions }
  }

  payments(start, now) {
    return readPages(() => {
      let query = this.supabase
        .from('payments')
        .select('amount_paid, payment_status, method_id, created_at')
        .lte('created_at', now)
      if (start) query = query.gte('created_at', start)
      return query.order('created_at').order('payment_id')
    })
  }

  paymentMethods() {
    return readPages(() =>
      this.supabase.from('payment_methods').select('method_id, method_name').order('method_id')
    )
  }
}
