import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import jwt from 'jsonwebtoken'
import { createEmailDelivery, emailConfiguration } from './services/emailDelivery.js'
import { accountRoutes } from './routes/accounts.js'
import { scannerRoutes } from './routes/scanner.js'
import { avatarRoutes } from './routes/avatar.js'
import { demoAccountRoutes } from './routes/demo-accounts.js'
import { reportRoutes } from './routes/reports.js'
import { notificationRoutes } from './routes/notifications.js'
import { createAdminNotificationService } from './services/adminNotifications.js'
import { EQUIPMENT_CATEGORIES } from '../shared/equipmentCategories.js'
import { welcomeEmail } from './services/emailTemplates.js'
import { createMembershipReminderService, startMembershipReminders } from './services/membershipReminders.js'
import { sendPasswordRecovery } from './services/passwordRecovery.js'
import { passwordLoginHandler } from './routes/passwordLogin.js'
import { authenticatePassword, PasswordAuthenticationError } from './services/passwordAuthentication.js'
import { createSupabaseAuthClient } from './lib/authClient.js'
import { supabase } from './lib/supabase.js'
import { withMemberAccountLock } from './lib/memberAccountLock.js'
import {
  decryptFaceDescriptor,
  encryptFaceDescriptor,
  faceDescriptorDistance,
  normalizeFaceDescriptor,
  parseFaceEncryptionKey
} from './lib/face-auth.js'
import {
  loadAccount as loadSupabaseAccount,
  loadDatabase as loadSupabaseDatabase,
  saveDatabase as saveSupabaseDatabase
} from './lib/database.js'

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

const supabaseAuthKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!process.env.SUPABASE_URL || !supabaseAuthKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in .env'
  );
}

const app = express()
const port = Number(process.env.PORT || 3001)
const isProduction = process.env.NODE_ENV === 'production'
const passwordMin = 8
const passwordMax = 72
const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')

// Never fall back to a hard-coded signing key: someone could forge sessions with
// it. In development we use an ephemeral secret per boot; production must set one.
const jwtSecret =
  process.env.JWT_SECRET || (isProduction ? '' : crypto.randomBytes(32).toString('hex'))
if (!jwtSecret) {
  console.error('JWT_SECRET is required when NODE_ENV=production. Set it and restart the server.')
  process.exit(1)
}

const faceLoginEnabled = process.env.FACE_LOGIN_ENABLED === 'true'
const faceEncryptionKey = parseFaceEncryptionKey()
const configuredFaceThreshold = Number(process.env.FACE_MATCH_THRESHOLD || 0.5)
if (faceLoginEnabled && !faceEncryptionKey) {
  throw new Error('FACE_ENCRYPTION_KEY must be a 64-character hex key when FACE_LOGIN_ENABLED=true.')
}
if (!Number.isFinite(configuredFaceThreshold) || configuredFaceThreshold <= 0 || configuredFaceThreshold > 1) {
  throw new Error('FACE_MATCH_THRESHOLD must be a number greater than 0 and at most 1.')
}
const faceMatchThreshold = configuredFaceThreshold
const faceChallenges = new Map()

// Restrict browser origins to the known frontend(s). Override with CORS_ORIGINS.
const corsOrigins = (
  process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
app.use(cors({ origin: corsOrigins }))
app.use(express.json({ limit: '100kb' }))

const emailConfig = emailConfiguration()
const smtpConfigured = emailConfig.configured
const mailer = createEmailDelivery(emailConfig)

// ---------------------------------------------------------------- database

const loadDatabase = (sections) => loadSupabaseDatabase(supabase, sections)
const loadAccount = (id) => loadSupabaseAccount(supabase, id)
const saveDatabase = (database) => saveSupabaseDatabase(supabase, database)
const membershipReminders = createMembershipReminderService({
  supabase,
  loadDatabase,
  mailer,
  from: emailConfig.from,
  loginUrl: clientUrl
})
const adminNotifications = createAdminNotificationService({
  supabase, loadDatabase, smtpConfigured, reminders: membershipReminders
})

function publicAccount(account) {
  const { authUserId, authVersion, subscriptionId, subscriptionCreatedAt, planId, ...safe } = account
  return { ...safe, status: membershipStatus(account) }
}

function membershipStatus(account) {
  return account.membershipEnd && new Date(account.membershipEnd) < new Date()
    ? 'expired'
    : account.status || 'active'
}
function addMembershipDays(date, durationDays = 30) {
  const next = new Date(date)
  next.setDate(next.getDate() + Number(durationDays || 30))
  return next.toISOString()
}
function validAccountInput(body, { passwordRequired = false } = {}) {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const plan = typeof body.plan === 'string' ? body.plan.trim() : ''
  if (!name || name.length > 100) return { error: 'Please enter a name of up to 100 characters.' }
  if (!emailPattern.test(email)) return { error: 'Please enter a valid email address.' }
  if (!plan || plan.length > 100) return { error: 'Choose a valid membership plan.' }
  if (passwordRequired && !passwordPolicy(password))
    return {
      error: `Use at least ${passwordMin} characters, up to ${passwordMax} bytes, for the password.`
    }
  return {
    name,
    email,
    password,
    phone: typeof body.phone === 'string' ? body.phone.trim() : '',
    plan
  }
}

function paymentMethod(body) {
  if (body.method === undefined) return 'Cash'
  const method = typeof body.method === 'string' ? body.method.trim().toLowerCase() : ''
  return method === 'cash' ? 'Cash' : method === 'gcash' ? 'GCash' : null
}

async function getRoleId(roleName) {
  const { data, error } = await supabase
    .from('roles')
    .select('role_id')
    .ilike('role_name', roleName)
    .maybeSingle()
  if (error) throw new Error(`Unable to find the '${roleName}' role: ${error.message}`)
  if (!data) throw new Error(`The '${roleName}' role is missing. Run the Supabase schema migration.`)
  return data.role_id
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

function createFaceChallenge(account) {
  const now = Date.now()
  for (const [id, challenge] of faceChallenges) {
    if (challenge.expiresAt <= now) faceChallenges.delete(id)
  }
  if (faceChallenges.size > 10_000) faceChallenges.clear()
  const id = crypto.randomUUID()
  faceChallenges.set(id, { userId: account.id, expiresAt: now + 2 * 60 * 1000 })
  return jwt.sign({ id: account.id, purpose: 'face-login', jti: id }, jwtSecret, {
    expiresIn: '2m',
    algorithm: 'HS256'
  })
}

function consumeFaceChallenge(token) {
  if (typeof token !== 'string' || token.length > 4096) return null
  let claims
  try {
    claims = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] })
  } catch {
    return null
  }
  if (claims.purpose !== 'face-login' || typeof claims.jti !== 'string') return null
  const challenge = faceChallenges.get(claims.jti)
  faceChallenges.delete(claims.jti)
  if (!challenge || challenge.expiresAt <= Date.now() || challenge.userId !== claims.id) return null
  return challenge
}

