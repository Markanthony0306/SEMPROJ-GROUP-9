import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  migrateMemberAccess,
  saveMigratedDatabase
} from '../server/services/memberAccessMigration.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let configuredDataFile = process.env.DATA_FILE
if (configuredDataFile === undefined && fs.existsSync(path.join(root, '.env'))) {
  const line = fs
    .readFileSync(path.join(root, '.env'), 'utf8')
    .split(/\r?\n/)
    .find((value) => /^\s*DATA_FILE\s*=/.test(value))
  configuredDataFile = line
    ?.split('=')
    .slice(1)
    .join('=')
    .trim()
    .replace(/^["']|["']$/g, '')
}
const databasePath = path.resolve(root, configuredDataFile || 'server/data.json')
if (!fs.existsSync(databasePath)) {
  console.log('No database exists yet. The API will apply the migration on first start.')
} else {
  const database = JSON.parse(fs.readFileSync(databasePath, 'utf8'))
  if (migrateMemberAccess(database)) {
    saveMigratedDatabase(databasePath, database)
    console.log('Member access migration applied. Existing administrator passwords are unchanged.')
  } else {
    console.log('Member access migration is already applied.')
  }
}
