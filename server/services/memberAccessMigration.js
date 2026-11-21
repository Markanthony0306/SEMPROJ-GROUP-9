import fs from 'node:fs'
import crypto from 'node:crypto'
import { getMembershipPlan } from '../../shared/membershipPlans.js'
import { issueMembershipQr } from './membershipQr.js'

const MIGRATION_ID = 'member-onboarding-plan-qr-v1'

export function migrateMemberAccess(database) {
  if (database.migrations?.includes(MIGRATION_ID)) return false
  // Remove only the retired demo login. Keep historical attendance/payment records.
  database.accounts = database.accounts.filter(
    (account) =>
      !(
        account.email?.toLowerCase() === 'member@fitpulse.com' &&
        ['user', 'member'].includes(account.role)
      )
  )
  for (const account of database.accounts) {
    account.must_change_password ??= false
    if (!['user', 'member'].includes(account.role) || !getMembershipPlan(account.plan)) continue
    const start = account.membershipStart || account.joined
    if (Number.isFinite(Date.parse(start))) issueMembershipQr(account, start)
  }
  database.migrations = [...(database.migrations || []), MIGRATION_ID]
  return true
}

export function saveMigratedDatabase(databasePath, database) {
  if (fs.existsSync(databasePath)) {
    const backup = `${databasePath}.access-backup-${Date.now()}-${crypto.randomUUID()}`
    fs.copyFileSync(databasePath, backup, fs.constants.COPYFILE_EXCL)
    console.log(`Private pre-migration backup: ${backup}`)
  }
  const stagedPath = `${databasePath}.access-migration-${crypto.randomUUID()}.tmp`
  fs.writeFileSync(stagedPath, JSON.stringify(database, null, 2), { flag: 'wx', mode: 0o600 })
  // Replace atomically so another process cannot read a partially written migration.
  fs.renameSync(stagedPath, databasePath)
}
