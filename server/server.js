import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { scannerRoutes, membershipFailure } from './routes/scanner.js'
import { avatarRoutes } from './routes/avatar.js'
import { demoAccountRoutes } from './routes/demo-accounts.js'

const directory = path.dirname(fileURLToPath(import.meta.url))

// Minimal .env loader so `npm run server` works without extra tooling in
// development. Real environment variables always win over values in the file.
function loadEnvironmentFile() {
  try {
    const lines = fs.readFileSync(path.join(directory, '..', '.env'), 'utf8').split(/\r?\n/)
    for (const line of lines) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line)
      if (!match || process.env[match[1]] !== undefined) continue
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
    }
  } catch {
    // No .env file in development is fine; the environment can still provide values.
  }
}
loadEnvironmentFile()

const app = express()
const port = Number(process.env.PORT || 3001)
const isProduction = process.env.NODE_ENV === 'production'
const resetTokenTtl = 15 * 60 * 1000
const passwordMin = 8
const passwordMax = 72 // bcrypt ignores bytes beyond 72
const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')
const databasePath = process.env.DATA_FILE || path.join(directory, 'data.json')

// Never fall back to a hard-coded signing key: someone could forge sessions with
// it. In development we use an ephemeral secret per boot; production must set one.
const jwtSecret =
  process.env.JWT_SECRET || (isProduction ? '' : crypto.randomBytes(32).toString('hex'))
if (!jwtSecret) {
  console.error('JWT_SECRET is required when NODE_ENV=production. Set it and restart the server.')
  process.exit(1)
}

// Restrict browser origins to the known frontend(s). Override with CORS_ORIGINS.
const corsOrigins = (
  process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
app.use(cors({ origin: corsOrigins }))
app.use(express.json({ limit: '100kb' }))

const smtpConfigured = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
)
const mailer = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
  : null

// ---------------------------------------------------------------- database

function defaultDatabase() {
  return {
    accounts: [],
    attendance: [],
    payments: [],
    equipment: [],
    maintenance: [],
    settings: { gym: 'FitPulse Gym', remind: 7, emailOn: true }
  }
}

function loadDatabase() {
  if (!fs.existsSync(databasePath)) {
    fs.writeFileSync(databasePath, JSON.stringify(defaultDatabase(), null, 2))
  }
  let database
  try {
    database = JSON.parse(fs.readFileSync(databasePath, 'utf8'))
  } catch {
    database = defaultDatabase()
  }
  // Tolerate databases created before attendance/payments existed.
  database.accounts ||= []
  database.attendance ||= []
  database.payments ||= []
  database.equipment ||= []
  database.maintenance ||= []
  database.settings ||= { gym: 'FitPulse Gym', remind: 7, emailOn: true }
  return database
}

function saveDatabase(database) {
  fs.writeFileSync(databasePath, JSON.stringify(database, null, 2))
}

function publicAccount(account) {
  const { passwordHash, resetTokenHash, resetTokenExpiresAt, ...safe } = account
  return { ...safe, status: membershipStatus(account) }
}

const planDays = { Monthly: 30, Quarterly: 90, Annual: 365, 'Unlimited Monthly': 30 }
const planCost = { Monthly: 800, Quarterly: 2200, Annual: 7800, 'Unlimited Monthly': 1500 }
function membershipStatus(account) {
  return account.membershipEnd && new Date(account.membershipEnd) < new Date()
    ? 'expired'
    : account.status || 'active'
}
function addMembershipDays(date, plan) {
  const next = new Date(date)
  next.setDate(next.getDate() + (planDays[plan] || 30))
  return next.toISOString()
}
function validAccountInput(body, { passwordRequired = false } = {}) {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!name || name.length > 100) return { error: 'Please enter a name of up to 100 characters.' }
  if (!emailPattern.test(email)) return { error: 'Please enter a valid email address.' }
  if (passwordRequired && !passwordPolicy(password))
    return {
      error: `Use at least ${passwordMin} characters, up to ${passwordMax} bytes, for the password.`
    }
  return {
    name,
    email,
    password,
    phone: typeof body.phone === 'string' ? body.phone.trim() : '',
    plan: planDays[body.plan] ? body.plan : 'Monthly'
  }
}

