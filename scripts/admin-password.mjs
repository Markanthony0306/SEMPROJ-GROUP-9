import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const email = process.env.ADMIN_EMAIL || 'admin@fitpulse.com'
const newPassword = process.env.ADMIN_PASSWORD
const url = process.env.SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY

if (!url || !secretKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SECRET_KEY in your .env file.')
  process.exit(1)
}
if (!newPassword || newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) {
  console.error('Set ADMIN_PASSWORD to a value at least 8 characters and no longer than 72 UTF-8 bytes.')
  process.exit(1)
}

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
})
const { data: profile, error: lookupError } = await supabase
  .from('users')
  .select('id, auth_user_id, auth_version, role_id')
  .eq('email', email)
  .maybeSingle()

if (lookupError || !profile?.auth_user_id) {
  console.error(`No linked Supabase Auth account was found for ${email}.`, lookupError?.message || '')
  process.exit(1)
}

const { data: role, error: roleError } = await supabase
  .from('roles')
  .select('role_name')
  .eq('role_id', profile.role_id)
  .maybeSingle()
if (roleError || role?.role_name?.toLowerCase() !== 'admin') {
  console.error(`${email} is not configured as an administrator.`)
  process.exit(1)
}

const { error: authError } = await supabase.auth.admin.updateUserById(profile.auth_user_id, {
  password: newPassword,
  email_confirm: true
})
if (authError) {
  console.error('Supabase could not update the administrator password:', authError.message)
  process.exit(1)
}

const { error: profileError } = await supabase
  .from('users')
  .update({ auth_version: Number(profile.auth_version || 0) + 1 })
  .eq('id', profile.id)
if (profileError) {
  console.error('Password updated, but existing app sessions could not be invalidated:', profileError.message)
  process.exit(1)
}

console.log(`Supabase Auth password updated for ${email}. Existing FitPulse sessions have expired.`)
