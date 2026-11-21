import fs from 'node:fs'
import path from 'node:path'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'
import { createSupabaseServerClient, createSupabaseAuthClient } from '../server/lib/supabase.js'
import { createSupabaseAccountService } from '../server/services/supabaseAccounts.js'
import { ensureMemberCodes } from '../server/services/memberCodes.js'
import { saveMigratedDatabase } from '../server/services/memberAccessMigration.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
try {
  loadEnvFile(path.join(root, '.env'))
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
const databasePath = path.resolve(root, process.env.DATA_FILE || 'server/data.json')
const readDatabase = () => JSON.parse(fs.readFileSync(databasePath, 'utf8'))
const initial = readDatabase()
const accounts = initial.accounts.filter((account) =>
  ['admin', 'staff', 'user', 'member'].includes(account.role)
)

if (!process.argv.includes('--apply')) {
  console.log(
    `Found ${accounts.length} real local accounts. Membership and history IDs will be preserved.`
  )
  console.log(
    'Run npm run migrate:supabase -- --apply to import missing cloud identities using password hashes.'
  )
  console.log(
    'Existing cloud accounts are never overwritten; conflicts wait for owner verification.'
  )
} else {
  const service = createSupabaseAccountService({
    adminClient: createSupabaseServerClient(),
    createAuthClient: createSupabaseAuthClient
  })
  if (ensureMemberCodes(initial)) saveMigratedDatabase(databasePath, initial)
  let linked = 0
  let pending = 0
  for (const snapshot of accounts) {
    const account = readDatabase().accounts.find((item) => item.id === snapshot.id)
    if (!account) continue
    const result = await service.importAccount(account)
    const latest = readDatabase()
    const current = latest.accounts.find((item) => item.id === account.id)
    if (
      !current ||
      current.email !== account.email ||
      current.passwordHash !== account.passwordHash ||
      current.role !== account.role
    ) {
      throw new Error('An account changed during migration. Stop the API and rerun the migration.')
    }
    Object.assign(
      current,
      result.pending
        ? { supabaseLinkPending: true }
        : { ...result.accountPatch, supabaseLinkPending: false }
    )
    saveMigratedDatabase(databasePath, latest)
    if (result.pending) pending += 1
    else linked += 1
  }
  console.log(
    `Migration complete: ${linked} linked accounts; ${pending} existing cloud identities awaiting verification.`
  )
  console.log('Real passwords, account IDs, membership QR codes, and histories were preserved.')
}