async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ message: 'Authentication is required.' })
  let claims
  try {
    claims = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] })
  } catch {
    return res.status(401).json({ message: 'Your session is invalid or has expired.' })
  }
  try {
    const account = await loadAccount(claims.id)
    if (!account || (claims.authVersion || 0) !== (account.authVersion || 0))
      return res.status(401).json({ message: 'Your session has expired. Please log in again.' })
    req.user = { ...claims, role: account.role }
    return next()
  } catch (error) {
    console.error('Supabase session lookup failed:', error.message)
    return res.status(503).json({ message: 'Account service is temporarily unavailable.' })
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

app.use('/api', accountRoutes({
  authenticate, requireRole, rateLimit, loadAccount, supabase,
  createAuthClient: createSupabaseAuthClient, mailer, from: emailConfig.from, clientUrl
}))
app.use('/api', reportRoutes({ authenticate, requireRole, loadDatabase, supabase, rateLimit }))
app.use('/api', notificationRoutes({
  authenticate, requireRole, rateLimit, notifications: adminNotifications,
  reminders: membershipReminders, mailer
}))

app.use('/api', demoAccountRoutes({
  isProduction,
  loadDatabase,
  rateLimit,
  verifyPassword: async (email, password) => {
    const { error } = await createSupabaseAuthClient().auth.signInWithPassword({ email, password })
    return !error
  }
}))
app.use('/api', scannerRoutes({ loadAccount, authenticate, rateLimit, jwtSecret }))
app.use(
  '/api',
  avatarRoutes({ supabase, authenticate, requireRole, rateLimit })
)

app.post('/api/auth/register', authenticate, requireRole('admin'), async (req, res) => {
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
  let authUserId = null
  try {
    const database = await loadDatabase(['accounts'])
    const planRecord = database.membershipPlans.find(
      (plan) => String(plan.plan_name).toLowerCase() === 'unlimited monthly' && plan.is_active
    )
    if (!planRecord)
      return res.status(503).json({ message: 'The default membership plan is unavailable.' })
    const now = new Date().toISOString()
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    })
    if (authError || !authData.user) {
      const duplicate = /already|registered|exists/i.test(authError?.message || '')
      return res.status(duplicate ? 409 : 400).json({
        message: duplicate
          ? 'An account with this email already exists.'
          : 'Unable to create the account. Please try again.'
      })
    }
    authUserId = authData.user.id
    const member = {
      id: crypto.randomUUID(),
      authUserId,
      name,
      email,
      role: 'user',
      plan: planRecord.plan_name,
      status: 'active',
      phone: '',
      joined: now,
      membershipStart: now,
      membershipEnd: addMembershipDays(now, planRecord.duration_days),
      subscriptionId: crypto.randomUUID(),
      subscriptionCreatedAt: now,
      planId: planRecord.plan_id,
      mustChangePassword: false,
      authVersion: 0
    }
    database.accounts.push(member)
    await saveDatabase(database)
    return res.status(201).json({ message: 'Account created. Please log in.' })
  } catch (error) {
    if (authUserId) await supabase.auth.admin.deleteUser(authUserId)
    console.error('Registration failed:', error.message)
    return res.status(503).json({ message: 'Unable to create the account. Please try again.' })
  }
})


app.post('/api/auth/login', rateLimit({ max: 10 }), passwordLoginHandler({
  createAuthClient: createSupabaseAuthClient,
  supabase,
  loadAccount,
  createSession,
  faceLoginEnabled,
  createFaceChallenge
}))

