import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { supabase } from '../server/lib/supabase.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = path.join(root, 'server', 'data.json')
const data = JSON.parse(await readFile(sourcePath, 'utf8'))

async function findAuthUser(email) {
  for (let page = 1; ; page += 1) {
    const { data: pageData, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(`Could not find the Supabase login for ${email}: ${error.message}`)
    const user = pageData.users.find((item) => item.email?.toLowerCase() === email.toLowerCase())
    if (user || pageData.users.length < 1000) return user || null
  }
}

const [rolesResult, plansResult, methodsResult] = await Promise.all([
  supabase.from('roles').select('role_id, role_name'),
  supabase.from('membership_plans').select('plan_id, plan_name, duration_days, price, is_active'),
  supabase.from('payment_methods').select('method_id, method_name')
])
if (rolesResult.error) throw new Error(`Could not load Supabase roles: ${rolesResult.error.message}`)
if (plansResult.error) throw new Error(`Could not load membership plans: ${plansResult.error.message}`)
if (methodsResult.error) throw new Error(`Could not load payment methods: ${methodsResult.error.message}`)

const roleIds = new Map(rolesResult.data.map((item) => [item.role_name.toLowerCase(), item.role_id]))
const plansByName = new Map(plansResult.data.map((item) => [item.plan_name.toLowerCase(), item]))
const methodsByName = new Map(methodsResult.data.map((item) => [item.method_name.toLowerCase(), item.method_id]))
const idMap = new Map()
const linkedProfiles = new Map()
const subscriptionsByAccount = new Map()
const subscriptionsToSave = []

for (const account of data.accounts || []) {
  const roleName = account.role === 'user' ? 'member' : String(account.role || '').toLowerCase()
  const roleId = roleIds.get(roleName)
  if (!roleId) {
    console.warn(`Skipped an account with an unsupported role: ${roleName || '(empty)'}`)
    continue
  }

  const { data: existing, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('email', account.email)
    .maybeSingle()
  if (findError) throw new Error(`Could not look up an account profile: ${findError.message}`)

  let authUserId = existing?.auth_user_id || null
  if (!authUserId) authUserId = (await findAuthUser(account.email))?.id || null
  if (!authUserId) {
    console.warn(`Skipped ${account.email}: no matching Supabase Auth login exists. Password hashes are not imported.`)
    continue
  }

  const row = {
    id: existing?.id || account.id,
    auth_user_id: authUserId,
    role_id: roleId,
    name: account.name,
    email: account.email.toLowerCase(),
    phone_number: account.phone || null,
    emergency_contact: account.emergencyContact || null,
    status: account.status || 'active',
    must_change_password: Boolean(account.mustChangePassword),
    created_at: account.joined || new Date().toISOString(),
    auth_version: Number(account.authVersion || 0),
    avatar_path: existing?.avatar_path || null
  }
  if (existing?.member_code) row.member_code = existing.member_code

  const { error: saveError } = await supabase.from('users').upsert(row, { onConflict: 'id' })
  if (saveError) throw new Error(`Could not migrate an account profile: ${saveError.message}`)
  idMap.set(account.id, row.id)
  linkedProfiles.set(account.id, row)

  if (roleName === 'member' && account.membershipStart && account.membershipEnd) {
    const plan = plansByName.get(String(account.plan || '').toLowerCase())
    if (!plan) throw new Error(`Membership plan '${account.plan}' is missing from Supabase.`)
    const { data: oldSubscription, error: subscriptionLookupError } = await supabase
      .from('subscriptions')
      .select('subscription_id')
      .eq('user_id', row.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (subscriptionLookupError)
      throw new Error(`Could not look up the membership for ${account.email}: ${subscriptionLookupError.message}`)

    const subscription = {
      subscription_id: oldSubscription?.subscription_id || randomUUID(),
      user_id: row.id,
      plan_id: plan.plan_id,
      start_date: account.membershipStart,
      end_date: account.membershipEnd,
      status: 'active',
      created_at: account.membershipStart
    }
    subscriptionsByAccount.set(account.id, subscription.subscription_id)
    subscriptionsToSave.push(subscription)
  }

  if (!existing?.avatar_path && account.avatarId && /^[a-f0-9-]{36}$/i.test(account.avatarId)) {
    try {
      const photo = await readFile(path.join(root, 'server', 'uploads', 'avatars', `${account.avatarId}.jpg`))
      const avatarPath = `${row.id}/${randomUUID()}.jpg`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(avatarPath, photo, {
        contentType: 'image/jpeg', cacheControl: '3600', upsert: false
      })
      if (uploadError) throw uploadError
      const { error: avatarError } = await supabase.from('users').update({ avatar_path: avatarPath }).eq('id', row.id)
      if (avatarError) throw avatarError
      row.avatar_path = avatarPath
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error(`Could not migrate a profile photo: ${error.message}`)
      console.warn('A local profile photo was missing and was skipped.')
    }
  }
}

if (subscriptionsToSave.length) {
  const { error } = await supabase.from('subscriptions').upsert(subscriptionsToSave, { onConflict: 'subscription_id' })
  if (error) throw new Error(`Could not migrate subscriptions: ${error.message}`)
}

const attendance = (data.attendance || []).flatMap((item) => {
  const memberId = idMap.get(item.memberId)
  return memberId ? [{
    attendance_id: item.id,
    user_id: memberId,
    member_name: item.memberName || linkedProfiles.get(item.memberId)?.name || '',
    check_in_time: item.date,
    entry_type: item.source || null,
    device_id: item.deviceId || null,
    request_id: item.scannerRequestId || null,
    qr_token_id: item.qrTokenId || null
  }] : []
})
if (attendance.length) {
  const { error } = await supabase.from('attendance_logs').upsert(attendance, { onConflict: 'attendance_id' })
  if (error) throw new Error(`Could not migrate attendance logs: ${error.message}`)
}

const payments = (data.payments || []).flatMap((item) => {
  const memberId = idMap.get(item.memberId)
  const subscriptionId = subscriptionsByAccount.get(item.memberId)
  const methodId = methodsByName.get(String(item.method || '').toLowerCase())
  if (!memberId || !subscriptionId) return []
  if (!methodId) throw new Error(`Payment method '${item.method}' is missing from Supabase.`)
  return [{
    payment_id: item.id,
    subscription_id: subscriptionId,
    method_id: methodId,
    processed_by_user_id: memberId,
    amount_paid: item.amount,
    created_at: item.date,
    legacy_plan_name: item.plan || null
  }]
})
if (payments.length) {
  const { error } = await supabase.from('payments').upsert(payments, { onConflict: 'payment_id' })
  if (error) throw new Error(`Could not migrate payments: ${error.message}`)
}

const equipment = (data.equipment || []).map((item) => ({
  id: item.id, name: item.name, category: item.category || 'Other',
  condition: item.condition || 'Good', last_inspected: item.lastInspected || null
}))
if (equipment.length) {
  const { error } = await supabase.from('gym_equipment').upsert(equipment, { onConflict: 'id' })
  if (error) throw new Error(`Could not migrate gym equipment: ${error.message}`)
}

const maintenance = (data.maintenance || []).map((item) => ({
  id: item.id, equipment_id: item.equipmentId || null,
  item: item.item, note: item.note, date: item.date
}))
if (maintenance.length) {
  const { error } = await supabase.from('gym_maintenance').upsert(maintenance, { onConflict: 'id' })
  if (error) throw new Error(`Could not migrate maintenance records: ${error.message}`)
}

if (data.settings) {
  const { error } = await supabase.from('gym_settings').upsert({
    id: 1,
    gym_name: data.settings.gym || 'FitPulse Gym',
    reminder_days: data.settings.remind || 7,
    email_enabled: data.settings.emailOn !== false
  }, { onConflict: 'id' })
  if (error) throw new Error(`Could not migrate gym settings: ${error.message}`)
}

console.log(`Imported ${idMap.size} account profiles, ${subscriptionsToSave.length} subscriptions, ${attendance.length} attendance records, and ${payments.length} payments into Supabase.`)
console.log('The application does not read data.json at runtime. Keep the file privately as a backup until you confirm the imported records.')
