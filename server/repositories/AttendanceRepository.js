
import { AttendanceError } from '../services/AttendanceService.js'

export class AttendanceRepository {
  constructor({ supabase, loadAccount }) {
    this.supabase = supabase
    this.loadAccount = loadAccount
  }

  // STEP 1: Retrieve the member account.
  async findMember(memberId) {
    return this.loadAccount(memberId)
  }

  // STEP 2: Record the check-in using PostgreSQL RPC.
  async recordCheckIn({
    member,
    source,
    deviceId,
    requestId,
    qrTokenId
  }) {
    let response

    try {
      response = await this.supabase.rpc(
        'record_fitpulse_checkin',
        {
          p_member_id: member.id,
          p_member_name: member.name,
          p_date: new Date().toISOString(),
          p_source: source,
          p_device_id: deviceId,
          p_request_id: requestId,
          p_qr_token_id: qrTokenId
        }
      )
    } catch {
      throw new AttendanceError(
        'CHECK_IN_UNAVAILABLE',
        'Attendance storage is unavailable. Please try again.',
        503
      )
    }

    if (response?.error || !response?.data?.[0]) {
      throw new AttendanceError(
        'CHECK_IN_UNAVAILABLE',
        'Attendance storage is unavailable. Please try again.',
        503
      )
    }

    return response.data[0]
  }
}
