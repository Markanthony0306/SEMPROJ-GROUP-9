// Smoke test for the FitPulse API. Imports the real server in-process with a
// temporary database, exercises the main flows, and exits non-zero on failure.
// Run with: npm run test:server
import { appendFileSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const port = 3999
process.env.PORT = String(port)
process.env.NODE_ENV = 'development'
process.env.JWT_SECRET = 'smoke-test-secret'

const tempDirectory = join(process.env.TEMP || '/tmp', `fitpulse-smoke-${randomUUID()}`)
await mkdir(tempDirectory, { recursive: true })
const dataFile = join(tempDirectory, 'data.json')
await writeFile(dataFile, JSON.stringify({ accounts: [], attendance: [], payments: [] }))
process.env.DATA_FILE = dataFile

const base = `http://localhost:${port}/api`
const results = []
const resultsFile = join(process.cwd(), 'smoke-results.txt')
appendFileSync(resultsFile, '') // clear previous run output

function logLine(line) {
  console.log(line)
  try {
    appendFileSync(resultsFile, `${line}\n`)
  } catch {
    // Best-effort persistence; failures must not mask the exit code.
  }
}

function check(name, condition) {
  const ok = Boolean(condition)
  results.push(ok)
  logLine(`${ok ? 'PASS' : 'FAIL'} - ${name}`)
}

async function request(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  let payload = {}
  try {
    payload = await response.json()
  } catch {
    // No JSON body is fine for this test.
  }
  return { status: response.status, payload }
}

try {
  // Start the API inside this process (it listens on PORT after seeding).
  await import('./../server/server.js')

  let ready = false
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const probe = await fetch(`${base}/me`)
      if (probe.status === 401) {
        ready = true
        break
      }
    } catch {
      // Not listening yet.
    }
    await sleep(150)
  }
  if (!ready) throw new Error('Server did not start within 12 seconds.')

  check(
    'register creates an account',
    (
      await request('POST', '/auth/register', {
        body: { name: 'Test User', email: 'test@example.com', password: 'password123' }
      })
    ).status === 201
  )

  check(
    'duplicate registration is rejected',
    (
      await request('POST', '/auth/register', {
        body: { name: 'Test User', email: 'test@example.com', password: 'password123' }
      })
    ).status === 409
  )

  check(
    'register rejects short passwords',
    (
      await request('POST', '/auth/register', {
        body: { name: 'Too Short', email: 'x@example.com', password: 'short' }
      })
    ).status === 400
  )

  check(
    'register rejects invalid emails',
    (
      await request('POST', '/auth/register', {
        body: { name: 'Bad Email', email: 'not-an-email', password: 'password123' }
      })
    ).status === 400
  )

  const adminLogin = await request('POST', '/auth/login', {
    body: { email: 'admin@fitpulse.com', password: 'admin123' }
  })
  check('admin can log in', adminLogin.status === 200 && Boolean(adminLogin.payload.token))
  const adminToken = adminLogin.payload.token

  const memberLogin = await request('POST', '/auth/login', {
    body: { email: 'member@fitpulse.com', password: 'member123' }
  })
  check('demo member can log in', memberLogin.status === 200 && Boolean(memberLogin.payload.token))
  const memberToken = memberLogin.payload.token

  const memberMe = await request('GET', '/me', { token: memberToken })
  const memberId = memberMe.payload.user?.id
  check(
    'me returns the signed-in user',
    memberMe.status === 200 && memberMe.payload.user?.email === 'member@fitpulse.com'
  )

  check('me requires a token', (await request('GET', '/me')).status === 401)

  check(
    'members endpoint is staff-only',
    (await request('GET', '/members', { token: memberToken })).status === 403
  )

  const staffMembers = await request('GET', '/members', { token: adminToken })
  const membersPayload = JSON.stringify(staffMembers.payload)
  check(
    'staff can list members without password hashes',
    staffMembers.status === 200 &&
      staffMembers.payload.members.length >= 3 &&
      !membersPayload.includes('passwordHash')
  )

  const memberAttendance = await request('GET', '/attendance', { token: memberToken })
  check(
    'member sees only their attendance',
    memberAttendance.status === 200 &&
      memberAttendance.payload.attendance.length >= 4 &&
      memberAttendance.payload.attendance.every((item) => item.memberId === memberId)
  )

  const memberPayments = await request('GET', '/payments', { token: memberToken })
  check(
    'member sees only their payments',
    memberPayments.status === 200 &&
      memberPayments.payload.payments.every((item) => item.memberId === memberId)
  )

  const addAttendance = await request('POST', '/admin/attendance', {
    token: adminToken,
    body: { memberId }
  })
  check(
    'staff can record attendance',
    addAttendance.status === 201 && addAttendance.payload.attendance?.memberId === memberId
  )

  const addPayment = await request('POST', '/admin/payments', {
    token: adminToken,
    body: { memberId, amount: 1200, method: 'Cash' }
  })
  check(
    'staff can record a payment',
    addPayment.status === 201 && addPayment.payload.payment?.amount === 1200
  )

  check(
    'payments reject negative amounts',
    (
      await request('POST', '/admin/payments', {
        token: adminToken,
        body: { memberId, amount: -5, method: 'Cash' }
      })
    ).status === 400
  )

  let lastForgot
  for (let index = 0; index < 6; index += 1) {
    lastForgot = await request('POST', '/auth/forgot-password', {
      body: { email: 'nobody@example.com' }
    })
  }
  check('forgot-password is rate limited', lastForgot.status === 429)

  check(
    'reset-password rejects unknown tokens',
    (
      await request('POST', '/auth/reset-password', {
        body: { token: 'deadbeef', password: 'brand-new-password' }
      })
    ).status === 400
  )
} catch (error) {
  logLine(`FATAL - ${error.message}`)
  results.push(false)
} finally {
  await rm(tempDirectory, { recursive: true, force: true })
}

const failed = results.filter((ok) => !ok).length
logLine(`${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
