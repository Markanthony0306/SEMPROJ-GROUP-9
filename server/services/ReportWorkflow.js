
import { randomUUID } from 'node:crypto'

export class ReportWorkflow {
  constructor({ service, repository, onPaymentRecorded }) {
    this.service = service
    this.repository = repository
    this.onPaymentRecorded = onPaymentRecorded
  }

  // Retrieve report records.
  async getRecords(kind) {
    const collection =
      this.service.getCollection(kind)

    const database =
      await this.repository.loadRecords(
        collection.sections
      )

    return this.service.publicRecords(
      database[kind]
    )
  }

  // Create or edit a report record.
  async save({
    kind,
    recordId,
    body,
    actorId
  }) {
    const collection =
      this.service.getCollection(kind)

    if (recordId) {
      this.service.validateId(recordId)
    }

    this.service.ensureWriteAllowed(
      kind,
      recordId
    )

    const database =
      await this.repository.loadRecords(
        collection.sections
      )

    const existing = this.service.findExisting(
      kind,
      database,
      recordId
    )

    const values =
      this.service.prepareRecord({
        kind,
        input: body,
        database,
        existing,
        actorId
      })

    const id = existing?.id || randomUUID()

    await this.repository.saveRecord({
      collection,
      id,
      values,
      updating: Boolean(existing)
    })

    // The Reports screen can also record a payment. An edit is not a new receipt.
    if (this.onPaymentRecorded && kind === 'payments' && !existing) {
      const member = database.accounts.find((account) => account.id === body.memberId)
      const method = database.paymentMethods.find((item) => item.method_id === values.method_id)
      this.onPaymentRecorded({
        memberId: member.id,
        memberName: member.name,
        amount: values.amount_paid,
        method: method.method_name
      })
    }

    return {
      status: existing ? 200 : 201,
      id,
      message: existing
        ? 'Record updated.'
        : 'Record created.'
    }
  }

  // Delete one record.
  async delete({ kind, recordId }) {
    const collection =
      this.service.getCollection(kind)

    this.service.validateId(recordId)

    await this.repository.deleteRecord({
      collection,
      id: recordId
    })

    return {
      message: 'Record deleted.'
    }
  }

  // Clear a report category.
  async clear({ kind, body }) {
    this.service.getCollection(kind)

    const category =
      this.service.validateClear(kind, body)

    const deleted =
      await this.repository.clearCategory(
        category
      )

    return {
      deleted,
      category,
      message: 'Report records cleared.'
    }
  }
}
