import crypto from 'node:crypto'
import express from 'express'
import jwt from 'jsonwebtoken'
import QRCode from 'qrcode'
import { supabase } from '../lib/supabase.js'

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

export function scannerRoutes({ loadAccount, authenticate, rateLimit, jwtSecret }) {
  const router = express.Router()
  // A QR token must never be usable as a web login token.
  const qrSecret = crypto.createHmac('sha256', jwtSecret).update('fitpulse-qr-v1').digest('hex')
  const scannerKey = process.env.SCANNER_API_KEY || ''
  const deviceId = process.env.SCANNER_DEVICE_ID || 'entrance-esp32-cam'

  router.get('/me/qr', authenticate, rateLimit({ windowMs: 60000, max: 20 }), async (req, res) => {
    res.set('Cache-Control', 'no-store')
    const member = await loadAccount(req.user.id)
    const code = membershipFailure(member)
    if (code)
      return res.status(403).json({
        code,
        message:
          'An active membership with valid start and expiry dates is required. Please contact the front desk.'
      })
    const membershipExpiresAt = Date.parse(member.membershipEnd)
    const expiresInSeconds = Math.floor((membershipExpiresAt - Date.now()) / 1000)
    if (expiresInSeconds <= 0)
      return res.status(403).json({
        code: 'MEMBERSHIP_EXPIRED',
        message: 'Your membership has expired. Please renew it before generating a QR code.'
      })
    // Tie the QR to this exact membership period so each request renders the
    // same credential until the plan dates change or the credential expires.
    const membershipStartsAt = Date.parse(member.membershipStart || member.joined)
    const issuedAt = Math.floor(membershipStartsAt / 1000)
    const expiresAt = Math.floor(membershipExpiresAt / 1000)
    const qrId = crypto
      .createHmac('sha256', qrSecret)
      .update(`fitpulse-member-qr:${member.id}:${issuedAt}:${expiresAt}`)
      .digest('hex')
      .slice(0, 32)
    const qrToken = jwt.sign({ iat: issuedAt, exp: expiresAt }, qrSecret, {
      algorithm: 'HS256',
      subject: member.id,
      jwtid: qrId,
      audience: 'fitpulse-scanner'
    })
    const image = await QRCode.toDataURL(qrToken, {
      errorCorrectionLevel: 'M',
      margin: 4,
      width: 360,
      color: {
        dark: '#003049FF',
        light: '#FFFFFFFF'
      }
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
    async (req, res) => {
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
      const member = await loadAccount(claims.sub)
      const code = membershipFailure(member)
      if (code)
        return res.status(403).json({
          allowed: false,
          code,
          message: 'Membership could not be verified. Please contact the front desk.'
        })
      const { data, error } = await supabase.rpc('record_fitpulse_checkin', {
        p_member_id: member.id,
        p_member_name: member.name,
        p_date: new Date().toISOString(),
        p_source: 'ESP32-CAM',
        p_device_id: deviceId,
        p_request_id: requestId,
        p_qr_token_id: claims.jti
      })
      if (error) {
        console.error('Supabase could not record the scanner check-in:', error.message)
        return res.status(503).json({
          allowed: false,
          code: 'CHECK_IN_UNAVAILABLE',
          message: 'Attendance storage is unavailable. Please try again.'
        })
      }
      const result = data?.[0]
      if (!result) return res.status(503).json({
        allowed: false,
        code: 'CHECK_IN_UNAVAILABLE',
        message: 'Attendance storage is unavailable. Please try again.'
      })
      if (result.result_code === 'REQUEST_CONFLICT')
        return res.status(409).json({
          allowed: false,
          code: result.result_code,
          message: 'Use a new request ID for each scan.'
        })
      if (result.result_code === 'CHECK_IN_COOLDOWN')
        return res.status(409).json({
          allowed: false,
          code: result.result_code,
          message: 'A check-in was just recorded for this member.'
        })
      return res.status(result.result_code === 'CHECK_IN_RECORDED' ? 201 : 200).json({
        allowed: true,
        code: result.result_code,
        attendanceId: result.attendance_id,
        memberName: member.name
      })
    }
  )
  return router
}
