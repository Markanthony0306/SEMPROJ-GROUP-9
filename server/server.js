import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'

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
  return { accounts: [], attendance: [], payments: [] }
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
  return database
}

function saveDatabase(database) {
  fs.writeFileSync(databasePath, JSON.stringify(database, null, 2))
}

function publicAccount(account) {
  const { passwordHash, resetTokenHash, resetTokenExpiresAt, ...safe } = account
  return safe
}

// ---------------------------------------------------------------- auth helpers

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordPolicy = (password) =>
  typeof password === 'string' && password.length >= passwordMin && password.length <= passwordMax

function createSession(account) {
  const user = {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    plan: account.plan,
    status: account.status,
    phone: account.phone,
    joined: account.joined
  }
  return { user, role: user.role, token: jwt.sign(user, jwtSecret, { expiresIn: '8h' }) }
}

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ message: 'Authentication is required.' })
  try {
    req.user = jwt.verify(token, jwtSecret)
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

app.post('/api/auth/register', async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body.password === 'string' ? req.body.password : ''
  if (!name || name.length > 100)
    return res.status(400).json({ message: 'Please enter a name of up to 100 characters.' })
  if (!emailPattern.test(email))
    return res.status(400).json({ message: 'Please enter a valid email address.' })
  if (!passwordPolicy(password))
    return res
      .status(400)
      .json({ message: `The password must be ${passwordMin}-${passwordMax} characters.` })
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
    return res
      .status(400)
      .json({ message: `Use a new password with ${passwordMin}-${passwordMax} characters.` })
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const database = loadDatabase()
  const account = database.accounts.find(
    (item) => item.resetTokenHash === tokenHash && item.resetTokenExpiresAt > Date.now()
  )
  if (!account)
    return res.status(400).json({ message: 'This reset link is invalid or has expired.' })
  account.passwordHash = await bcrypt.hash(password, 12)
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
  const members = loadDatabase().accounts.map(publicAccount)
  res.json({ members })
})

app.get('/api/attendance', authenticate, (req, res) => {
  const database = loadDatabase()
  const isStaff = ['admin', 'staff'].includes(req.user.role)
  const attendance = isStaff
    ? database.attendance
    : database.attendance.filter((item) => item.memberId === req.user.id)
  res.json({ attendance })
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
  const attendance = {
    id: crypto.randomUUID(),
    memberId,
    memberName: member.name,
    date: new Date().toISOString()
  }
  database.attendance.push(attendance)
  saveDatabase(database)
  res.status(201).json({ attendance })
})

app.post('/api/admin/payments', authenticate, requireRole('admin', 'staff'), (req, res) => {
  const memberId = typeof req.body.memberId === 'string' ? req.body.memberId.trim() : ''
  const amount = Number(req.body.amount)
  const method = typeof req.body.method === 'string' ? req.body.method.trim() : 'Cash'
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
        method: 'Online Payment',
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

ensureSeedData()
  .then(() => app.listen(port, () => console.log(`FitPulse API listening on ${port}`)))
  .catch((error) => {
    console.error('Failed to start FitPulse API:', error.message)
    process.exit(1)
  })
