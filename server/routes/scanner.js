import crypto from 'node:crypto'
import express from 'express'
import jwt from 'jsonwebtoken'
import QRCode from 'qrcode'

import {
  AttendanceService,
  AttendanceError,
  membershipFailure
} from '../services/AttendanceService.js'

import {
  AttendanceRepository
} from '../repositories/AttendanceRepository.js'

import {
  AttendanceWorkflow
} from '../services/AttendanceWorkflow.js'

import { supabase } from '../lib/supabase.js'

export { membershipFailure }

export function scannerRoutes({ loadAccount, authenticate, requireRole, rateLimit, jwtSecret }) {
  const router = express.Router()
  // A QR token must never be usable as a web login token.
  const qrSecret = crypto.createHmac('sha256', jwtSecret).update('fitpulse-qr-v1').digest('hex')
  const scannerKey = process.env.SCANNER_API_KEY || ''
  const deviceId = process.env.SCANNER_DEVICE_ID || 'entrance-esp32-cam'


  // OOP attendance workflow.
  const attendanceWorkflow = new AttendanceWorkflow({
    service: new AttendanceService({
      qrSecret
    }),

    repository: new AttendanceRepository({
      supabase,
      loadAccount
    })
  })


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


  // Process scanner check-ins through the OOP workflow.
  const checkIn = (source, getDeviceId) => async (req, res) => {
    res.set('Cache-Control', 'no-store')

    try {
      const result = await attendanceWorkflow.execute({
        qrToken: req.body?.qrToken,
        requestId: req.body?.requestId,
        deviceId: getDeviceId(req),
        source
      })

      return res.status(result.status).json(result.body)

    } catch (error) {
      // Known attendance failures have specific HTTP codes.
      if (error instanceof AttendanceError) {
        return res.status(error.status).json({
          allowed: false,
          code: error.code,
          message: error.message
        })
      }

      // Unexpected errors must not expose internal details.
      console.error(
        'Scanner check-in failed:',
        error?.code || 'UNEXPECTED_ERROR'
      )

      return res.status(503).json({
        allowed: false,
        code: 'CHECK_IN_UNAVAILABLE',
        message: 'Attendance storage is unavailable. Please try again.'
      })
    }
  }

  router.post(
    '/scanner/check-in',
    rateLimit({ windowMs: 60_000, max: 120 }),
    authenticateScanner,
    checkIn('ESP32-CAM', (req) => req.body?.deviceId === deviceId ? deviceId : null)
  )
  router.post(
    '/admin/attendance/scan',
    authenticate,
    requireRole('admin'),
    rateLimit({ windowMs: 60_000, max: 60 }),
    checkIn('Staff', (req) => 'webcam:' + req.user.id)
  )
  return router
}