app.post('/api/auth/face-verify', rateLimit({ max: 5, windowMs: 5 * 60 * 1000 }), async (req, res) => {
  if (!faceLoginEnabled || !faceEncryptionKey)
    return res.status(503).json({ message: 'Face verification is not enabled.' })
  const descriptor = normalizeFaceDescriptor(req.body?.descriptor)
  if (!descriptor) return res.status(400).json({ message: 'The face capture is invalid. Please try again.' })
  const challenge = consumeFaceChallenge(req.body?.challengeToken)
  if (!challenge) return res.status(401).json({ message: 'Face verification expired. Log in again to retry.' })

  try {
    const { data: enrollment, error } = await supabase
      .from('face_enrollments')
      .select('descriptor_encrypted')
      .eq('user_id', challenge.userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    if (!enrollment?.descriptor_encrypted)
      return res.status(401).json({ message: 'Face verification failed. Log in again or contact the gym.' })

    const savedDescriptor = decryptFaceDescriptor(enrollment.descriptor_encrypted, faceEncryptionKey)
    if (faceDescriptorDistance(descriptor, savedDescriptor) > faceMatchThreshold)
      return res.status(401).json({ message: 'Face verification failed. Log in again and try once more.' })

    const account = await loadAccount(challenge.userId)
    if (!account || account.role !== 'user' || account.status !== 'active')
      return res.status(403).json({ message: 'Your account is unavailable. Please contact the gym administrator.' })
    return res.json(createSession(account))
  } catch (error) {
    console.error('Face verification failed:', error.message)
    return res.status(503).json({ message: 'Face verification is temporarily unavailable.' })
  }
})

app.post(
  '/api/admin/members/:id/face-enrollment',
  authenticate,
  requireRole('admin', 'staff'),
  rateLimit({ max: 10 }),
  async (req, res) => {
    if (!faceEncryptionKey)
      return res.status(503).json({ message: 'Face enrollment is not configured on the server.' })
    const descriptor = normalizeFaceDescriptor(req.body?.descriptor)
    if (!descriptor || req.body?.consent !== true || req.body?.idChecked !== true)
      return res.status(400).json({ message: 'Capture one face, record member consent, and confirm the physical ID check.' })
    try {
      const member = await loadAccount(req.params.id)
      if (!member || member.role !== 'user')
        return res.status(404).json({ message: 'Member account not found.' })
      const { data: current, error: lookupError } = await supabase
        .from('face_enrollments')
        .select('enrollment_id')
        .eq('user_id', member.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (lookupError) throw lookupError

      const enrollment = {
        user_id: member.id,
        provider: 'face-api.js',
        provider_reference: 'local-aes-256-gcm-v1',
        descriptor_encrypted: encryptFaceDescriptor(descriptor, faceEncryptionKey),
        status: 'active',
        consented_at: new Date().toISOString()
      }
      let savedId = current?.enrollment_id
      if (savedId) {
        const { error } = await supabase
          .from('face_enrollments')
          .update(enrollment)
          .eq('enrollment_id', savedId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('face_enrollments')
          .insert(enrollment)
          .select('enrollment_id')
          .single()
        if (error) throw error
        savedId = data.enrollment_id
      }
      const { error: oldRowsError } = await supabase
        .from('face_enrollments')
        .delete()
        .eq('user_id', member.id)
        .eq('status', 'active')
        .neq('enrollment_id', savedId)
      if (oldRowsError) throw oldRowsError
      return res.status(201).json({ message: 'Encrypted face template enrolled.' })
    } catch (error) {
      console.error('Face enrollment failed:', error.message)
      return res.status(503).json({ message: 'Could not save face enrollment. Please try again.' })
    }
  }
)

app.delete(
  '/api/admin/members/:id/face-enrollment',
  authenticate,
  requireRole('admin', 'staff'),
  rateLimit({ max: 10 }),
  async (req, res) => {
    try {
      const { error } = await supabase
        .from('face_enrollments')
        .delete()
        .eq('user_id', req.params.id)
      if (error) throw error
      return res.json({ message: 'Member face template removed.' })
    } catch (error) {
      console.error('Admin face enrollment removal failed:', error.message)
      return res.status(503).json({ message: 'Could not remove the face template.' })
    }
  }
)

app.get('/api/profile/face-enrollment', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('face_enrollments')
      .select('enrollment_id')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return res.json({ enrolled: Boolean(data) })
  } catch (error) {
    console.error('Face enrollment status lookup failed:', error.message)
    return res.status(503).json({ message: 'Could not load face verification settings.' })
  }
})

app.delete('/api/profile/face-enrollment', authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('face_enrollments')
      .delete()
      .eq('user_id', req.user.id)
    if (error) throw error
    return res.json({ message: 'Face sign-in has been disabled.' })
  } catch (error) {
    console.error('Face enrollment revocation failed:', error.message)
    return res.status(503).json({ message: 'Could not disable face sign-in. Please try again.' })
  }
})


// Always use a generic response so this endpoint cannot reveal registered emails.

app.post('/api/auth/forgot-password', rateLimit({ max: 5 }), async (req, res) => {
  const email =
    typeof req.body.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : ''

  // Always use a generic response to avoid revealing registered emails.
  const response = {
    message: 'If that email exists, a reset link was sent.'
  }

  if (!emailPattern.test(email)) {
    return res.json(response)
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('email, name, status')
      .ilike('email', email)
      .maybeSingle()

    if (profileError) {
      console.error('Forgot-password profile lookup failed:', profileError.message)
      return res.status(500).json({
        message: 'Unable to process your request. Please try again.'
      })
    }

    // Don't reveal whether an account exists or is active.
    if (!profile || profile.status !== 'active') {
      return res.json(response)
    }

    // Supabase creates and verifies the one-time recovery token. With SMTP,
    // FitPulse delivers that same link in the branded account email.
    await sendPasswordRecovery({
      supabaseAdmin: supabase, supabaseAuth: createSupabaseAuthClient(), mailer,
      email: profile.email, name: profile.name,
      redirectTo: `${clientUrl}/reset-password`,
      from: emailConfig.from
    })

    return res.json(response)
  } catch (error) {
    console.error('Forgot-password request failed:', error.message)
    return res.status(500).json({
      message: 'Unable to process your request. Please try again.'
    })
  }
})

app.post('/api/auth/reset-password/session', rateLimit({ max: 10 }), async (req, res) => {
  const code = typeof req.body.code === 'string' ? req.body.code : ''

  if (!code) {
    return res.status(400).json({
      message: 'The reset authorization code is missing.'
    })
  }

  try {
    const { data, error } =
      await createSupabaseAuthClient().auth.exchangeCodeForSession(code)

    if (error || !data.session?.access_token) {
      return res.status(401).json({
        message: 'This reset link is invalid or expired. Request a new one.'
      })
    }

    return res.json({
      accessToken: data.session.access_token
    })
  } catch (error) {
    console.error('Recovery session exchange failed:', error.message)

    return res.status(500).json({
      message: 'Unable to verify the reset link. Please try again.'
    })
  }
})

app.post('/api/auth/reset-password', async (req, res) => {

  const password =
    typeof req.body.password === 'string' ? req.body.password : ''

  if (!passwordPolicy(password)) {
    return res.status(400).json({
      message: `Use at least ${passwordMin} characters, up to ${passwordMax} bytes, for the new password.`
    })
  }

  try {
    // This route requires a valid Supabase recovery session.
    const authorization = req.headers.authorization || ''
    const accessToken = authorization.replace(/^Bearer\s+/i, '')

    if (!accessToken) {
      return res.status(401).json({
        message: 'Your reset link is invalid or expired. Request a new one.'
      })
    }

    // Validate the recovery session with Supabase.
    const { data: authData, error: authError } =
      await createSupabaseAuthClient().auth.getUser(accessToken)

    if (authError || !authData.user) {
      return res.status(401).json({
        message: 'Your reset link is invalid or expired. Request a new one.'
      })
    }

    const authUserId = authData.user.id

    // Find the linked FitPulse profile.
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, auth_user_id, auth_version')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (profileError || !profile) {
      console.error(
        'Reset-password profile lookup failed:',
        profileError?.message
      )
      return res.status(400).json({
        message: 'Unable to find your FitPulse account.'
      })
    }

    // Update the real Supabase Auth password.
    const { error: updateError } =
      await supabase.auth.admin.updateUserById(authUserId, {
        password
      })

    if (updateError) {
      console.error('Supabase password reset failed:', updateError.message)
      return res.status(500).json({
        message: 'Unable to reset your password. Please try again.'
      })
    }

    const { error: profileUpdateError } = await supabase
      .from('users')
      .update({
        auth_version: Number(profile.auth_version || 0) + 1,
        must_change_password: false
      })
      .eq('id', profile.id)

    if (profileUpdateError) {
      console.error('Supabase password state update failed:', profileUpdateError.message)
      return res.status(500).json({ message: 'Unable to reset your password. Please try again.' })
    }

    return res.json({
      message: 'Password reset successfully. Please log in with your new password.'
    })
  } catch (error) {
    console.error('Password reset failed:', error.message)
    return res.status(500).json({
      message: 'Unable to reset your password. Please try again.'
    })
  }
})


