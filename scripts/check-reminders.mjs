// Check the deployed schema and claim function without sending email or
// changing member records. The claim probe is deliberately ineligible.
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { checkMembershipReminderSetup } from '../server/services/membershipReminders.js'

try {
  try {
    loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)))
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error('Unable to load the private .env file.')
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY)
    throw new Error('Set SUPABASE_URL and SUPABASE_SECRET_KEY in the private server environment.')
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, options = {}) =>
        fetch(input, {
          ...options,
          signal: options.signal
            ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
            : AbortSignal.timeout(15000)
        })
    }
  })
  await checkMembershipReminderSetup(supabase)
  const { error } = await supabase
    .from('admin_notification_dismissals')
    .select('admin_user_id,notification_key,dismissed_at')
    .limit(0)
  if (error)
    throw new Error(
      'Notification storage is unavailable. Apply supabase/migrations/005_admin_notifications.sql.'
    )
  console.log(
    'PASS: Reminder tracking columns, email settings, claim function, and notification storage are ready.'
  )
  console.log(
    'No emails were sent, no reminders were reserved, and no member records were changed.'
  )
} catch (error) {
  // Only our own sanitized diagnostics are printed; provider responses can
  // include project details that should not appear in shared logs.
  console.error(
    error.name === 'ReminderSetupError' ||
      error.message.startsWith('Set ') ||
      error.message.startsWith('Notification ')
      ? error.message
      : 'Reminder setup check failed. Check the private Supabase settings and network connection.'
  )
  process.exitCode = 1
}
