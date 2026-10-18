import fs from 'node:fs'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'
import { createSupabaseServerClient } from '../server/lib/supabase.js'

loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)))
const database = JSON.parse(
  fs.readFileSync(new URL('../server/data.json', import.meta.url), 'utf8')
)
const supabase = createSupabaseServerClient()
const headers = { apikey: process.env.SUPABASE_SECRET_KEY }
const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
  headers,
  signal: AbortSignal.timeout(15000)
})
if (!response.ok) throw new Error(`Schema inspection failed: HTTP ${response.status}.`)
const schema = await response.json()
for (const name of ['users', 'roles']) {
  const definition = schema.definitions?.[name]
  console.log(
    JSON.stringify({
      table: name,
      columns: definition
        ? Object.fromEntries(
            Object.entries(definition.properties || {}).map(([key, value]) => [
              key,
              { type: value.type, format: value.format, default: value.default }
            ])
          )
        : null,
      required: definition?.required
    })
  )
}
const { data: roles, error: roleError } = await supabase.from('roles').select('role_id,role_name')
if (roleError) throw new Error('Unable to read role definitions.')
console.log(JSON.stringify({ roles }))
const { data: profiles, error: profileError } = await supabase
  .from('users')
  .select('id,auth_user_id,email,member_code')
  .limit(1000)
if (profileError) throw new Error('Unable to inspect profile links.')
const { data: auth, error: authError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000
})
if (authError) throw new Error('Unable to inspect Auth links.')
const normalizedEmail = (email) => email?.toLowerCase()
const localAccounts = database.accounts
console.log(
  JSON.stringify({
    localAccounts: localAccounts.length,
    cloudProfiles: profiles.length,
    authAccounts: auth.users.length,
    matchingProfiles: localAccounts.filter((account) =>
      profiles.some((profile) => normalizedEmail(profile.email) === normalizedEmail(account.email))
    ).length,
    profileIdConflicts: localAccounts.filter((account) =>
      profiles.some(
        (profile) =>
          normalizedEmail(profile.email) === normalizedEmail(account.email) &&
          profile.id !== account.id
      )
    ).length,
    matchingAuthAccounts: localAccounts.filter((account) =>
      auth.users.some((user) => normalizedEmail(user.email) === normalizedEmail(account.email))
    ).length,
    missingProfileAuthLinks: profiles.filter(
      (profile) =>
        !profile.auth_user_id || !auth.users.some((user) => user.id === profile.auth_user_id)
    ).length,
    missingLocalPasswordHashes: localAccounts.filter((account) => !account.passwordHash).length
  })
)
