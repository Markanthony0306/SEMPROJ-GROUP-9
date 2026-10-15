import crypto from 'node:crypto'

const snapshots = new WeakMap()

function fail(error, table) {
  if (error) throw new Error(`Supabase ${table} query failed: ${error.message}`)
}

async function selectAll(supabase, table, columns, orderBy) {
  const rows = []
  const pageSize = 1000
  for (let start = 0; ; start += pageSize) {
    let query = supabase.from(table).select(columns || '*')
    if (orderBy) query = query.order(orderBy, { ascending: true })
    const { data, error } = await query.range(start, start + pageSize - 1)
    fail(error, table)
    rows.push(...(data || []))
    if (!data || data.length < pageSize) return rows
  }
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function byId(rows = []) {
  return new Map(rows.map((row) => [row.id, row]))
}

function latestSubscriptions(rows) {
  const latest = new Map()
  const sorted = [...rows].sort((left, right) =>
    Date.parse(right.created_at || right.start_date || 0) -
    Date.parse(left.created_at || left.start_date || 0)
  )
  for (const row of sorted) {
    if (!latest.has(row.user_id)) latest.set(row.user_id, row)
  }
  return latest
}

function accountFromRow(row, roleById, subscription, planById) {
  const roleName = String(roleById.get(row.role_id) || '').toLowerCase()
  const plan = subscription ? planById.get(subscription.plan_id) : null
  return {
    id: row.id,
    authUserId: row.auth_user_id || null,
    memberCode: row.member_code || '',
    name: row.name || '',
    email: row.email || '',
    phone: row.phone_number || '',
    emergencyContact: row.emergency_contact || '',
    role: roleName === 'member' ? 'user' : roleName,
    plan: plan?.plan_name || (roleName === 'admin' || roleName === 'staff' ? 'Staff access' : 'Plan not assigned'),
    status: row.status || 'active',
    joined: row.created_at || null,
    membershipStart: subscription?.start_date || null,
    membershipEnd: subscription?.end_date || null,
    subscriptionId: subscription?.subscription_id || null,
    subscriptionCreatedAt: subscription?.created_at || null,
    planId: subscription?.plan_id || null,
    mustChangePassword: Boolean(row.must_change_password),
    authVersion: Number(row.auth_version || 0),
    avatarId: row.avatar_path || ''
  }
}

export async function loadAccount(supabase, id) {
  const { data: row, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
  fail(error, 'users')
  if (!row) return null

  const [roleResult, subscriptionResult] = await Promise.all([
    supabase.from('roles').select('role_id, role_name').eq('role_id', row.role_id).maybeSingle(),
    supabase
      .from('subscriptions')
      .select('subscription_id, user_id, plan_id, start_date, end_date, status, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ])
  fail(roleResult.error, 'roles')
  fail(subscriptionResult.error, 'subscriptions')

  const subscription = subscriptionResult.data
  let plan = null
  if (subscription) {
    const { data, error: planError } = await supabase
      .from('membership_plans')
      .select('plan_id, plan_name, duration_days, price, is_active')
      .eq('plan_id', subscription.plan_id)
      .maybeSingle()
    fail(planError, 'membership_plans')
    plan = data
  }

  return accountFromRow(
    row,
    new Map([[row.role_id, roleResult.data?.role_name]]),
    subscription,
    new Map(plan ? [[plan.plan_id, plan]] : [])
  )
}

export async function loadDatabase(supabase, sections = [
  'accounts', 'attendance', 'payments', 'equipment', 'maintenance', 'settings'
]) {
  const selected = new Set(sections)
  const needsAccountRelations = selected.has('accounts') || selected.has('payments')
  const [roles, users, subscriptions, plans, methods, attendanceRows, paymentRows, equipment, maintenance, settingsRow] = await Promise.all([
    selected.has('accounts') ? selectAll(supabase, 'roles', 'role_id, role_name', 'role_id') : [],
    needsAccountRelations ? selectAll(supabase, 'users', '*', 'id') : [],
    needsAccountRelations || selected.has('payments')
      ? selectAll(supabase, 'subscriptions', 'subscription_id, user_id, plan_id, start_date, end_date, status, created_at', 'created_at')
      : [],
    needsAccountRelations || selected.has('payments')
      ? selectAll(supabase, 'membership_plans', 'plan_id, plan_name, duration_days, price, is_active', 'plan_id')
      : [],
    selected.has('payments')
      ? selectAll(supabase, 'payment_methods', 'method_id, method_name', 'method_id')
      : [],
    selected.has('attendance')
      ? selectAll(supabase, 'attendance_logs', 'attendance_id, user_id, member_name, check_in_time, entry_type, device_id, request_id, qr_token_id', 'check_in_time')
      : [],
    selected.has('payments')
      ? selectAll(supabase, 'payments', 'payment_id, subscription_id, method_id, processed_by_user_id, amount_paid, payment_status, created_at, legacy_plan_name', 'created_at')
      : [],
    selected.has('equipment') ? selectAll(supabase, 'gym_equipment', '*', 'id') : [],
    selected.has('maintenance') ? selectAll(supabase, 'gym_maintenance', '*', 'id') : [],
    selected.has('settings')
      ? supabase.from('gym_settings').select('*').eq('id', 1).maybeSingle()
      : { data: null, error: null }
  ])

  fail(settingsRow.error, 'gym_settings')
  const roleById = new Map(roles.map((role) => [role.role_id, role.role_name]))
  const roleIdByName = new Map(roles.map((role) => [String(role.role_name).toLowerCase(), role.role_id]))
  const planById = new Map(plans.map((plan) => [plan.plan_id, plan]))
  const planIdByName = new Map(plans.map((plan) => [String(plan.plan_name).toLowerCase(), plan.plan_id]))
  const methodNameById = new Map(methods.map((method) => [method.method_id, method.method_name]))
  const paymentMethodIdByName = new Map(methods.map((method) => [String(method.method_name).toLowerCase(), method.method_id]))
  const subscriptionsById = new Map(subscriptions.map((row) => [row.subscription_id, row]))
  const subscriptionByUserId = latestSubscriptions(subscriptions)
  const usersById = new Map(users.map((row) => [row.id, row]))

  const database = {
    accounts: selected.has('accounts')
      ? users.map((row) => accountFromRow(row, roleById, subscriptionByUserId.get(row.id), planById))
      : [],
    membershipPlans: plans,
    paymentMethods: methods,
    attendance: attendanceRows.map((row) => ({
      id: row.attendance_id,
      memberId: row.user_id,
      memberName: row.member_name || usersById.get(row.user_id)?.name || '',
      date: row.check_in_time,
      source: row.entry_type || '',
      deviceId: row.device_id || '',
      scannerRequestId: row.request_id || '',
      qrTokenId: row.qr_token_id || ''
    })),
    payments: paymentRows.map((row) => {
      const subscription = subscriptionsById.get(row.subscription_id)
      const plan = subscription ? planById.get(subscription.plan_id) : null
      const member = subscription ? usersById.get(subscription.user_id) : null
      return {
        id: row.payment_id,
        memberId: subscription?.user_id || '',
        memberName: member?.name || '',
        amount: Number(row.amount_paid || 0),
        method: methodNameById.get(row.method_id) || '',
        plan: row.legacy_plan_name || plan?.plan_name || '',
        type: 'Membership',
        date: row.created_at,
        subscriptionId: row.subscription_id,
        processedByUserId: row.processed_by_user_id || null,
        paymentStatus: row.payment_status
      }
    }),
    equipment: equipment.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category || 'Other',
      condition: row.condition || 'Good',
      lastInspected: row.last_inspected || null
    })),
    maintenance: maintenance.map((row) => ({
      id: row.id,
      equipmentId: row.equipment_id,
      item: row.item,
      note: row.note,
      date: row.date
    })),
    settings: settingsRow.data
      ? { gym: settingsRow.data.gym_name, remind: settingsRow.data.reminder_days, emailOn: settingsRow.data.email_enabled }
      : { gym: 'FitPulse Gym', remind: 7, emailOn: true }
  }

  snapshots.set(database, {
    database: structuredClone(database),
    roleIdByName,
    planIdByName,
    paymentMethodIdByName,
    subscriptionByUserId
  })
  return database
}

export async function saveDatabase(supabase, database) {
  const snapshot = snapshots.get(database)
  if (!snapshot) throw new Error('Database snapshot is missing; reload before saving.')
  const before = snapshot.database
  const { roleIdByName, planIdByName, paymentMethodIdByName } = snapshot
  const oldAccounts = byId(before.accounts)
  const usersToSave = database.accounts.filter((account) => !same(account, oldAccounts.get(account.id)))

  if (usersToSave.length) {
    const userRows = usersToSave.map((account) => {
      const roleName = account.role === 'user' ? 'member' : account.role
      const roleId = roleIdByName.get(String(roleName).toLowerCase())
      if (!roleId) throw new Error(`Supabase role '${roleName}' is not configured.`)
      const row = {
        id: account.id,
        auth_user_id: account.authUserId || null,
        role_id: roleId,
        name: account.name,
        email: account.email,
        phone_number: account.phone || null,
        emergency_contact: account.emergencyContact || null,
        status: account.status || 'active',
        must_change_password: Boolean(account.mustChangePassword),
        created_at: account.joined || new Date().toISOString(),
        auth_version: Number(account.authVersion || 0),
        avatar_path: account.avatarId || null
      }
      if (account.memberCode) row.member_code = account.memberCode
      return row
    })
    const { error } = await supabase.from('users').upsert(userRows, { onConflict: 'id' })
    fail(error, 'users')
  }

  const changedSubscriptions = []
  for (const account of database.accounts) {
    const old = oldAccounts.get(account.id)
    const membershipBefore = old && {
      subscriptionId: old.subscriptionId,
      plan: old.plan,
      membershipStart: old.membershipStart,
      membershipEnd: old.membershipEnd
    }
    const membershipAfter = {
      subscriptionId: account.subscriptionId,
      plan: account.plan,
      membershipStart: account.membershipStart,
      membershipEnd: account.membershipEnd
    }
    if (old && same(membershipBefore, membershipAfter)) continue
    if (!['user', 'member'].includes(account.role) || !account.membershipStart || !account.membershipEnd) continue

    const planId = planIdByName.get(String(account.plan || '').toLowerCase()) || account.planId
    if (!planId) throw new Error(`Membership plan '${account.plan}' is not configured in Supabase.`)
    account.planId = planId
    account.subscriptionId ||= crypto.randomUUID()
    changedSubscriptions.push({
      subscription_id: account.subscriptionId,
      user_id: account.id,
      plan_id: planId,
      start_date: account.membershipStart,
      end_date: account.membershipEnd,
      status: 'active',
      created_at: account.subscriptionCreatedAt || new Date().toISOString()
    })
  }
  if (changedSubscriptions.length) {
    const { error } = await supabase.from('subscriptions').upsert(changedSubscriptions, { onConflict: 'subscription_id' })
    fail(error, 'subscriptions')
  }

  const attendanceBefore = byId(before.attendance)
  const attendanceChanges = database.attendance
    .filter((row) => !same(row, attendanceBefore.get(row.id)))
    .map((row) => ({
      attendance_id: row.id,
      user_id: row.memberId,
      member_name: row.memberName || '',
      check_in_time: row.date,
      entry_type: row.source || null,
      device_id: row.deviceId || null,
      request_id: row.scannerRequestId || null,
      qr_token_id: row.qrTokenId || null
    }))
  if (attendanceChanges.length) {
    const { error } = await supabase.from('attendance_logs').upsert(attendanceChanges, { onConflict: 'attendance_id' })
    fail(error, 'attendance_logs')
  }

  const paymentBefore = byId(before.payments)
  const accountById = new Map(database.accounts.map((account) => [account.id, account]))
  const paymentChanges = database.payments
    .filter((row) => !same(row, paymentBefore.get(row.id)))
    .map((row) => {
      const subscriptionId = row.subscriptionId || accountById.get(row.memberId)?.subscriptionId ||
        snapshot.subscriptionByUserId.get(row.memberId)?.subscription_id
      if (!subscriptionId) throw new Error(`Member ${row.memberId} has no subscription for this payment.`)
      const methodId = paymentMethodIdByName.get(String(row.method || '').toLowerCase())
      if (!methodId) throw new Error(`Payment method '${row.method}' is not configured in Supabase.`)
      const paymentRow = {
        payment_id: row.id,
        subscription_id: subscriptionId,
        method_id: methodId,
        processed_by_user_id: row.processedByUserId || null,
        amount_paid: row.amount,
        created_at: row.date,
        legacy_plan_name: row.plan || null
      }
      if (row.paymentStatus) paymentRow.payment_status = row.paymentStatus
      return paymentRow
    })
  if (paymentChanges.length) {
    const { error } = await supabase.from('payments').upsert(paymentChanges, { onConflict: 'payment_id' })
    fail(error, 'payments')
  }

  await saveChanges(supabase, 'gym_equipment', database.equipment, before.equipment, (row) => ({
    id: row.id,
    name: row.name,
    category: row.category || 'Other',
    condition: row.condition || 'Good',
    last_inspected: row.lastInspected || null
  }))
  await saveChanges(supabase, 'gym_maintenance', database.maintenance, before.maintenance, (row) => ({
    id: row.id,
    equipment_id: row.equipmentId,
    item: row.item,
    note: row.note,
    date: row.date
  }))

  if (!same(database.settings, before.settings)) {
    const { error } = await supabase.from('gym_settings').upsert({
      id: 1,
      gym_name: database.settings.gym,
      reminder_days: database.settings.remind,
      email_enabled: database.settings.emailOn
    }, { onConflict: 'id' })
    fail(error, 'gym_settings')
  }

  snapshots.set(database, {
    database: structuredClone(database),
    roleIdByName,
    planIdByName,
    paymentMethodIdByName,
    subscriptionByUserId: latestSubscriptions([
      ...snapshot.subscriptionByUserId.values(),
      ...changedSubscriptions.map((row) => ({ ...row, user_id: row.user_id }))
    ])
  })
}

async function saveChanges(supabase, table, rows, before, serialize) {
  const oldRows = byId(before)
  const changes = rows.filter((row) => !same(row, oldRows.get(row.id))).map(serialize)
  if (!changes.length) return
  const { error } = await supabase.from(table).upsert(changes, { onConflict: 'id' })
  fail(error, table)
}
