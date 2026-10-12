import crypto from 'node:crypto'
import express from 'express'
import jwt from 'jsonwebtoken'
import QRCode from 'qrcode'

export function membershipFailure(member, now = Date.now()) {
  if (!member || !['user', 'member'].includes(member.role)) return 'MEMBER_NOT_FOUND'
  if (member.status !== 'active') return 'MEMBERSHIP_INACTIVE'
  const start = Date.parse(member.membershipStart || member.joined)
  const end = Date.parse(member.membershipEnd)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'MEMBERSHIP_DATES_MISSING'
  if (start > now) return 'MEMBERSHIP_NOT_STARTED'
  if (end <= now) return 'MEMBERSHIP_EXPIRED'
  return ''
}

export function scannerRoutes({ loadDatabase, saveDatabase, authenticate, rateLimit, jwtSecret }) {
  const router = express.Router()
  // A QR token must never be usable as a web login token.
  const qrSecret = crypto.createHmac('sha256', jwtSecret).update('fitpulse-qr-v1').digest('hex')
  const scannerKey = process.env.SCANNER_API_KEY || ''
  const deviceId = process.env.SCANNER_DEVICE_ID || 'entrance-esp32-cam'

  router.get('/me/qr', authenticate, rateLimit({ windowMs: 60000, max: 20 }), async (req, res) => {
    res.set('Cache-Control', 'no-store')
    const member = loadDatabase().accounts.find((account) => account.id === req.user.id)
    const code = membershipFailure(member)
    if (code)
      return res.status(403).json({
        code,
        message:
          'An active membership with valid start and expiry dates is required. Please contact the front desk.'
      })
    const qrToken = jwt.sign({}, qrSecret, {
      algorithm: 'HS256',
      subject: member.id,
      jwtid: crypto.randomBytes(12).toString('hex'),
      audience: 'fitpulse-scanner',
      expiresIn: '2m'
    })
    const image = await QRCode.toDataURL(qrToken, {
      errorCorrectionLevel: 'M',
      margin: 4,
      width: 360
    })
    const { exp } = jwt.decode(qrToken)
    return res.json({ image, qrToken, expiresAt: exp * 1000 })
  })

  const authenticateScanner = (req, res, next) => {
    res.set('Cache-Control', 'no-store')
    if (scannerKey.length < 32)
      return res.status(503).json({
        allowed: false,
        code: 'SCANNER_NOT_CONFIGURED',
        message: 'Scanner access is not configured.'
      })
    const provided = req.get('X-Scanner-Key') || ''
    const expectedHash = crypto.createHash('sha256').update(scannerKey).digest()
    const actualHash = crypto.createHash('sha256').update(provided).digest()
    if (!crypto.timingSafeEqual(expectedHash, actualHash))
      return res.status(401).json({
        allowed: false,
        code: 'DEVICE_UNAUTHORIZED',
        message: 'Scanner authentication failed.'
      })
    next()
  }

  router.post(
    '/scanner/check-in',
    rateLimit({ windowMs: 60000, max: 120 }),
    authenticateScanner,
    (req, res) => {
      const { qrToken, requestId } = req.body || {}
      if (
        req.body?.deviceId !== deviceId ||
        typeof requestId !== 'string' ||
        !/^[a-zA-Z0-9-]{16,80}$/.test(requestId) ||
        typeof qrToken !== 'string' ||
        qrToken.length > 2048
      ) {
        return res
          .status(400)
          .json({ allowed: false, code: 'INVALID_SCAN', message: 'Invalid scan request.' })
      }
      let claims
      try {
        claims = jwt.verify(qrToken, qrSecret, {
          algorithms: ['HS256'],
          audience: 'fitpulse-scanner'
        })
        if (typeof claims.sub !== 'string' || typeof claims.jti !== 'string')
          throw new Error('Invalid claims')
      } catch {
        return res.status(403).json({
          allowed: false,
          code: 'QR_INVALID_OR_EXPIRED',
          message: 'Refresh the member QR code and scan again.'
        })
      }
      const database = loadDatabase()
      const member = database.accounts.find((account) => account.id === claims.sub)
      const code = membershipFailure(member)
      if (code)
        return res.status(403).json({
          allowed: false,
          code,
          message: 'Membership could not be verified. Please contact the front desk.'
        })
      const existingRequest = database.attendance.find(
        (item) => item.deviceId === deviceId && item.scannerRequestId === requestId
      )
      if (existingRequest) {
        if (existingRequest.qrTokenId !== claims.jti)
          return res.status(409).json({
            allowed: false,
            code: 'REQUEST_CONFLICT',
            message: 'Use a new request ID for each scan.'
          })
        return res.json({
          allowed: true,
          code: 'ALREADY_RECORDED',
          attendanceId: existingRequest.id,
          memberName: member.name
        })
      }
      if (database.attendance.some((item) => item.qrTokenId === claims.jti))
        return res.status(409).json({
          allowed: false,
          code: 'QR_ALREADY_USED',
          message: 'This QR code was already used. Refresh it for a new visit.'
        })
      const recent = database.attendance.some(
        (item) => item.memberId === member.id && Date.now() - Date.parse(item.date) < 60000
      )
      if (recent)
        return res.status(409).json({
          allowed: false,
          code: 'CHECK_IN_COOLDOWN',
          message: 'A check-in was just recorded for this member.'
        })
      const attendance = {
        id: crypto.randomUUID(),
        memberId: member.id,
        memberName: member.name,
        date: new Date().toISOString(),
        source: 'ESP32-CAM',
        deviceId,
        scannerRequestId: requestId,
        qrTokenId: claims.jti
      }
      database.attendance.push(attendance)
      saveDatabase(database)
      return res.status(201).json({
        allowed: true,
        code: 'CHECK_IN_RECORDED',
        attendanceId: attendance.id,
        memberName: member.name
      })
    }
  )
  return router
}
