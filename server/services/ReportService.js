
import {
  REPORT_COLLECTIONS,
  reportRecordInput
} from './reportRecords.js'

export class ReportError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = 'ReportError'
    this.status = status
  }
}

export class ReportService {
  getCollection(kind) {
    if (!Object.hasOwn(REPORT_COLLECTIONS, kind)) {
      throw new ReportError(
        'Report type not found.',
        404
      )
    }

    return REPORT_COLLECTIONS[kind]
  }

  validateId(id) {
    const valid =
      /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id)

    if (!valid) {
      throw new ReportError(
        'Invalid record identifier.'
      )
    }
  }

  ensureWriteAllowed(kind, recordId) {
    // Attendance may only be created by a scanner.
    if (kind === 'attendance' && !recordId) {
      throw new ReportError(
        'Check-in must be recorded by the entrance scanner.',
        403
      )
    }
  }

  findExisting(kind, database, recordId) {
    if (!recordId) return undefined

    const record = database[kind].find(
      (row) => row.id === recordId
    )

    if (!record) {
      throw new ReportError(
        'Record not found. Refresh the report.',
        404
      )
    }

    return record
  }

  prepareRecord({
    kind,
    input,
    database,
    existing,
    actorId
  }) {
    return reportRecordInput(
      kind,
      input,
      database,
      { existing, actorId }
    )
  }

  publicRecords(records) {
    // Do not expose internal scanner identifiers.
    return records.map(
      ({
        qrTokenId,
        scannerRequestId,
        ...record
      }) => record
    )
  }

  validateClear(kind, body) {
    const category = body?.category

    const allowed =
      kind === 'payments'
        ? ['payments', 'renewals']
        : [kind]

    if (
      !allowed.includes(category) ||
      body?.confirmation !== 'CLEAR'
    ) {
      throw new ReportError(
        'Choose a report category and type CLEAR to confirm.'
      )
    }

    return category
  }
}