function paymentMethod(body) {
  if (body.method === undefined) return 'Cash'
  const method = typeof body.method === 'string' ? body.method.trim().toLowerCase() : ''
  return method === 'cash' ? 'Cash' : method === 'gcash' ? 'GCash' : null
}

// ---------------------------------------------------------------- auth helpers

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordPolicy = (password) =>
  typeof password === 'string' &&
  password.length >= passwordMin &&
  Buffer.byteLength(password, 'utf8') <= passwordMax

function createSession(account) {
  const user = {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    plan: account.plan,
    status: membershipStatus(account),
    phone: account.phone,
    joined: account.joined,
    avatarId: account.avatarId,
    membershipStart: account.membershipStart,
    membershipEnd: account.membershipEnd
  }
  return {
    user,
    role: user.role,
    token: jwt.sign({ ...user, authVersion: account.authVersion || 0 }, jwtSecret, {
      expiresIn: '8h',
      algorithm: 'HS256'
    })
  }
}

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ message: 'Authentication is required.' })
  try {
    const claims = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] })
    const account = loadDatabase().accounts.find((item) => item.id === claims.id)
    if (!account || (claims.authVersion || 0) !== (account.authVersion || 0))
      return res.status(401).json({ message: 'Your session has expired. Please log in again.' })
    req.user = { ...claims, role: account.role }
    return next()
  } catch {
    return res.status(401).json({ message: 'Your session is invalid or has expired.' })
  }
}

function requireRole(...roles) {
  return (req, res, next) =>
    roles.includes(req.user.role)
      ? next()
      : res.status(403).json({ message: 'You do not have permission for this resource.' })
}

