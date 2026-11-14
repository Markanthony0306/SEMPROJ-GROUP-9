
import jwt from 'jsonwebtoken'
import { Membership } from '../models/Membership.js'

export class AttendanceError extends Error {
  constructor(code, message, status = 403) {
    super(message)
    this.name = 'AttendanceError'
    this.code = code
    this.status = status
  }
}

// Preserve the existing exported membership helper.
export function membershipFailure(member, now = Date.now()) {
  if (!member) return 'MEMBER_NOT_FOUND'

  return new Membership(member).getCheckInFailure(now)
}

export class AttendanceService {
  constructor({ qrSecret }) {
    this.qrSecret = qrSecret
  }

  // STEP 1: Validate the request from the scanner.
  validateScan({ qrToken, requestId, deviceId }) {
    if (
      !deviceId ||
      typeof requestId !== 'string' ||
      !/^[a-zA-Z0-9-]{16,80}$/.test(requestId) ||
      typeof qrToken !== 'string' ||
      qrToken.length > 2048
    ) {
      throw new AttendanceError(
        'INVALID_SCAN',
        'Invalid scan request.',
        400
      )
    }
  }

  // STEP 2: Verify the signed QR token.
  verifyQr(qrToken) {
    let claims

    try {
      claims = jwt.verify(qrToken, this.qrSecret, {
        algorithms: ['HS256'],
        audience: 'fitpulse-scanner'
      })

      if (
        typeof claims.sub !== 'string' ||
        typeof claims.jti !== 'string'
      ) {
        throw new Error('Invalid QR claims')
      }
    } catch {
      throw new AttendanceError(
        'QR_INVALID_OR_EXPIRED',
        'Refresh the member QR code and scan again.'
      )
    }

    return claims
  }

  // STEP 3: Check membership validity and QR dates.
  validateMembership(member, claims) {
    const code = membershipFailure(member)

    if (code) {
      throw new AttendanceError(
        code,
        'Membership could not be verified. Please contact the front desk.'
      )
    }

    const membershipStart = Math.floor(
      Date.parse(member.membershipStart || member.joined) / 1000
    )

    const membershipEnd = Math.floor(
      Date.parse(member.membershipEnd) / 1000
    )

    if (
      claims.iat !== membershipStart ||
      claims.exp !== membershipEnd
    ) {
      throw new AttendanceError(
        'QR_INVALID_OR_EXPIRED',
        'The membership changed. Refresh the member QR and scan again.'
      )
    }

    return member
  }

  // STEP 4: Interpret the database attendance result.
  formatResult(result, member) {

    if (result.result_code === 'MEMBERSHIP_INACTIVE') {
      throw new AttendanceError(
        'MEMBERSHIP_INACTIVE',
        'This member account is inactive. Attendance is not allowed.',
        403
      )
    }

    if (result.result_code === 'REQUEST_CONFLICT') {
      throw new AttendanceError(
        'REQUEST_CONFLICT',
        'Use a new request ID for each scan.',
        409
      )
    }

    if (result.result_code === 'CHECK_IN_COOLDOWN') {
      throw new AttendanceError(
        'CHECK_IN_COOLDOWN',
        'A check-in was just recorded for this member.',
        409
      )
    }

    return {
      status: result.result_code === 'CHECK_IN_RECORDED'
        ? 201
        : 200,

      body: {
        allowed: true,
        code: result.result_code,
        attendanceId: result.attendance_id,
        memberName: member.name
      }
    }
  }
}