app.get('/api/me', authenticate, async (req, res) => {
  try {
    const account = await loadAccount(req.user.id)

    if (!account) {
      return res.status(401).json({
        message: 'Your session is invalid or has expired.'
      })
    }

    if (account.status !== 'active') {
      return res.status(401).json({
        message: 'Your account is unavailable.'
      })
    }
    if (!['admin', 'staff', 'user', 'member'].includes(account.role)) {
      return res.status(403).json({
        message: 'Your account role is not supported.'
      })
    }

    return res.json({
      user: {
        ...publicAccount(account),
        accountStatus: account.status,
        mustChangePassword: account.mustChangePassword
      }
    })
  } catch (error) {
    console.error('Unable to load current user:', error.message)
    return res.status(500).json({
      message: 'Unable to load your profile.'
    })
  }
})


app.get('/api/members', authenticate, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const database = await loadDatabase(['accounts'])
    const members = database.accounts
      .slice()
      .sort((a, b) => Date.parse(b.joined || 0) - Date.parse(a.joined || 0))
      .map((account) => ({
        ...publicAccount(account),
        memberCode: account.memberCode,
        accountStatus: account.status,
        createdAt: account.joined
      }))
    return res.json({ members })
  } catch (error) {
    console.error('Unable to load members:', error.message)
    return res.status(500).json({
      message: 'Unable to load members.'
    })
  }
})

app.get('/api/admin/membership-plans', authenticate, requireRole('admin', 'staff'), async (_req, res) => {
  const { data, error } = await supabase
    .from('membership_plans')
    .select('plan_id, plan_name, duration_days, price, is_active')
    .eq('is_active', true)
    .order('plan_id')

  if (error) {
    console.error('Unable to load membership plans:', error.message)
    return res.status(500).json({ message: 'Unable to load membership plans.' })
  }

  return res.json({ membershipPlans: data || [] })
})



app.post(
  '/api/admin/members',
  authenticate,
  requireRole('admin'),
  async (req, res) => {
    let authUserId = null
    let profileId = null

    try {
      const input = validAccountInput(req.body)

      if (input.error) {
        return res.status(400).json({ message: input.error })
      }

      const method = paymentMethod(req.body)

      const recordPayment = req.body.recordPayment === true

      if (recordPayment && !method) {
        return res.status(400).json({
          message: 'Choose Cash or GCash for a recorded payment.'
        })
      }

      const database = await loadDatabase(['accounts', 'payments'])
      const planRecord = database.membershipPlans.find(
        (plan) => String(plan.plan_name).toLowerCase() === input.plan.toLowerCase() && plan.is_active
      )
      if (!planRecord) {
        return res.status(400).json({
          message: `The ${input.plan} membership plan is not active in Supabase.`
        })
      }
      if (recordPayment && !database.paymentMethods.some(
        (item) => String(item.method_name).toLowerCase() === String(method).toLowerCase()
      )) {
        return res.status(400).json({ message: `The ${method} payment method is not configured in Supabase.` })
      }

      if (
        database.accounts.some(
          (account) => account.email.toLowerCase() === input.email
        )
      ) {
        return res.status(409).json({
          message: 'An account with this email already exists.'
        })
      }

      // Check for an existing Supabase profile.
      const { data: existingProfile, error: lookupError } = await supabase
        .from('users')
        .select('id')
        .eq('email', input.email)
        .maybeSingle()

      if (lookupError) {
        console.error('Supabase email lookup failed:', lookupError.message)
        return res.status(500).json({
          message: 'Unable to check the member account.'
        })
      }

      if (existingProfile) {
        return res.status(409).json({
          message: 'An account with this email already exists.'
        })
      }

      // Generate a unique temporary password; the administrator never handles it.
      const temporaryPassword = crypto.randomBytes(24).toString('base64url')

      // Create the member's Supabase Auth account.
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: input.email,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: { name: input.name }
        })

      if (authError || !authData.user) {
        console.error(
          'Supabase Auth account creation failed:',
          authError?.message
        )

        return res.status(400).json({
          message: 'Unable to create the member login. Check whether the email is already registered.'
        })
      }

      authUserId = authData.user.id

      // Insert the linked profile and its first membership period.
      const memberId = crypto.randomUUID()
      const now = new Date().toISOString()
      const roleId = await getRoleId('member')

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: memberId,
          auth_user_id: authUserId,
          role_id: roleId,
          name: input.name,
          email: input.email,
          phone_number: input.phone || null,
          status: 'active',
          must_change_password: true,
          created_at: now
        })
        .select('id, member_code, name, email, phone_number, status, created_at')
        .single()

      if (profileError || !profile) {
        console.error(
          'Supabase member profile creation failed:',
          profileError?.message
        )

        // Roll back the Auth account if profile creation fails.
        const { error: rollbackError } =
          await supabase.auth.admin.deleteUser(authUserId)

        if (rollbackError) {
          console.error(
            'Supabase Auth rollback failed:',
            rollbackError.message
          )
        }

        authUserId = null

        return res.status(500).json({
          message: 'Unable to create the member profile.'
        })
      }

      profileId = profile.id

      const member = {
        id: profile.id,
        authUserId,
        memberCode: profile.member_code || '',
        name: profile.name,
        email: profile.email,
        phone: profile.phone_number || '',
        role: 'user',
        plan: planRecord.plan_name,
        status: 'active',
        joined: now,
        membershipStart: now,
        membershipEnd: addMembershipDays(now, planRecord.duration_days),
        subscriptionId: crypto.randomUUID(),
        subscriptionCreatedAt: now,
        planId: planRecord.plan_id,
        mustChangePassword: true,
        authVersion: 0
      }

      database.accounts.push(member)

      if (recordPayment) {
        database.payments.push({
          id: crypto.randomUUID(),
          memberId: member.id,
          memberName: member.name,
          amount: Number(planRecord.price),
          method,
          plan: planRecord.plan_name,
          type: 'New',
          date: now,
          subscriptionId: member.subscriptionId,
          processedByUserId: req.user.id
        })
      }

      await saveDatabase(database)

      // Commit the member and membership first. A mail outage must never undo
      // a valid account or send credentials for a membership that failed to save.
      let emailSent = false
      if (mailer) {
        try {
          await mailer.sendMail({
            from: emailConfig.from,
            to: input.email,
            ...welcomeEmail({ name: input.name, email: input.email, temporaryPassword, loginUrl: clientUrl })
          })
          emailSent = true
        } catch (error) {
          console.error('Member welcome email failed:', error.code || 'SMTP_ERROR')
        }
      }

      return res.status(201).json({
        emailSent,
        message: emailSent
          ? 'Member created. Welcome email accepted by the mail server.'
          : 'Member created, but the welcome email was not sent. Use Send sign-in link after checking SMTP.',
        member: {
          ...publicAccount(member),
          memberCode: profile.member_code,
          accountStatus: profile.status,
          createdAt: profile.created_at
        }
      })
    } catch (error) {
      console.error('Unable to create member:', error.message)

      // Attempt cleanup if creation failed after creating the Auth user.
      if (profileId) {
        const { error: profileRollbackError } = await supabase
          .from('users')
          .delete()
          .eq('id', profileId)

        if (profileRollbackError) {
          console.error('Supabase profile rollback failed:', profileRollbackError.message)
        }
      }
      if (authUserId) {
        const { error: rollbackError } =
          await supabase.auth.admin.deleteUser(authUserId)

        if (rollbackError) {
          console.error(
            'Supabase Auth rollback failed:',
            rollbackError.message
          )
        }
      }

      return res.status(500).json({
        message: 'Unable to create the member account.'
      })
    }
  }
)

