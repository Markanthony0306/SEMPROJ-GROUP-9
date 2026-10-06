// Sets a new password for the FitPulse administrator directly in the database.
// Usage: node scripts/admin-password.mjs <new-password>
// (or set ADMIN_PASSWORD in the environment / .env file)
import bcrypt from 'bcryptjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = path.dirname(fileURLToPath(import.meta.url))
const databasePath = path.join(directory, '..', 'server', 'data.json')

const newPassword = process.argv[2] || process.env.ADMIN_PASSWORD
if (!newPassword || newPassword.length < 8 || newPassword.length > 72) {
  console.error('Usage: node scripts/admin-password.mjs <new-password (8-72 characters)>')
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
  (account) => account.email === 'admin@fitpulse.com' || account.role === 'admin'
)
if (!admin) {
  console.error('No administrator account was found in the database.')
  process.exit(1)
}

// Report what the old stored hash was (helps diagnose "password not working").
const oldHash = admin.passwordHash || ''
const matchesAdmin123 = await bcrypt.compare('admin123', oldHash)
console.log(`Admin account: ${admin.name} <${admin.email}>`)
console.log(`Stored password was "admin123": ${matchesAdmin123 ? 'yes' : 'no'}`)

admin.passwordHash = await bcrypt.hash(newPassword, 12)
delete admin.resetTokenHash
delete admin.resetTokenExpiresAt

fs.writeFileSync(databasePath, JSON.stringify(database, null, 2) + '\n')

const verified = await bcrypt.compare(newPassword, admin.passwordHash)
if (!verified) {
  console.error('Something went wrong: the new hash could not be verified.')
  process.exit(1)
}
console.log(`New password set and verified for ${admin.email}.`)
console.log('Restart your server (npm run server) and log in with the new password.')
