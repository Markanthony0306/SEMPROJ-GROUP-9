import { createClient } from '@supabase/supabase-js'

// Disabling persistence does not stop sign-in from retaining an in-memory session.
// Use one client per request, separate from the privileged database client.
export function createSupabaseAuthClient({
  url = process.env.SUPABASE_URL,
  key = process.env.SUPABASE_PUBLISHABLE_KEY,
  fetch: fetchImplementation
} = {}) {
  if (!url || !key) throw new Error('Supabase Auth configuration is missing.')
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    ...(fetchImplementation ? { global: { fetch: fetchImplementation } } : {})
  })
}