app.patch(
  '/api/admin/members/:id',
  authenticate,
  requireRole('admin', 'staff'),
  async (req, res) => {
    try {
      const database = await loadDatabase(['accounts'])

      const member = database.accounts.find(
        (account) =>
          account.id === req.params.id &&
          !['admin', 'staff'].includes(account.role)
      )

      if (!member) {
        return res.status(404).json({
          message: 'Member not found.'
        })
      }

      const input = validAccountInput({ ...member, ...req.body })

      if (input.error) {
        return res.status(400).json({ message: input.error })
      }

      if (
        req.body.password !== undefined &&
        req.body.password !== '' &&
        !passwordPolicy(req.body.password)
      ) {
        return res.status(400).json({
          message: `Use at least ${passwordMin} characters, up to ${passwordMax} bytes, for the password.`
        })
      }

      const { data: linkedProfile, error: linkedProfileError } =
        await supabase
          .from('users')
          .select('auth_user_id')
          .eq('id', member.id)
          .maybeSingle()

      if (linkedProfileError || !linkedProfile?.auth_user_id) {
        console.error(
          'Linked Supabase account lookup failed:',
          linkedProfileError?.message
        )

        return res.status(500).json({
          message: 'Unable to find the member login account.'
        })
      }

      // Check duplicate emails in the Supabase-backed account list.
      const duplicateAccount = database.accounts.some(
        (account) =>
          account.id !== member.id &&
          account.email.toLowerCase() === input.email
      )

      if (duplicateAccount) {
        return res.status(409).json({
          message: 'An account with this email already exists.'
        })
      }

      // Check duplicate emails in Supabase profiles.
      const { data: existingProfile, error: lookupError } = await supabase
        .from('users')
        .select('id')
        .eq('email', input.email)
        .neq('id', member.id)
        .maybeSingle()

      if (lookupError) {
        console.error('Supabase email lookup failed:', lookupError.message)

        return res.status(500).json({
          message: 'Unable to check the member email.'
        })
      }

      if (existingProfile) {
        return res.status(409).json({
          message: 'An account with this email already exists.'
        })
      }

      // Prepare Auth updates only for credentials that changed.
      const authUpdates = {}

      if (input.email !== member.email.toLowerCase()) {
        authUpdates.email = input.email
        authUpdates.email_confirm = true
      }

      if (req.body.password) {
        authUpdates.password = req.body.password
      }

      // Synchronize the actual Supabase Auth account.
      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } =
          await supabase.auth.admin.updateUserById(
            linkedProfile.auth_user_id,
            authUpdates
          )

        if (authError) {
          console.error('Supabase Auth update failed:', authError.message)

          return res.status(500).json({
            message: 'Unable to update the member login credentials.'
          })
        }
      }

      // Update the application profile.
      const { data: updatedProfile, error: updateError } = await supabase
        .from('users')
        .update({
          name: input.name,
          email: input.email,
          phone_number: input.phone || null
        })
        .eq('id', member.id)
        .select('id, name, email, phone_number')
        .maybeSingle()

      if (updateError || !updatedProfile) {
        console.error(
          'Supabase member profile update failed:',
          updateError?.message
        )

        return res.status(500).json({
          message: 'Unable to update the member profile. Verify the account before retrying.'
        })
      }

      // Keep the account object in sync before saving subscription fields.
      Object.assign(member, {
        name: updatedProfile.name,
        email: updatedProfile.email,
        phone: updatedProfile.phone_number || '',
        plan: input.plan
      })

      if (req.body.password) {
        member.authVersion = (member.authVersion || 0) + 1
        member.mustChangePassword = false
      }

      await saveDatabase(database)

      return res.json({
        member: publicAccount(member)
      })
    } catch (error) {
      console.error('Unable to update member:', error.message)

      return res.status(500).json({
        message: 'Unable to update member details.'
      })
    }
  }
)

