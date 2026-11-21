
export class AttendanceWorkflow {
  constructor({ service, repository, onRecorded }) {
    this.service = service
    this.repository = repository
    this.onRecorded = onRecorded
  }

  // Coordinate a scanner check-in from start to finish.
  async execute({
    qrToken,
    requestId,
    deviceId,
    source
  }) {
    // STEP 1: Validate the scanner request.
    this.service.validateScan({
      qrToken,
      requestId,
      deviceId
    })

    // STEP 2: Verify QR token authenticity.
    const claims = this.service.verifyQr(qrToken)

    // STEP 3: Retrieve the member.
    const member =
      await this.repository.findMember(claims.sub)

    // STEP 4: Confirm membership eligibility.
    this.service.validateMembership(
      member,
      claims
    )

    // STEP 5: Record attendance through Supabase.
    const result =
      await this.repository.recordCheckIn({
        member,
        source,
        deviceId,
        requestId,
        qrTokenId: claims.jti
      })

    // STEP 6: Return the attendance result.
    const formatted = this.service.formatResult(
      result,
      member
    )
    // Replayed scanner requests already have an attendance record.
    if (formatted.status === 201) {
      try {
        this.onRecorded?.(member)
      } catch (error) {
        console.error('Attendance notification failed:', error.code || error.name)
      }
    }
    return formatted
  }
}
