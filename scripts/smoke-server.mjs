// Smoke test for the FitPulse API. Imports the real server in-process with a
// temporary database, exercises the main flows, and exits non-zero on failure.
// Run with: npm run test:server
import { appendFileSync } from 'node:fs'
import { mkdir, rm, readFile, writeFile } from 'node:fs/promises'
import { createHmac, randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import jwt from 'jsonwebtoken'
import express from 'express'
import { demoAccountRoutes } from '../server/routes/demo-accounts.js'
import { paymentsCsv } from '../src/utils/paymentExport.js'
import { membershipState, reminderMembers, inspectionDue } from '../src/utils/membership.js'
import { buildReport } from '../src/utils/reports.js'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const port = 3999
process.env.PORT = String(port)
process.env.NODE_ENV = 'development'
process.env.JWT_SECRET = 'smoke-test-secret'
process.env.SCANNER_API_KEY = 'smoke-test-device-key-not-for-production-123456'
process.env.SCANNER_DEVICE_ID = 'smoke-esp32-cam'
// Never send emails using credentials from the developer's .env during tests.
process.env.SMTP_HOST = ''
process.env.ADMIN_PASSWORD = 'admin123'

const tempDirectory = join(process.env.TEMP || '/tmp', `fitpulse-smoke-${randomUUID()}`)
await mkdir(tempDirectory, { recursive: true })
const dataFile = join(tempDirectory, 'data.json')
await writeFile(dataFile, JSON.stringify({ accounts: [], attendance: [], payments: [] }))
process.env.DATA_FILE = dataFile
process.env.AVATAR_DIR = join(tempDirectory, 'avatars')

// Use a fixed address so localhost's IPv4/IPv6 resolution cannot split IP limits.
const base = `http://127.0.0.1:${port}/api`
const results = []
const resultsFile = join(process.cwd(), 'smoke-results.txt')
appendFileSync(resultsFile, '') // Keep previous verification results.

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

async function request(method, path, { token, body, deviceKey } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (deviceKey) headers['X-Scanner-Key'] = deviceKey
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

  const beforeDemoLookup = await readFile(dataFile, 'utf8')
  const demoAccounts = await request('GET', '/auth/demo-accounts')
  check(
    'development demo shortcuts verify their default passwords',
    demoAccounts.status === 200 &&
      demoAccounts.payload.accounts.length === 2 &&
      demoAccounts.payload.accounts.every((account) => account.defaultPasswordAvailable === true)
  )
  check(
    'demo lookup never returns saved passwords, hashes, or reset tokens',
    demoAccounts.payload.accounts.every(
      (account) => Object.keys(account).sort().join(',') === 'defaultPasswordAvailable,email,label'
    ) && (await readFile(dataFile, 'utf8')) === beforeDemoLookup
  )
  const productionApp = express()
  productionApp.use(
    '/api',
    demoAccountRoutes({
      isProduction: true,
      loadDatabase: () => {
        throw new Error('Production demo lookup must not read accounts.')
      },
      rateLimit: () => {
        throw new Error('Production demo routes must not be registered.')
      }
    })
  )
  const productionServer = await new Promise((resolve) => {
    const listener = productionApp.listen(0, '127.0.0.1', () => resolve(listener))
  })
  try {
    const response = await fetch(
      `http://127.0.0.1:${productionServer.address().port}/api/auth/demo-accounts`
    )
    check('demo account information is unavailable in production', response.status === 404)
  } finally {
    await new Promise((resolve, reject) =>
      productionServer.close((error) => (error ? reject(error) : resolve()))
    )
  }

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

  const createMember = await request('POST', '/admin/members', {
    token: adminToken,
    body: {
      name: 'Managed Member',
      email: 'managed@example.com',
      password: 'managed-password',
      phone: '09171234567',
      plan: 'Monthly',
      method: 'Cash'
    }
  })
  const managedMember = createMember.payload.member
  check(
    'staff can create a member account with a membership',
    createMember.status === 201 && Boolean(managedMember?.membershipEnd)
  )

  const managedLogin = await request('POST', '/auth/login', {
    body: { email: 'managed@example.com', password: 'managed-password' }
  })
  check(
    'member login includes stored membership dates without password hashes',
    managedLogin.status === 200 &&
      managedLogin.payload.user?.membershipStart === managedMember.membershipStart &&
      managedLogin.payload.user?.membershipEnd === managedMember.membershipEnd &&
      !JSON.stringify(managedLogin.payload).includes('passwordHash')
  )

  check(
    'staff can edit a member account',
    (
      await request('PATCH', `/admin/members/${managedMember.id}`, {
        token: adminToken,
        body: {
          name: 'Updated Member',
          email: 'managed@example.com',
          phone: '09999999999',
          plan: 'Annual'
        }
      })
    ).status === 200
  )

  check(
    'staff can renew a membership',
    (
      await request('POST', `/admin/members/${managedMember.id}/renew`, {
        token: adminToken,
        body: { plan: 'Annual', method: 'GCash' }
      })
    ).status === 200
  )

  const createEquipment = await request('POST', '/admin/equipment', {
    token: adminToken,
    body: { name: 'Smoke Treadmill', category: 'Treadmill' }
  })
  check('staff can add equipment', createEquipment.status === 201)
  check(
    'staff can inspect equipment and change its condition',
    (
      await request('PATCH', `/admin/equipment/${createEquipment.payload.equipment.id}`, {
        token: adminToken,
        body: { condition: 'Needs Maintenance', inspected: true }
      })
    ).status === 200
  )

  check(
    'staff can save gym settings',
    (
      await request('PATCH', '/admin/settings', {
        token: adminToken,
        body: { gym: 'Smoke Gym', remind: 5, emailOn: false }
      })
    ).status === 200
  )

  const memberAttendance = await request('GET', '/attendance', { token: memberToken })
  check(
    'member sees only their attendance',
    memberAttendance.status === 200 &&
      memberAttendance.payload.attendance.length >= 4 &&
      memberAttendance.payload.attendance.every((item) => item.memberId === memberId)
  )

  check(
    'members cannot bypass the physical scanner with a web self-check-in',
    (await request('POST', '/attendance/check-in', { token: memberToken })).status === 403
  )

  const memberPayments = await request('GET', '/payments', { token: memberToken })
  check(
    'member sees only their payments',
    memberPayments.status === 200 &&
      memberPayments.payload.payments.every((item) => item.memberId === memberId)
  )

  const managedToken = managedLogin.payload.token
  const scanBody = (qrToken, requestId = randomUUID()) => ({
    qrToken,
    requestId,
    deviceId: process.env.SCANNER_DEVICE_ID
  })
  const scan = (body, deviceKey = process.env.SCANNER_API_KEY) =>
    request('POST', '/scanner/check-in', { body, deviceKey })
  const generatedQr = await request('GET', '/me/qr', { token: managedToken })
  check(
    'active member receives a real temporary QR image',
    generatedQr.status === 200 &&
      generatedQr.payload.image?.startsWith('data:image/png;base64,') &&
      generatedQr.payload.expiresAt > Date.now()
  )
  check('QR generation requires login', (await request('GET', '/me/qr')).status === 401)
  check(
    'staff cannot generate a member entrance QR',
    (await request('GET', '/me/qr', { token: adminToken })).status === 403
  )
  check(
    'members missing expiry dates cannot generate entrance QR',
    (await request('GET', '/me/qr', { token: memberToken })).payload.code ===
      'MEMBERSHIP_DATES_MISSING'
  )
  const payload = scanBody(generatedQr.payload.qrToken)
  check(
    'scanner rejects a wrong device credential',
    (await scan(payload, 'wrong-key')).status === 401
  )
  check(
    'scanner rejects a missing device credential',
    (await request('POST', '/scanner/check-in', { body: payload })).status === 401
  )
  check(
    'scanner rejects a different device ID',
    (await scan({ ...payload, deviceId: 'unknown-camera' })).status === 400
  )
  check(
    'scanner rejects invalid request IDs',
    (await scan({ ...payload, requestId: '../../bad' })).status === 400
  )
  check(
    'web session tokens cannot be used as entrance QR codes',
    (await scan(scanBody(managedToken))).status === 403
  )
  const parts = generatedQr.payload.qrToken.split('.')
  parts[2] = (parts[2][0] === 'A' ? 'B' : 'A') + parts[2].slice(1)
  check(
    'scanner rejects a tampered QR signature',
    (await scan(scanBody(parts.join('.')))).status === 403
  )
  const qrSecret = createHmac('sha256', process.env.JWT_SECRET)
    .update('fitpulse-qr-v1')
    .digest('hex')
  const expiredQr = jwt.sign({}, qrSecret, {
    subject: managedMember.id,
    jwtid: randomUUID(),
    audience: 'fitpulse-scanner',
    expiresIn: -1
  })
  check(
    'scanner rejects expired QR tokens',
    (await scan(scanBody(expiredQr))).payload.code === 'QR_INVALID_OR_EXPIRED'
  )
  const allowed = await scan(payload)
  check(
    'ESP32-CAM verifies active membership and records attendance',
    allowed.status === 201 && allowed.payload.allowed === true
  )
  const retry = await scan(payload)
  check(
    'retries return the same attendance ID without duplicates',
    retry.status === 200 && retry.payload.attendanceId === allowed.payload.attendanceId
  )
  check(
    'QR replay under another request ID is denied',
    (await scan(scanBody(payload.qrToken))).payload.code === 'QR_ALREADY_USED'
  )
  const freshQr = await request('GET', '/me/qr', { token: managedToken })
  check(
    'recent check-ins cannot be duplicated with a fresh QR',
    (await scan(scanBody(freshQr.payload.qrToken))).payload.code === 'CHECK_IN_COOLDOWN'
  )
  check(
    'request IDs cannot be reused for a different QR',
    (await scan({ ...payload, qrToken: freshQr.payload.qrToken })).payload.code ===
      'REQUEST_CONFLICT'
  )
  const scannedAttendance = await request('GET', '/attendance', { token: managedToken })
  check(
    'scans appear only in the member records and hide QR metadata',
    scannedAttendance.payload.attendance.length === 1 &&
      scannedAttendance.payload.attendance[0].source === 'ESP32-CAM' &&
      !JSON.stringify(scannedAttendance.payload).includes('qrTokenId')
  )
  const fixture = JSON.parse(await readFile(dataFile, 'utf8'))
  const storedMember = fixture.accounts.find((item) => item.id === managedMember.id)
  const originalExpiry = storedMember.membershipEnd
  storedMember.membershipEnd = new Date(Date.now() - 1000).toISOString()
  await writeFile(dataFile, JSON.stringify(fixture))
  check(
    'membership expiry is rechecked after QR generation',
    (await scan(scanBody(freshQr.payload.qrToken))).payload.code === 'MEMBERSHIP_EXPIRED'
  )
  check(
    'staff manual check-in also rejects expired memberships',
    (
      await request('POST', '/admin/attendance', {
        token: adminToken,
        body: { memberId: managedMember.id }
      })
    ).status === 403
  )
  storedMember.membershipEnd = originalExpiry
  storedMember.status = 'suspended'
  await writeFile(dataFile, JSON.stringify(fixture))
  check(
    'suspended members cannot use an already issued QR',
    (await scan(scanBody(freshQr.payload.qrToken))).payload.code === 'MEMBERSHIP_INACTIVE'
  )
  storedMember.status = 'active'
  storedMember.membershipStart = new Date(Date.now() + 86400000).toISOString()
  await writeFile(dataFile, JSON.stringify(fixture))
  check(
    'memberships that have not started cannot check in',
    (await scan(scanBody(freshQr.payload.qrToken))).payload.code === 'MEMBERSHIP_NOT_STARTED'
  )
  storedMember.membershipStart = managedMember.membershipStart
  await writeFile(dataFile, JSON.stringify(fixture))
  check(
    'entrance QR tokens cannot authenticate a web session',
    (await request('GET', '/me', { token: freshQr.payload.qrToken })).status === 401
  )

  const photo = await readFile(new URL('./fixtures/avatar.jpg', import.meta.url))
  const upload = await fetch(`${base}/profile/avatar`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${managedToken}`, 'Content-Type': 'image/jpeg' },
    body: photo
  })
  const uploaded = await upload.json()
  check(
    'signed-in members can upload a validated profile photo',
    upload.status === 200 && Boolean(uploaded.avatarId)
  )
  const imageResponse = await fetch(`${base}/profile/avatar`, {
    headers: { Authorization: `Bearer ${managedToken}` }
  })
  check(
    'profile photos are retrievable only with authorization',
    imageResponse.status === 200 &&
      imageResponse.headers.get('content-type')?.startsWith('image/jpeg') &&
      (await fetch(`${base}/profile/avatar`)).status === 401
  )
  check(
    'another member cannot retrieve the uploaded photo',
    (await fetch(`${base}/profile/avatar`, { headers: { Authorization: `Bearer ${memberToken}` } }))
      .status === 404
  )
  check(
    'staff can retrieve member photos for entrance verification',
    (
      await fetch(`${base}/members/${managedMember.id}/avatar`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      })
    ).status === 200
  )
  check(
    'members cannot access other members through staff photo routes',
    (
      await fetch(`${base}/members/${managedMember.id}/avatar`, {
        headers: { Authorization: `Bearer ${memberToken}` }
      })
    ).status === 403
  )
  const badImage = await fetch(`${base}/profile/avatar`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${managedToken}`, 'Content-Type': 'image/jpeg' },
    body: '<svg onload="alert(1)"></svg>'
  })
  check('profile uploads reject disguised SVG content', badImage.status === 400)
  const tooLarge = await fetch(`${base}/profile/avatar`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${managedToken}`, 'Content-Type': 'image/jpeg' },
    body: Buffer.alloc(270000)
  })
  check('profile uploads enforce server-side size limits', tooLarge.status === 413)
  const replacement = await fetch(`${base}/profile/avatar`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${managedToken}`, 'Content-Type': 'image/jpeg' },
    body: photo
  })
  const replacementPayload = await replacement.json()
  check(
    'replacing photos updates the stored account',
    replacement.status === 200 &&
      replacementPayload.avatarId !== uploaded.avatarId &&
      (await request('GET', '/me', { token: managedToken })).payload.user.avatarId ===
        replacementPayload.avatarId
  )
  const csv = paymentsCsv(
    [
      {
        id: 'payment-1',
        memberName: '=HYPERLINK("bad")',
        memberId: 'member-1',
        plan: 'Monthly, "Plus"',
        amount: 1500,
        method: 'GCash',
        date: '2026-10-13T00:00:00Z'
      }
    ],
    { includeMember: true }
  )
  check(
    'payment CSV escapes formulas, commas, and quotes',
    csv.includes('"\'=HYPERLINK(""bad"")"') &&
      csv.includes('"Monthly, ""Plus"""') &&
      csv.includes('"1500.00"') &&
      csv.startsWith('\uFEFF')
  )

  const addAttendance = await request('POST', '/admin/attendance', {
    token: adminToken,
    body: { memberId: managedMember.id }
  })
  check(
    'staff can record attendance',
    addAttendance.status === 201 && addAttendance.payload.attendance?.memberId === managedMember.id
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

  const beforeInvalidRenewal = await readFile(dataFile, 'utf8')
  check(
    'invalid renewal amounts and methods do not change membership records',
    (
      await request('POST', `/admin/members/${managedMember.id}/renew`, {
        token: adminToken,
        body: { plan: 'Monthly', amount: -10, method: 'Cash' }
      })
    ).status === 400 &&
      (
        await request('POST', `/admin/members/${managedMember.id}/renew`, {
          token: adminToken,
          body: { plan: 'Monthly', method: 'Card' }
        })
      ).status === 400 &&
      (await readFile(dataFile, 'utf8')) === beforeInvalidRenewal
  )
  check(
    'payment records accept only Cash or GCash',
    (
      await request('POST', '/admin/payments', {
        token: adminToken,
        body: { memberId, amount: 800, method: 'Card' }
      })
    ).status === 400 &&
      (
        await request('POST', '/admin/payments', {
          token: adminToken,
          body: { memberId, amount: 800, method: ' gcash ' }
        })
      ).payload.payment?.method === 'GCash'
  )
  check(
    'member registration rejects unsupported payment methods before saving',
    (
      await request('POST', '/admin/members', {
        token: adminToken,
        body: {
          name: 'Invalid Payment',
          email: 'bad-method@example.com',
          password: 'valid-password',
          method: 'Card'
        }
      })
    ).status === 400 &&
      !(await request('GET', '/members', { token: adminToken })).payload.members.some(
        (member) => member.email === 'bad-method@example.com'
      )
  )
  const equipmentId = createEquipment.payload.equipment.id
  const repair = await request('PATCH', `/admin/equipment/${equipmentId}`, {
    token: adminToken,
    body: { condition: 'Good', maintenanceNote: 'Replaced the treadmill belt.' }
  })
  const repairedEquipment = await request('GET', '/admin/equipment', { token: adminToken })
  check(
    'repair notes and equipment conditions are stored together',
    repair.status === 200 &&
      repair.payload.equipment.condition === 'Good' &&
      repairedEquipment.payload.maintenance.some(
        (item) => item.equipmentId === equipmentId && item.note === 'Replaced the treadmill belt.'
      )
  )
  check(
    'equipment rejects invalid conditions and oversized repair notes',
    (
      await request('PATCH', `/admin/equipment/${equipmentId}`, {
        token: adminToken,
        body: { condition: 'Broken' }
      })
    ).status === 400 &&
      (
        await request('PATCH', `/admin/equipment/${equipmentId}`, {
          token: adminToken,
          body: { maintenanceNote: 'x'.repeat(501) }
        })
      ).status === 400
  )
  check(
    'members cannot modify equipment records',
    (
      await request('PATCH', `/admin/equipment/${equipmentId}`, {
        token: memberToken,
        body: { condition: 'Out of Service' }
      })
    ).status === 403
  )
  check(
    'disabled email reminders cannot send email',
    (
      await request('POST', `/admin/members/${managedMember.id}/expiry-email`, {
        token: adminToken
      })
    ).status === 409 &&
      (await request('GET', '/admin/settings', { token: adminToken })).payload.emailConfigured ===
        false
  )

  const unpaidMember = await request('POST', '/admin/members', {
    token: adminToken,
    body: {
      name: 'No Payment Recorded',
      email: 'unpaid@example.com',
      password: 'valid-password',
      recordPayment: false
    }
  })
  check(
    'staff can create a member without inventing a payment record',
    unpaidMember.status === 201 &&
      !(await request('GET', '/payments', { token: adminToken })).payload.payments.some(
        (payment) => payment.memberId === unpaidMember.payload.member.id
      )
  )

  const reportNow = Date.parse('2026-10-13T00:00:00Z')
  const reportMembers = [
    {
      id: 'active',
      name: 'Active Member',
      role: 'user',
      plan: 'Monthly',
      status: 'active',
      membershipStart: '2026-10-01T00:00:00Z',
      membershipEnd: '2026-10-17T00:00:00Z'
    },
    {
      id: 'expired',
      name: 'Expired Member',
      role: 'user',
      plan: 'Monthly',
      status: 'active',
      membershipStart: '2026-09-01T00:00:00Z',
      membershipEnd: '2026-10-12T00:00:00Z'
    },
    { id: 'incomplete', name: 'Incomplete Member', role: 'user', status: 'active' },
    {
      id: 'upcoming',
      role: 'user',
      status: 'active',
      membershipStart: '2026-11-01T00:00:00Z',
      membershipEnd: '2026-12-01T00:00:00Z'
    },
    {
      id: 'suspended',
      role: 'user',
      status: 'suspended',
      membershipStart: '2026-10-01T00:00:00Z',
      membershipEnd: '2026-11-01T00:00:00Z'
    }
  ]
  check(
    'membership labels distinguish expired, missing dates, upcoming, and suspended',
    reportMembers.map((member) => membershipState(member, reportNow).status).join(',') ===
      'active,expired,incomplete,upcoming,suspended'
  )
  check(
    'reminders include only near-expiry and expired memberships',
    reminderMembers(reportMembers, 5, reportNow)
      .map((member) => member.id)
      .join(',') === 'expired,active' && reminderMembers(reportMembers, 3, reportNow).length === 1
  )
  check(
    'inspection reminders use the 30-day threshold and include missing dates',
    inspectionDue({ lastInspected: '2026-09-13T00:00:00Z' }, reportNow) &&
      !inspectionDue({ lastInspected: '2026-09-14T00:00:00Z' }, reportNow) &&
      inspectionDue({}, reportNow)
  )
  const reportData = {
    members: reportMembers,
    attendance: [],
    equipment: [],
    payments: [
      {
        memberName: 'Active Member',
        plan: 'Monthly',
        type: 'New',
        amount: 800,
        method: 'Cash',
        date: '2026-10-01T00:00:00Z'
      },
      {
        memberName: 'Active Member',
        plan: 'Monthly',
        type: 'Renewal',
        amount: 800,
        method: 'GCash',
        date: '2026-10-13T00:00:00Z'
      }
    ]
  }
  check(
    'active and expired reports exclude incomplete and inactive memberships',
    buildReport('active', reportData, reportNow).rows.length === 1 &&
      buildReport('active', reportData, reportNow).rows[0][1] === 'active' &&
      buildReport('expired', reportData, reportNow).rows[0][1] === 'expired'
  )
  check(
    'renewal reports include only recorded renewal transactions',
    buildReport('renewals', reportData, reportNow).rows.length === 1 &&
      buildReport('renewals', reportData, reportNow).rows[0][2] === 'Renewal'
  )

  const nextAdminPassword = 'new-admin-pass-2026'
  const changePassword = (token, body) =>
    request('POST', '/profile/change-password', { token, body })
  check(
    'changing passwords requires the correct current password',
    (
      await changePassword(adminToken, {
        currentPassword: 'wrong-password',
        password: nextAdminPassword
      })
    ).status === 400
  )
  check(
    'changing passwords rejects mismatched confirmation',
    (
      await changePassword(adminToken, {
        currentPassword: 'admin123',
        password: nextAdminPassword,
        confirmPassword: 'different-password'
      })
    ).status === 400
  )
  check(
    'changing passwords rejects short and truncated multibyte passwords',
    (await changePassword(adminToken, { currentPassword: 'admin123', password: 'short' }))
      .status === 400 &&
      (await changePassword(adminToken, { currentPassword: 'admin123', password: '界'.repeat(25) }))
        .status === 400
  )
  check(
    'changing passwords rejects the unchanged password',
    (await changePassword(adminToken, { currentPassword: 'admin123', password: 'admin123' }))
      .status === 400
  )
  const changedAdmin = await changePassword(adminToken, {
    currentPassword: 'admin123',
    password: nextAdminPassword,
    confirmPassword: nextAdminPassword
  })
  const updatedDemoAccounts = await request('GET', '/auth/demo-accounts')
  check(
    'changed admin passwords stop offering the invalid default without affecting member demos',
    updatedDemoAccounts.payload.accounts.find((account) => account.email === 'admin@fitpulse.com')
      ?.defaultPasswordAvailable === false &&
      updatedDemoAccounts.payload.accounts.find(
        (account) => account.email === 'member@fitpulse.com'
      )?.defaultPasswordAvailable === true
  )
  check(
    'admin password updates return a fresh authenticated session',
    changedAdmin.status === 200 &&
      changedAdmin.payload.session?.role === 'admin' &&
      (await request('GET', '/me', { token: changedAdmin.payload.session?.token })).status === 200
  )
  check(
    'admin login accepts the new password and rejects the old password',
    (
      await request('POST', '/auth/login', {
        body: { email: 'admin@fitpulse.com', password: nextAdminPassword }
      })
    ).status === 200 &&
      (
        await request('POST', '/auth/login', {
          body: { email: 'admin@fitpulse.com', password: 'admin123' }
        })
      ).status === 401
  )
  check(
    'changing an admin password invalidates older admin sessions only',
    (await request('GET', '/me', { token: adminToken })).status === 401 &&
      (await request('GET', '/me', { token: memberToken })).status === 200
  )
  const nextMemberPassword = 'new-member-pass-2026'
  const changedMember = await changePassword(managedToken, {
    currentPassword: 'managed-password',
    password: nextMemberPassword,
    confirmPassword: nextMemberPassword
  })
  check(
    'member password updates preserve the member role and refresh the session',
    changedMember.status === 200 &&
      changedMember.payload.session?.role === 'user' &&
      (await request('GET', '/me', { token: changedMember.payload.session?.token })).status ===
        200 &&
      (await request('GET', '/me', { token: managedToken })).status === 401
  )
  check(
    'member login accepts the new password and rejects the old password',
    (
      await request('POST', '/auth/login', {
        body: { email: 'managed@example.com', password: nextMemberPassword }
      })
    ).status === 200 &&
      (
        await request('POST', '/auth/login', {
          body: { email: 'managed@example.com', password: 'managed-password' }
        })
      ).status === 401
  )

  const beforeAdminReset = await readFile(dataFile, 'utf8')
  const recoveredPassword = 'smoke-recovery-password'
  const resetCommand = await promisify(execFile)(
    process.execPath,
    [fileURLToPath(new URL('./admin-password.mjs', import.meta.url))],
    {
      env: { ...process.env, ADMIN_PASSWORD: recoveredPassword }
    }
  )
  const backupPath = resetCommand.stdout.match(/Backup saved at (.+)\. Keep it private/)?.[1]
  check(
    'admin recovery preserves a complete backup before changing the password',
    backupPath && (await readFile(backupPath, 'utf8')) === beforeAdminReset
  )
  check(
    'admin recovery enables the new login and expires older admin sessions',
    (
      await request('POST', '/auth/login', {
        body: { email: 'admin@fitpulse.com', password: recoveredPassword }
      })
    ).status === 200 &&
      (await request('GET', '/me', { token: changedAdmin.payload.session?.token })).status ===
        401 &&
      (await request('GET', '/me', { token: changedMember.payload.session?.token })).status === 200
  )

  let lastForgot
  for (let index = 0; index < 6; index += 1) {
    lastForgot = await request('POST', '/auth/forgot-password', {
      body: { email: 'nobody@example.com' }
    })
  }
  check(`forgot-password is rate limited (HTTP ${lastForgot.status})`, lastForgot.status === 429)

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