app.post(
  '/api/admin/members/:id/renew',
  authenticate,
  requireRole('admin', 'staff'),
  async (req, res) => withMemberAccountLock(req.params.id, async () => {
    const database = await loadDatabase(['accounts', 'payments'])
    const member = database.accounts.find(
      (account) => account.id === req.params.id && !['admin', 'staff'].includes(account.role)
    )
    if (!member) return res.status(404).json({ message: 'Member not found.' })
    const method = paymentMethod(req.body)
    const planName = typeof req.body.plan === 'string' && req.body.plan.trim()
      ? req.body.plan.trim()
      : member.plan
    const planRecord = database.membershipPlans.find(
      (item) => String(item.plan_name).toLowerCase() === planName.toLowerCase() && item.is_active
    )
    if (!planRecord)
      return res.status(400).json({ message: `The ${planName} membership plan is not active in Supabase.` })
    const amount = req.body.amount === undefined ? Number(planRecord.price) : Number(req.body.amount)
    if (!method || !Number.isFinite(amount) || amount <= 0)
      return res.status(400).json({ message: 'Use Cash or GCash and a positive payment amount.' })
    if (!database.paymentMethods.some(
      (item) => String(item.method_name).toLowerCase() === method.toLowerCase()
    )) return res.status(400).json({ message: `The ${method} payment method is not configured in Supabase.` })
    const plan = planRecord.plan_name
    const now = new Date()
    const base =
      member.membershipEnd && new Date(member.membershipEnd) > now
        ? new Date(member.membershipEnd)
        : now
    member.plan = plan
    member.status = 'active'
    member.membershipStart = base.toISOString()
    member.membershipEnd = addMembershipDays(base, planRecord.duration_days)
    member.subscriptionId = crypto.randomUUID()
    member.subscriptionCreatedAt = now.toISOString()
    member.planId = planRecord.plan_id
    const payment = {
      id: crypto.randomUUID(),
      memberId: member.id,
      memberName: member.name,
      amount,
      method,
      plan,
      type: 'Renewal',
      date: now.toISOString(),
      subscriptionId: member.subscriptionId,
      processedByUserId: req.user.id
    }
    database.payments.push(payment)
    await saveDatabase(database)
    res.json({ member: publicAccount(member), payment })
  })
)

app.get('/api/admin/equipment', authenticate, requireRole('admin', 'staff'), async (req, res) => {
  const database = await loadDatabase(['equipment', 'maintenance'])
  res.json({ equipment: database.equipment, maintenance: database.maintenance })
})
app.post('/api/admin/equipment', authenticate, requireRole('admin', 'staff'), async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
  if (!name) return res.status(400).json({ message: 'Equipment name is required.' })
  if (!EQUIPMENT_CATEGORIES.includes(req.body.category))
    return res.status(400).json({ message: 'Choose a valid equipment category.' })
  const database = await loadDatabase(['equipment', 'maintenance'])
  const equipment = {
    id: crypto.randomUUID(),
    name,
    category: req.body.category,
    condition: 'Good',
    lastInspected: new Date().toISOString()
  }
  database.equipment.push(equipment)
  await saveDatabase(database)
  res.status(201).json({ equipment })
})
app.patch('/api/admin/equipment/:id', authenticate, requireRole('admin', 'staff'), async (req, res) => {
  const database = await loadDatabase(['equipment', 'maintenance'])
  const equipment = database.equipment.find((item) => item.id === req.params.id)
  if (!equipment) return res.status(404).json({ message: 'Equipment not found.' })
  if (req.body.category !== undefined && !EQUIPMENT_CATEGORIES.includes(req.body.category))
    return res.status(400).json({ message: 'Choose a valid equipment category.' })
  if (
    req.body.condition !== undefined &&
    !['Good', 'Needs Maintenance', 'Out of Service'].includes(req.body.condition)
  )
    return res.status(400).json({ message: 'Choose a valid equipment condition.' })
  const note = typeof req.body.maintenanceNote === 'string' ? req.body.maintenanceNote.trim() : ''
  if (req.body.maintenanceNote !== undefined && (!note || note.length > 500))
    return res.status(400).json({ message: 'Use a maintenance note of 1–500 characters.' })
  if (req.body.category !== undefined) equipment.category = req.body.category
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
  await saveDatabase(database)
  res.json({ equipment })
})

app.get('/api/admin/settings', authenticate, requireRole('admin', 'staff'), async (req, res) =>
  res.json({ settings: (await loadDatabase(['settings'])).settings, emailConfigured: smtpConfigured })
)
app.patch('/api/admin/settings', authenticate, requireRole('admin', 'staff'), async (req, res) => {
  const database = await loadDatabase(['settings'])
  if (typeof req.body.gym === 'string' && req.body.gym.trim())
    database.settings.gym = req.body.gym.trim()
  if (Number.isInteger(req.body.remind) && req.body.remind >= 1 && req.body.remind <= 30)
    database.settings.remind = req.body.remind
  if (typeof req.body.emailOn === 'boolean') database.settings.emailOn = req.body.emailOn
  await saveDatabase(database)
  if (database.settings.emailOn) {
    void membershipReminders.runDue().catch(() =>
      console.error('Reminder check failed after settings update. Apply migration 005_admin_notifications.sql.')
    )
  }
  res.json({ settings: database.settings })
})
app.post(
  '/api/admin/members/:id/expiry-email',
  authenticate,
  requireRole('admin', 'staff'),
  rateLimit({ max: 10 }),
  async (req, res) => {
    const database = await loadDatabase(['accounts', 'settings'])
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
    const sent = await membershipReminders.sendReminder(member, database.settings)
    res.json({
      message: sent
        ? `Expiry email sent to ${member.email}.`
        : 'No email sent. This reminder was already sent, is being processed, or is no longer due.'
    })
  }
)


