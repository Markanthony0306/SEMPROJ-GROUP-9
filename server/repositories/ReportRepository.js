
export class ReportRepositoryError extends Error {
  constructor(message, status = 500) {
    super(message)
    this.name = 'ReportRepositoryError'
    this.status = status
  }
}

export class ReportRepository {
  constructor({ supabase, loadDatabase }) {
    this.supabase = supabase
    this.loadDatabase = loadDatabase
  }

  // Retrieve records using the existing database loader.
  async loadRecords(sections) {
    return this.loadDatabase(sections)
  }

  // Create or update a report record.
  async saveRecord({
    collection,
    id,
    values,
    updating
  }) {
    const { table, key } = collection

    const query = updating
      ? this.supabase
          .from(table)
          .update(values)
          .eq(key, id)
      : this.supabase
          .from(table)
          .insert({
            [key]: id,
            ...values
          })

    const { data, error } = await query.select(key)

    if (error) {
      console.error(
        'Report record save failed:',
        error.message
      )

      throw new ReportRepositoryError(
        'Unable to save this record. Refresh the report and try again.',
        error.code === '23503' ? 409 : 500
      )
    }

    if (!data?.length) {
      throw new ReportRepositoryError(
        'Record not found. Refresh the report.',
        404
      )
    }

    return id
  }

  // Delete an individual report record.
  async deleteRecord({ collection, id }) {
    const { table, key } = collection

    const { data, error } = await this.supabase
      .from(table)
      .delete()
      .eq(key, id)
      .select(key)

    if (error) {
      console.error(
        'Report record deletion failed:',
        error.message
      )

      throw new ReportRepositoryError(
        'Unable to delete this record. It may be linked to other records.',
        409
      )
    }

    if (!data?.length) {
      throw new ReportRepositoryError(
        'Record not found. It may already have been deleted.',
        404
      )
    }

    return true
  }

  // Clear records using the existing PostgreSQL RPC.
  async clearCategory(category) {
    const { data, error } = await this.supabase.rpc(
      'clear_fitpulse_report_records',
      {
        p_category: category
      }
    )

    if (error) {
      console.error(
        'Report category clear failed:',
        error.message
      )

      // Do not return a false success response.
      throw new ReportRepositoryError(
        'Unable to clear report records. No successful deletion was confirmed.',
        500
      )
    }

    return data
  }
}
