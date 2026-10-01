import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import jwt from 'jsonwebtoken'

const app = express()
const port = process.env.PORT || 3001
const jwtSecret = process.env.JWT_SECRET || 'replace-this-development-secret'
const directory = path.dirname(fileURLToPath(import.meta.url))
const databasePath = path.join(directory, 'data.json')

app.use(cors())
app.use(express.json())

function loadDatabase() {
  if (!fs.existsSync(databasePath)) {
    fs.writeFileSync(databasePath, JSON.stringify({ accounts: [] }, null, 2))
  }
  return JSON.parse(fs.readFileSync(databasePath, 'utf8'))
}

function saveDatabase(database) {
  fs.writeFileSync(databasePath, JSON.stringify(database, null, 2))
}

async function ensureStaffAccount() {
  const database = loadDatabase()
  if (database.accounts.some((account) => account.email === 'admin@fitpulse.com')) return
  database.accounts.push({
    id: crypto.randomUUID(),
    name: 'FitPulse Staff',
    email: 'admin@fitpulse.com',
    passwordHash: await bcrypt.hash('admin123', 12),
    role: 'admin'
  })
  saveDatabase(database)
}

function createSession(account) {
  const user = { id: account.id, name: account.name, email: account.email, role: account.role }
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

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Name, email, and password are required.' })
  const database = loadDatabase()
  if (database.accounts.some((account) => account.email.toLowerCase() === email.toLowerCase()))
    return res.status(409).json({ message: 'An account with this email already exists.' })
  const account = {
    id: crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    passwordHash: await bcrypt.hash(password, 12),
    role: 'user'
  }
  database.accounts.push(account)
  saveDatabase(database)
  return res.status(201).json({ message: 'Account created. Please log in.' })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  const account = loadDatabase().accounts.find((item) => item.email === email?.toLowerCase())
  if (!account || !(await bcrypt.compare(password || '', account.passwordHash)))
    return res.status(401).json({ message: 'Invalid email or password.' })
  return res.json(createSession(account))
})

app.get('/api/me', authenticate, (req, res) => res.json({ user: req.user }))
app.get('/api/admin/members', authenticate, requireRole('admin', 'staff'), (req, res) => {
  const members = loadDatabase().accounts.map(({ passwordHash, ...account }) => account)
  res.json({ members })
})
app.post('/api/admin/payments', authenticate, requireRole('admin', 'staff'), (req, res) =>
  res.status(201).json({ payment: req.body })
)
app.post('/api/admin/attendance', authenticate, requireRole('admin', 'staff'), (req, res) =>
  res.status(201).json({ attendance: req.body })
)

ensureStaffAccount().then(() =>
  app.listen(port, () => console.log(`FitPulse API listening on ${port}`))
)