app.patch('/api/profile', authenticate, async (req, res) => {
  try {
    const database = await loadDatabase(['accounts'])
    const account = database.accounts.find(
      (item) => item.id === req.user.id
    )

    if (!account) {
      return res.status(404).json({
        message: 'Account not found.'
      })
    }

    const input = validAccountInput({ ...account, ...req.body })

    if (input.error) {
      return res.status(400).json({
        message: input.error
      })
    }
    if (req.body.password && !passwordPolicy(req.body.password)) {
      return res.status(400).json({
        message: `Use at least ${passwordMin} characters, up to ${passwordMax} bytes, for the password.`
      })
    }

    // Prevent duplicate email addresses in the Supabase-backed account list.
    if (
      database.accounts.some(
        (item) => item.id !== account.id && item.email === input.email
      )
    ) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      })
    }

    // Check that the new email is not used by another Supabase profile.
    const { data: existingProfile, error: lookupError } = await supabase
      .from('users')
      .select('id')
      .eq('email', input.email)
      .neq('id', account.id)
      .maybeSingle()

    if (lookupError) {
      console.error('Supabase email lookup failed:', lookupError.message)
      return res.status(500).json({
        message: 'Unable to update your profile.'
      })
    }

    if (existingProfile) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      })
    }

    const authUpdates = { user_metadata: { name: input.name } }
    if (input.email !== account.email.toLowerCase()) {
      authUpdates.email = input.email
      authUpdates.email_confirm = true
    }
    if (req.body.password) authUpdates.password = req.body.password
    if (input.name !== account.name || input.email !== account.email.toLowerCase() || req.body.password) {
      if (!account.authUserId) {
        return res.status(409).json({ message: 'This profile is not linked to a Supabase login.' })
      }
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
        account.authUserId,
        authUpdates
      )
      if (authUpdateError) {
        console.error('Supabase Auth profile update failed:', authUpdateError.message)
        return res.status(500).json({ message: 'Unable to update your login details.' })
      }
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update({
        name: input.name,
        email: input.email,
        phone_number: input.phone || null
      })
      .eq('id', account.id)
      .select('id, name, email, phone_number')
      .maybeSingle()

    if (updateError) {
      console.error('Supabase profile update failed:', updateError.message)
      return res.status(500).json({
        message: 'Unable to update your profile.'
      })
    }

    if (!updatedProfile) {
      return res.status(404).json({
        message: 'Supabase profile not found.'
      })
    }

    Object.assign(account, {
      name: updatedProfile.name,
      email: updatedProfile.email,
      phone: updatedProfile.phone_number || ''
    })
    if (req.body.password) {
      account.authVersion = (account.authVersion || 0) + 1
      account.mustChangePassword = false
    }

    await saveDatabase(database)

    return res.json({
      user: {
        ...publicAccount(account),
        name: updatedProfile.name,
        email: updatedProfile.email,
        phone: updatedProfile.phone_number || ''
      }
    })
  } catch (error) {
    console.error('Unable to update profile:', error.message)
    return res.status(500).json({
      message: 'Unable to update your profile.'
    })
  }
})


app.post(
  '/api/profile/change-password',
  authenticate,
  rateLimit({ max: 10 }),
  async (req, res) => {
    try {
      const { currentPassword, password, confirmPassword } = req.body || {}

      if (
        typeof currentPassword !== 'string' ||
        !currentPassword ||
        Buffer.byteLength(currentPassword, 'utf8') > 72
      ) {
        return res.status(400).json({
          message: 'Enter your current password (up to 72 bytes).'
        })
      }

      if (!passwordPolicy(password)) {
        return res.status(400).json({
          message: 'Use at least 8 characters, up to 72 bytes, for your new password.'
        })
      }

      if (confirmPassword !== undefined && confirmPassword !== password) {
        return res.status(400).json({
          message: 'The new passwords do not match.'
        })
      }

      if (currentPassword === password) {
        return res.status(400).json({
          message: 'Choose a password different from your current password.'
        })
      }

      const database = await loadDatabase(['accounts'])
      const account = database.accounts.find(
        (item) => item.id === req.user.id
      )

      if (!account) {
        return res.status(404).json({
          message: 'Account not found.'
        })
      }

      // Find the linked Supabase Auth user.
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('auth_user_id, email')
        .eq('id', account.id)
        .maybeSingle()

      if (profileError || !profile?.auth_user_id || !profile.email) {
        console.error(
          'Password change: linked profile lookup failed:',
          profileError?.message || 'Missing linked Auth user or email.'
        )

        return res.status(500).json({
          message: 'Unable to verify your account. Please try again.'
        })
      }

      // Verify the current password against Supabase Auth.
      const authUser = await authenticatePassword({
        createAuthClient: createSupabaseAuthClient,
        email: profile.email,
        password: currentPassword
      })

      if (authUser.id !== profile.auth_user_id) {
        return res.status(400).json({
          message: 'Current password is incorrect.'
        })
      }

      // Change the actual password used by login.
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        profile.auth_user_id,
        { password }
      )

      if (updateError) {
        console.error('Supabase password update failed:', updateError.message)

        return res.status(500).json({
          message: 'Unable to update your password. Please try again.'
        })
      }

      // Invalidate existing FitPulse sessions after changing the Auth password.
      account.authVersion = (account.authVersion || 0) + 1
      await saveDatabase(database)

      // Return a fresh application session after the password change.
      return res.json({
        message: 'Password updated.',
        session: createSession(account)
      })
    } catch (error) {
      if (error instanceof PasswordAuthenticationError) {
        return res.status(error.status === 401 ? 400 : error.status).json({
          message: error.status === 401 ? 'Current password is incorrect.' : error.message,
          code: error.code
        })
      }
      console.error('Password change failed:', error.message)

      return res.status(500).json({
        message: 'Unable to change your password. Please try again.'
      })
    }
  }
)


app.get('/api/attendance', authenticate, async (req, res) => {
  const database = await loadDatabase(['attendance'])
  const isStaff = ['admin', 'staff'].includes(req.user.role)
  const attendance = isStaff
    ? database.attendance
    : database.attendance.filter((item) => item.memberId === req.user.id)
  res.json({ attendance: attendance.map(({ qrTokenId, scannerRequestId, ...record }) => record) })
})

app.post('/api/attendance/check-in', authenticate, (req, res) => {
  res
    .status(403)
    .json({ message: 'Check-in must be recorded by the entrance scanner.' })
})

app.get('/api/payments', authenticate, async (req, res) => {
  const database = await loadDatabase(['payments'])
  const isStaff = ['admin', 'staff'].includes(req.user.role)
  const payments = isStaff
    ? database.payments
    : database.payments.filter((item) => item.memberId === req.user.id)
  res.json({ payments })
})

app.post('/api/admin/attendance', authenticate, requireRole('admin', 'staff'), (req, res) => {
  res.status(403).json({ message: 'Check-in must be recorded by the entrance scanner.' })
})

