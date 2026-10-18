import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'
import { createSupabaseServerClient } from '../server/lib/supabase.js'

function connectionFailure(service, error) {
  const status = Number.isInteger(error.status) ? `HTTP ${error.status}` : 'request failed'
  const code = /^[A-Za-z0-9_-]+$/.test(error.code || '') ? `, ${error.code}` : ''
  return new Error(
    `${service} check failed (${status}${code}). Check the project keys and settings.`
  )
}

try {
  try {
    // Built-in .env loading preserves externally supplied variables.
    loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)))
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error('Unable to load the project .env file.')
  }

  const supabase = createSupabaseServerClient({
    fetch: (input, options = {}) => {
      const timeout = AbortSignal.timeout(15000)
      const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout
      return fetch(input, { ...options, signal })
    }
  })

  // Discard account data. This request only checks the server key's Auth access.
  const { error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
  if (authError) throw connectionFailure('Supabase Auth', authError)
  console.log('Supabase Auth admin connection successful.')

  // The existing SEMPROJ project uses roles. HEAD verifies access without returning rows.
  const { error: databaseError } = await supabase
    .from('roles')
    .select('role_id', { head: true })
    .limit(1)
  if (databaseError) throw connectionFailure('Supabase database (roles table)', databaseError)
  console.log('Supabase database connection successful (roles table readable).')
  console.log('Read-only checks completed. No users or records were changed.')
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