// Simple in-memory rate limiter. Restarting the server clears the counters, which
// is acceptable for this project's scale.
const rateBuckets = new Map()
function rateLimit({ windowMs = 15 * 60 * 1000, max = 10 } = {}) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.method}:${req.originalUrl}`
    const now = Date.now()
    const bucket = rateBuckets.get(key) || { count: 0, resetAt: now + windowMs }
    if (now > bucket.resetAt) {
      bucket.count = 0
      bucket.resetAt = now + windowMs
    }
    bucket.count += 1
    rateBuckets.set(key, bucket)
    if (rateBuckets.size > 10_000) rateBuckets.clear()
    if (bucket.count > max)
      return res
        .status(429)
        .json({ message: 'Too many attempts. Please try again in a few minutes.' })
    next()
  }
}

// ---------------------------------------------------------------- routes

app.use('/api', demoAccountRoutes({ isProduction, loadDatabase, rateLimit }))
app.use('/api', scannerRoutes({ loadDatabase, saveDatabase, authenticate, rateLimit, jwtSecret }))
app.use(
  '/api',
  avatarRoutes({ loadDatabase, saveDatabase, authenticate, requireRole, rateLimit, directory })
)

app.post('/api/auth/register', async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body.password === 'string' ? req.body.password : ''
  if (!name || name.length > 100)
    return res.status(400).json({ message: 'Please enter a name of up to 100 characters.' })
  if (!emailPattern.test(email))
    return res.status(400).json({ message: 'Please enter a valid email address.' })
  if (!passwordPolicy(password))
    return res.status(400).json({
      message: `Use at least ${passwordMin} characters, up to ${passwordMax} bytes, for the password.`
    })
  const database = loadDatabase()
  if (database.accounts.some((account) => account.email === email))
    return res.status(409).json({ message: 'An account with this email already exists.' })
  database.accounts.push({
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: 'user',
    plan: 'Unlimited Monthly',
    status: 'active',
    joined: new Date().toISOString()
  })
  saveDatabase(database)
  return res.status(201).json({ message: 'Account created. Please log in.' })
})

app.post('/api/auth/login', rateLimit({ max: 10 }), async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body.password === 'string' ? req.body.password : ''
  const account = loadDatabase().accounts.find((item) => item.email === email)
  if (!account || !(await bcrypt.compare(password, account.passwordHash || '')))
    return res.status(401).json({ message: 'Invalid email or password.' })
  return res.json(createSession(account))
})

// Always use a generic response so this endpoint cannot reveal registered emails.
app.post('/api/auth/forgot-password', rateLimit({ max: 5 }), async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const database = loadDatabase()
  const account = database.accounts.find((item) => item.email === email)
  if (account) {
    const token = crypto.randomBytes(32).toString('hex')
    account.resetTokenHash = crypto.createHash('sha256').update(token).digest('hex')
    account.resetTokenExpiresAt = Date.now() + resetTokenTtl
    saveDatabase(database)
    const resetLink = `${clientUrl}/reset-password?token=${token}`
    try {
      if (mailer) {
        await mailer.sendMail({
          from: process.env.SMTP_FROM || 'FitPulse <no-reply@fitpulse.local>',
          to: account.email,
          subject: 'Reset your FitPulse password',
          text: `Use this link within 15 minutes to reset your password: ${resetLink}`
        })
      } else if (isProduction) {
        // Never print one-time tokens to logs in production.
        console.error('Password reset email could not be sent: SMTP is not configured.')
      } else {
        // Local development fallback: the token never goes back to the browser.
        console.log(`FitPulse password reset link: ${resetLink}`)
      }
    } catch (error) {
      console.error('Password reset email could not be sent:', error.message)
    }
  }
  return res.json({ message: 'If that email exists, a reset link was sent.' })
})

app.post('/api/auth/reset-password', async (req, res) => {
  const token = typeof req.body.token === 'string' ? req.body.token : ''
  const password = typeof req.body.password === 'string' ? req.body.password : ''
  if (!token || !passwordPolicy(password))
    return res.status(400).json({
      message: `Use at least ${passwordMin} characters, up to ${passwordMax} bytes, for the new password.`
    })
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const database = loadDatabase()
  const account = database.accounts.find(
    (item) => item.resetTokenHash === tokenHash && item.resetTokenExpiresAt > Date.now()
  )
  if (!account)
    return res.status(400).json({ message: 'This reset link is invalid or has expired.' })
  account.passwordHash = await bcrypt.hash(password, 12)
  account.authVersion = (account.authVersion || 0) + 1
  delete account.resetTokenHash
  delete account.resetTokenExpiresAt
  saveDatabase(database)
  return res.json({ message: 'Password updated. Redirecting to login...' })
})

app.get('/api/me', authenticate, (req, res) => {
  const account = loadDatabase().accounts.find((item) => item.id === req.user.id)
  if (!account) return res.status(401).json({ message: 'Your session is invalid or has expired.' })
  return res.json({ user: publicAccount(account) })
})

app.get('/api/members', authenticate, requireRole('admin', 'staff'), (req, res) => {
  const members = loadDatabase().accounts.map((account) => ({
    ...publicAccount(account),
    status: membershipStatus(account)
  }))
  res.json({ members })
})

app.post('/api/admin/members', authenticate, requireRole('admin', 'staff'), async (req, res) => {
  const input = validAccountInput(req.body, { passwordRequired: true })
  if (input.error) return res.status(400).json({ message: input.error })
  const method = paymentMethod(req.body)
  if (req.body.recordPayment !== false && !method)
    return res.status(400).json({ message: 'Choose Cash or GCash for a recorded payment.' })
  const database = loadDatabase()
  if (database.accounts.some((account) => account.email === input.email))
    return res.status(409).json({ message: 'An account with this email already exists.' })
  const now = new Date().toISOString()
  const member = {
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash: await bcrypt.hash(input.password, 12),
    role: 'user',
    plan: input.plan,
    status: 'active',
    joined: now,
    membershipStart: now,
    membershipEnd: addMembershipDays(now, input.plan)
  }
  database.accounts.push(member)
  if (req.body.recordPayment !== false)
    database.payments.push({
      id: crypto.randomUUID(),
      memberId: member.id,
      memberName: member.name,
      amount: planCost[input.plan],
      method,
      plan: input.plan,
      type: 'New',
      date: now
    })
  saveDatabase(database)
  res.status(201).json({ member: publicAccount(member) })
})

app.patch(
  '/api/admin/members/:id',
  authenticate,
  requireRole('admin', 'staff'),
  async (req, res) => {
    const database = loadDatabase()
    const member = database.accounts.find(
      (account) => account.id === req.params.id && !['admin', 'staff'].includes(account.role)
    )
    if (!member) return res.status(404).json({ message: 'Member not found.' })
    const input = validAccountInput({ ...member, ...req.body })
    if (input.error) return res.status(400).json({ message: input.error })
    if (
      database.accounts.some((account) => account.id !== member.id && account.email === input.email)
    )
      return res.status(409).json({ message: 'An account with this email already exists.' })
    Object.assign(member, {
      name: input.name,
      email: input.email,
      phone: input.phone,
      plan: input.plan
    })
    if (req.body.password) {
      if (!passwordPolicy(req.body.password))
        return res.status(400).json({
          message: `Use at least ${passwordMin} characters, up to ${passwordMax} bytes, for the password.`
        })
      member.passwordHash = await bcrypt.hash(req.body.password, 12)
      member.authVersion = (member.authVersion || 0) + 1
      delete member.resetTokenHash
      delete member.resetTokenExpiresAt
    }
    saveDatabase(database)
    res.json({ member: publicAccount(member) })
  }
)

app.post(
  '/api/admin/members/:id/renew',
  authenticate,
  requireRole('admin', 'staff'),
  (req, res) => {
    const database = loadDatabase()
    const member = database.accounts.find(
      (account) => account.id === req.params.id && !['admin', 'staff'].includes(account.role)
    )
    if (!member) return res.status(404).json({ message: 'Member not found.' })
    const method = paymentMethod(req.body)
    const amount =
      req.body.amount === undefined
        ? planCost[req.body.plan] || planCost[member.plan] || planCost.Monthly
        : Number(req.body.amount)
    if (!method || !Number.isFinite(amount) || amount <= 0)
      return res.status(400).json({ message: 'Use Cash or GCash and a positive payment amount.' })
    const plan = planDays[req.body.plan] ? req.body.plan : member.plan || 'Monthly'
    const now = new Date()
    const base =
      member.membershipEnd && new Date(member.membershipEnd) > now
        ? new Date(member.membershipEnd)
        : now
    member.plan = plan
    member.status = 'active'
    member.membershipStart ||= now.toISOString()
    member.membershipEnd = addMembershipDays(base, plan)
    const payment = {
      id: crypto.randomUUID(),
      memberId: member.id,
      memberName: member.name,
      amount,
      method,
      plan,
      type: 'Renewal',
      date: now.toISOString()
    }
    database.payments.push(payment)
    saveDatabase(database)
    res.json({ member: publicAccount(member), payment })
  }
)

app.get('/api/admin/equipment', authenticate, requireRole('admin', 'staff'), (req, res) => {
  const database = loadDatabase()
  res.json({ equipment: database.equipment, maintenance: database.maintenance })
})
app.post('/api/admin/equipment', authenticate, requireRole('admin', 'staff'), (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
  if (!name) return res.status(400).json({ message: 'Equipment name is required.' })
  const database = loadDatabase()
  const equipment = {
    id: crypto.randomUUID(),
    name,
    category: typeof req.body.category === 'string' ? req.body.category : 'Other',
    condition: 'Good',
    lastInspected: new Date().toISOString()
  }
  database.equipment.push(equipment)
  saveDatabase(database)
  res.status(201).json({ equipment })
})
app.patch('/api/admin/equipment/:id', authenticate, requireRole('admin', 'staff'), (req, res) => {
  const database = loadDatabase()
  const equipment = database.equipment.find((item) => item.id === req.params.id)
  if (!equipment) return res.status(404).json({ message: 'Equipment not found.' })
  if (
    req.body.condition !== undefined &&
    !['Good', 'Needs Maintenance', 'Out of Service'].includes(req.body.condition)
  )
    return res.status(400).json({ message: 'Choose a valid equipment condition.' })
  const note = typeof req.body.maintenanceNote === 'string' ? req.body.maintenanceNote.trim() : ''
  if (req.body.maintenanceNote !== undefined && (!note || note.length > 500))
    return res.status(400).json({ message: 'Use a maintenance note of 1–500 characters.' })
  if (req.body.condition !== undefined) {
    equipment.condition = req.body.condition
    if (!note)
      database.maintenance.unshift({
        id: crypto.randomUUID(),
        equipmentId: equipment.id,
        item: equipment.name,
        note: `Condition set to ${equipment.condition}`,
        date: new Date().toISOString()
      })
  }
  if (note)
    database.maintenance.unshift({
      id: crypto.randomUUID(),
      equipmentId: equipment.id,
      item: equipment.name,
      note,
      date: new Date().toISOString()
    })
  if (req.body.inspected) {
    equipment.lastInspected = new Date().toISOString()
    database.maintenance.unshift({
      id: crypto.randomUUID(),
      equipmentId: equipment.id,
      item: equipment.name,
      note: 'Inspection completed',
      date: equipment.lastInspected
    })
  }
  saveDatabase(database)
  res.json({ equipment })
})

app.get('/api/admin/settings', authenticate, requireRole('admin', 'staff'), (req, res) =>
  res.json({ settings: loadDatabase().settings, emailConfigured: smtpConfigured })
)
app.patch('/api/admin/settings', authenticate, requireRole('admin', 'staff'), (req, res) => {
  const database = loadDatabase()
  if (typeof req.body.gym === 'string' && req.body.gym.trim())
    database.settings.gym = req.body.gym.trim()
  if (Number.isInteger(req.body.remind) && req.body.remind >= 1 && req.body.remind <= 30)
    database.settings.remind = req.body.remind
  if (typeof req.body.emailOn === 'boolean') database.settings.emailOn = req.body.emailOn
  saveDatabase(database)
  res.json({ settings: database.settings })
})
app.post(
  '/api/admin/members/:id/expiry-email',
  authenticate,
  requireRole('admin', 'staff'),
  rateLimit({ max: 10 }),
  async (req, res) => {
    const database = loadDatabase()
    const member = database.accounts.find(
      (account) => account.id === req.params.id && ['user', 'member'].includes(account.role)
    )
    if (!member) return res.status(404).json({ message: 'Member not found.' })
    if (!database.settings.emailOn)
      return res.status(409).json({ message: 'Email reminders are disabled in Gym Preferences.' })
    const end = Date.parse(member.membershipEnd)
    if (!Number.isFinite(end))
      return res
        .status(400)
        .json({ message: 'Set a valid membership expiry date before sending reminders.' })
    if (end > Date.now() + database.settings.remind * 86400000)
      return res.status(400).json({ message: 'This membership is not yet due for a reminder.' })
    if (!mailer)
      return res
        .status(503)
        .json({ message: 'Email delivery is unavailable. Configure SMTP on the server.' })
    const expiryDate = new Date(end).toLocaleDateString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    const expired = end <= Date.now()
    await mailer.sendMail({
      from: process.env.SMTP_FROM || 'FitPulse <no-reply@fitpulse.local>',
      to: member.email,
      subject: expired ? 'FitPulse membership expired' : 'FitPulse membership expiry reminder',
      text: `Hello ${member.name}, your ${member.plan} membership ${expired ? 'expired' : 'expires'} on ${expiryDate}. Please visit the front desk to renew.`
    })
    res.json({ message: `Expiry email sent to ${member.email}.` })
  }
)

app.patch('/api/profile', authenticate, async (req, res) => {
  const database = loadDatabase()
  const account = database.accounts.find((item) => item.id === req.user.id)
  const input = validAccountInput({ ...account, ...req.body })
  if (!account) return res.status(404).json({ message: 'Account not found.' })
  if (input.error) return res.status(400).json({ message: input.error })
  if (database.accounts.some((item) => item.id !== account.id && item.email === input.email))
    return res.status(409).json({ message: 'An account with this email already exists.' })
  Object.assign(account, { name: input.name, email: input.email, phone: input.phone })
  saveDatabase(database)
  res.json({ user: publicAccount(account) })
})
app.post('/api/profile/change-password', authenticate, rateLimit({ max: 10 }), async (req, res) => {
  const { currentPassword, password, confirmPassword } = req.body || {}
  if (
    typeof currentPassword !== 'string' ||
    !currentPassword ||
    Buffer.byteLength(currentPassword, 'utf8') > 72
  )
    return res.status(400).json({ message: 'Enter your current password (up to 72 bytes).' })
  if (!passwordPolicy(password))
    return res
      .status(400)
      .json({ message: 'Use at least 8 characters, up to 72 bytes, for your new password.' })
  if (confirmPassword !== undefined && confirmPassword !== password)
    return res.status(400).json({ message: 'The new passwords do not match.' })
  const database = loadDatabase()
  const account = database.accounts.find((item) => item.id === req.user.id)
  if (!account || !(await bcrypt.compare(currentPassword, account.passwordHash || '')))
    return res.status(400).json({ message: 'Current password is incorrect.' })
  if (currentPassword === password)
    return res
      .status(400)
      .json({ message: 'Choose a password different from your current password.' })
  account.passwordHash = await bcrypt.hash(password, 12)
  account.authVersion = (account.authVersion || 0) + 1
  delete account.resetTokenHash
  delete account.resetTokenExpiresAt
  saveDatabase(database)
  res.json({ message: 'Password updated.', session: createSession(account) })
})

app.get('/api/attendance', authenticate, (req, res) => {
  const database = loadDatabase()
  const isStaff = ['admin', 'staff'].includes(req.user.role)
  const attendance = isStaff
    ? database.attendance
    : database.attendance.filter((item) => item.memberId === req.user.id)
  res.json({ attendance: attendance.map(({ qrTokenId, scannerRequestId, ...record }) => record) })
})

app.post('/api/attendance/check-in', authenticate, (req, res) => {
  res
    .status(403)
    .json({ message: 'Check-in must be recorded by the entrance scanner or gym staff.' })
})

app.get('/api/payments', authenticate, (req, res) => {
  const database = loadDatabase()
  const isStaff = ['admin', 'staff'].includes(req.user.role)
  const payments = isStaff
    ? database.payments
    : database.payments.filter((item) => item.memberId === req.user.id)
  res.json({ payments })
})

app.post('/api/admin/attendance', authenticate, requireRole('admin', 'staff'), (req, res) => {
  const memberId = typeof req.body.memberId === 'string' ? req.body.memberId.trim() : ''
  const database = loadDatabase()
  const member = database.accounts.find((account) => account.id === memberId)
  if (!member) return res.status(400).json({ message: 'Unknown member id.' })
  if (membershipFailure(member))
    return res.status(403).json({ message: 'An active membership with valid dates is required.' })
  const attendance = {
    id: crypto.randomUUID(),
    memberId,
    memberName: member.name,
    source: 'Staff',
    date: new Date().toISOString()
  }
  database.attendance.push(attendance)
  saveDatabase(database)
  res.status(201).json({ attendance })
})

app.post('/api/admin/payments', authenticate, requireRole('admin', 'staff'), (req, res) => {
  const memberId = typeof req.body.memberId === 'string' ? req.body.memberId.trim() : ''
  const amount = Number(req.body.amount)
  const method = paymentMethod(req.body)
  if (!method)
    return res.status(400).json({ message: 'Choose Cash or GCash for a recorded payment.' })
  if (!Number.isFinite(amount) || amount <= 0)
    return res.status(400).json({ message: 'A positive payment amount is required.' })
  const database = loadDatabase()
  const member = database.accounts.find((account) => account.id === memberId)
  if (!member) return res.status(400).json({ message: 'Unknown member id.' })
  const payment = {
    id: crypto.randomUUID(),
    memberId,
    memberName: member.name,
    amount,
    method,
    type: 'Membership',
    plan: member.plan,
    date: new Date().toISOString()
  }
  database.payments.push(payment)
  saveDatabase(database)
  res.status(201).json({ payment })
})

// ---------------------------------------------------------------- seed & start

async function ensureSeedData() {
  const database = loadDatabase()
  let changed = false

  if (!database.accounts.some((account) => account.email === 'admin@fitpulse.com')) {
    // In production the first admin password must be provided explicitly.
    const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? '' : 'admin123')
    if (!adminPassword)
      throw new Error('ADMIN_PASSWORD is required for the first FitPulse admin in production.')
    database.accounts.push({
      id: crypto.randomUUID(),
      name: 'FitPulse Staff',
      email: 'admin@fitpulse.com',
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: 'admin',
      plan: 'Staff access',
      status: 'active',
      joined: new Date().toISOString()
    })
    changed = true
  }

  // Demo data only outside production so real deployments stay clean.
  if (isProduction) {
    if (changed) saveDatabase(database)
    return
  }

  let demoMember = database.accounts.find((account) => account.email === 'member@fitpulse.com')
  if (!demoMember) {
    demoMember = {
      id: crypto.randomUUID(),
      name: 'Mia Cruz',
      email: 'member@fitpulse.com',
      passwordHash: await bcrypt.hash('member123', 12),
      role: 'user',
      plan: 'Unlimited Monthly',
      status: 'active',
      joined: new Date().toISOString()
    }
    database.accounts.push(demoMember)
    changed = true
  }

  if (database.attendance.length === 0) {
    const day = 86_400_000
    const now = Date.now()
    for (const offset of [0, 2 * day, 4 * day, 7 * day]) {
      database.attendance.push({
        id: crypto.randomUUID(),
        memberId: demoMember.id,
        memberName: demoMember.name,
        date: new Date(now - offset).toISOString()
      })
    }
    changed = true
  }

  if (database.payments.length === 0) {
    database.payments.push(
      {
        id: crypto.randomUUID(),
        memberId: demoMember.id,
        memberName: demoMember.name,
        amount: 1500,
        method: 'GCash',
        plan: demoMember.plan,
        date: new Date(Date.now() - 32 * 86_400_000).toISOString()
      },
      {
        id: crypto.randomUUID(),
        memberId: demoMember.id,
        memberName: demoMember.name,
        amount: 1500,
        method: 'Cash',
        plan: demoMember.plan,
        date: new Date().toISOString()
      }
    )
    changed = true
  }

  if (changed) saveDatabase(database)
}

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  if (error.type === 'entity.too.large')
    return res.status(413).json({ message: 'This upload is too large.' })
  if (error.type === 'entity.parse.failed')
    return res.status(400).json({ message: 'Invalid request body.' })
  console.error('FitPulse request failed:', error.message)
  return res.status(500).json({ message: 'Something went wrong. Please try again.' })
})

ensureSeedData()
  .then(() => app.listen(port, () => console.log(`FitPulse API listening on ${port}`)))
  .catch((error) => {
    console.error('Failed to start FitPulse API:', error.message)
    process.exit(1)
  })