app.post('/api/admin/payments', authenticate, requireRole('admin', 'staff'), async (req, res) => {
  const memberId = typeof req.body.memberId === 'string' ? req.body.memberId.trim() : ''
  const amount = Number(req.body.amount)
  const method = paymentMethod(req.body)
  if (!method)
    return res.status(400).json({ message: 'Choose Cash or GCash for a recorded payment.' })
  if (!Number.isFinite(amount) || amount <= 0)
    return res.status(400).json({ message: 'A positive payment amount is required.' })
  const database = await loadDatabase(['accounts', 'payments'])
  const member = database.accounts.find((account) => account.id === memberId)
  if (!member) return res.status(400).json({ message: 'Unknown member id.' })
  if (!database.paymentMethods.some(
    (item) => String(item.method_name).toLowerCase() === method.toLowerCase()
  )) return res.status(400).json({ message: `The ${method} payment method is not configured in Supabase.` })
  if (!member.subscriptionId)
    return res.status(409).json({ message: 'This member has no subscription. Renew the membership before recording a payment.' })
  const payment = {
    id: crypto.randomUUID(),
    memberId,
    memberName: member.name,
    amount,
    method,
    type: 'Membership',
    plan: member.plan,
    date: new Date().toISOString(),
    subscriptionId: member.subscriptionId,
    processedByUserId: req.user.id
  }
  database.payments.push(payment)
  await saveDatabase(database)
  res.status(201).json({ payment })
})

// ---------------------------------------------------------------- seed & start

async function findAuthUser(email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(`Unable to look up ${email} in Supabase Auth: ${error.message}`)
    const found = data.users.find((user) => user.email?.toLowerCase() === email)
    if (found || data.users.length < 1000) return found || null
  }
}

async function ensureSeedAccount({ email, name, password, role, plan, membershipDays = 0 }) {
  const database = await loadDatabase(['accounts'])
  let account = database.accounts.find((item) => item.email.toLowerCase() === email)
  let authUser = account?.authUserId ? { id: account.authUserId } : await findAuthUser(email)

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    })
    if (error || !data.user)
      throw new Error(`Unable to provision ${email} in Supabase Auth: ${error?.message || 'no user returned'}`)
    authUser = data.user
  }

  const now = new Date().toISOString()
  if (!account) {
    account = {
      id: crypto.randomUUID(),
      authUserId: authUser.id,
      memberCode: '',
      name,
      email,
      phone: '',
      role: role === 'member' ? 'user' : role,
      plan,
      status: 'active',
      joined: now,
      membershipStart: null,
      membershipEnd: null,
      subscriptionId: null,
      mustChangePassword: false,
      authVersion: 0,
      avatarId: ''
    }
    database.accounts.push(account)
  } else {
    account.authUserId = authUser.id
    account.role = role === 'member' ? 'user' : role
    account.name ||= name
    account.status ||= 'active'
  }

  if (membershipDays && (!account.membershipStart || !account.membershipEnd)) {
    const planRecord = database.membershipPlans.find(
      (item) => String(item.plan_name).toLowerCase() === plan.toLowerCase() && item.is_active
    )
    if (!planRecord) throw new Error(`The ${plan} membership plan is not active in Supabase.`)
    account.plan = planRecord.plan_name
    account.planId = planRecord.plan_id
    account.membershipStart = now
    account.membershipEnd = addMembershipDays(now, planRecord.duration_days)
    account.subscriptionId ||= crypto.randomUUID()
    account.subscriptionCreatedAt = now
  }

  await saveDatabase(database)
  return account.id
}

async function ensureSeedData() {
  const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? '' : 'admin123')
  const existingDatabase = await loadDatabase(['accounts'])
  const existingAdmin = existingDatabase.accounts.find((account) => account.email === 'admin@fitpulse.com')
  const existingAdminAuth = existingAdmin?.authUserId || await findAuthUser('admin@fitpulse.com')
  if (isProduction && !adminPassword && !existingAdminAuth)
    throw new Error('ADMIN_PASSWORD is required to create the first administrator in production.')

  await ensureSeedAccount({
    email: 'admin@fitpulse.com',
    name: 'FitPulse Staff',
    password: adminPassword,
    role: 'admin',
    plan: 'Staff access'
  })
  let demoMemberId = null

  // Demo accounts and sample activity only run outside production.
  if (!isProduction) {
    demoMemberId = await ensureSeedAccount({
      email: 'member@fitpulse.com',
      name: 'Mia Cruz',
      password: 'member123',
      role: 'member',
      plan: 'Unlimited Monthly',
      membershipDays: 30
    })

    const database = await loadDatabase(['accounts', 'attendance', 'payments'])
    const demoMember = database.accounts.find((account) => account.id === demoMemberId)
    if (database.attendance.length === 0) {
      const day = 86_400_000
      const now = Date.now()
      for (const offset of [0, 2 * day, 4 * day, 7 * day]) {
        database.attendance.push({
          id: crypto.randomUUID(),
          memberId: demoMember.id,
          memberName: demoMember.name,
          date: new Date(now - offset).toISOString(),
          source: 'Demo'
        })
      }
    }
    if (database.payments.length === 0) {
      database.payments.push(
        {
          id: crypto.randomUUID(), memberId: demoMember.id, memberName: demoMember.name,
          amount: 1500, method: 'GCash', plan: demoMember.plan, type: 'New',
          date: new Date(Date.now() - 32 * 86_400_000).toISOString(),
          subscriptionId: demoMember.subscriptionId,
          processedByUserId: demoMember.id
        },
        {
          id: crypto.randomUUID(), memberId: demoMember.id, memberName: demoMember.name,
          amount: 1500, method: 'Cash', plan: demoMember.plan, type: 'Renewal',
          date: new Date().toISOString(),
          subscriptionId: demoMember.subscriptionId,
          processedByUserId: demoMember.id
        }
      )
    }
    await saveDatabase(database)
  }
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

export const serverReady = ensureSeedData()
  .then(() => {
    const server = app.listen(port, () => console.log(`FitPulse API listening on ${port}`))
    const stopReminders = startMembershipReminders({ runDue: membershipReminders.runDue })
    server.once('close', stopReminders)
    if (!smtpConfigured) console.warn('Automatic membership reminders are paused: configure SMTP to enable delivery.')
    return server
  })
  .catch((error) => {
    console.error('Failed to start FitPulse API:', error.message)
    process.exit(1)
  })
