import crypto from 'node:crypto'
import { Router } from 'express'
import { REPORT_COLLECTIONS, reportRecordInput } from '../services/reportRecords.js'

export function reportRoutes({ authenticate, requireRole, loadDatabase, supabase, rateLimit }) {
  const router = Router()
  router.use('/admin/reports', authenticate, requireRole('admin', 'staff'), rateLimit({ max: 100 }))

  router.param('kind', (req, res, next, kind) => {
    if (!Object.hasOwn(REPORT_COLLECTIONS, kind))
      return res.status(404).json({ message: 'Report type not found.' })
    req.reportCollection = REPORT_COLLECTIONS[kind]
    next()
  })
  router.param('id', (req, res, next, id) => {
    if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id))
      return res.status(400).json({ message: 'Invalid record identifier.' })
    next()
  })

  router.get('/admin/reports/:kind', async (req, res) => {
    const database = await loadDatabase(req.reportCollection.sections)
    const records = database[req.params.kind].map(
      ({ qrTokenId, scannerRequestId, ...record }) => record
    )
    res.json({ records })
  })

  async function writeRecord(req, res) {
    if (req.params.kind === 'attendance' && !req.params.id)
      return res.status(403).json({ message: 'Check-in must be recorded by the entrance scanner.' })
    const { table, key, sections } = req.reportCollection
    const database = await loadDatabase(sections)
    const existing = req.params.id
      ? database[req.params.kind].find((row) => row.id === req.params.id)
      : undefined
    if (req.params.id && !existing)
      return res.status(404).json({ message: 'Record not found. Refresh the report.' })
    let values
    try {
      values = reportRecordInput(req.params.kind, req.body, database, {
        existing,
        actorId: req.user.id
      })
    } catch (error) {
      if (error.status === 400) return res.status(400).json({ message: error.message })
      throw error
    }
    const id = existing?.id || crypto.randomUUID()
    const query = existing
      ? supabase.from(table).update(values).eq(key, id)
      : supabase.from(table).insert({ [key]: id, ...values })
    const { data, error } = await query.select(key)
    if (error) {
      console.error('Report record save failed:', error.message)
      return res
        .status(error.code === '23503' ? 409 : 500)
        .json({ message: 'Unable to save this record. Refresh the report and try again.' })
    }
    if (!data?.length)
      return res.status(404).json({ message: 'Record not found. Refresh the report.' })
    res
      .status(existing ? 200 : 201)
      .json({ id, message: existing ? 'Record updated.' : 'Record created.' })
  }
  router.post('/admin/reports/:kind', writeRecord)
  router.patch('/admin/reports/:kind/:id', writeRecord)
  router.delete('/admin/reports/:kind', requireRole('admin'), async (req, res) => {
    const category = req.body?.category
    const allowed = req.params.kind === 'payments' ? ['payments', 'renewals'] : [req.params.kind]
    if (!allowed.includes(category) || req.body?.confirmation !== 'CLEAR')
      return res
        .status(400)
        .json({ message: 'Choose a report category and type CLEAR to confirm.' })

    const { data, error } = await supabase.rpc('clear_fitpulse_report_records', {
      p_category: category
    })
    if (error) {
      console.error('Report category clear failed:', error.code || 'DATABASE_ERROR')
      return res.status(503).json({
        message:
          error.code === 'PGRST202'
            ? 'Report clearing is unavailable. Apply supabase/migrations/004_clear_report_records.sql, then reload the page.'
            : 'Report clearing could not be confirmed. Reload the page to check the latest records before trying again.'
      })
    }
    res.json({ deleted: data, category, message: 'Report records cleared.' })
  })
  router.delete('/admin/reports/:kind/:id', requireRole('admin'), async (req, res) => {
    const { table, key } = req.reportCollection
    const { data, error } = await supabase.from(table).delete().eq(key, req.params.id).select(key)
    if (error) {
      console.error('Report record deletion failed:', error.message)
      return res
        .status(409)
        .json({ message: 'Unable to delete this record. It may be linked to other records.' })
    }
    if (!data?.length)
      return res
        .status(404)
        .json({ message: 'Record not found. It may already have been deleted.' })
    res.json({ message: 'Record deleted.' })
  })
  return router
}
