// Sets a new password for the FitPulse administrator directly in the database.
// Usage: node scripts/admin-password.mjs <new-password>
// Prefer ADMIN_PASSWORD in the process environment to avoid shell-history exposure.
import bcrypt from 'bcryptjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = path.dirname(fileURLToPath(import.meta.url))
const databasePath = process.env.DATA_FILE || path.join(directory, '..', 'server', 'data.json')

const newPassword = process.argv[2] || process.env.ADMIN_PASSWORD
if (!newPassword || newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) {
  console.error(
    'Set ADMIN_PASSWORD with at least 8 characters, up to 72 bytes, then run npm run admin:password.'
  )
  process.exit(1)
}

if (!fs.existsSync(databasePath)) {
  console.error(
    `Database not found at ${databasePath}. Start the server once so it can be created.`
  )
  process.exit(1)
}

const database = JSON.parse(fs.readFileSync(databasePath, 'utf8'))
const admin = database.accounts.find(
  (account) => account.role === 'admin' && account.email === 'admin@fitpulse.com'
)
if (!admin) {
  console.error('No administrator account was found in the database.')
  process.exit(1)
}

console.log(`Admin account: ${admin.name} <${admin.email}>`)

admin.passwordHash = await bcrypt.hash(newPassword, 12)
admin.authVersion = (admin.authVersion || 0) + 1
delete admin.resetTokenHash
delete admin.resetTokenExpiresAt

const verified = await bcrypt.compare(newPassword, admin.passwordHash)
if (!verified) {
  console.error('Something went wrong: the new hash could not be verified.')
  process.exit(1)
}
// Preserve the complete database before changing a saved administrator password.
const backupPath = `${databasePath}.password-backup-${Date.now()}`
fs.copyFileSync(databasePath, backupPath, fs.constants.COPYFILE_EXCL)
fs.writeFileSync(databasePath, JSON.stringify(database, null, 2) + '\n')
console.log(`Backup saved at ${backupPath}. Keep it private; it contains account records.`)
console.log(`New password set and verified for ${admin.email}.`)
console.log('Log in with the new password. Previous admin sessions have expired.')
