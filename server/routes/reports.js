
import { Router } from 'express'

import {
  ReportService
} from '../services/ReportService.js'

import {
  ReportRepository
} from '../repositories/ReportRepository.js'

import {
  ReportWorkflow
} from '../services/ReportWorkflow.js'

export function reportRoutes({
  authenticate,
  requireRole,
  loadDatabase,
  supabase,
  rateLimit
}) {
  const router = Router()

  // Initialize the OOP report workflow.
  const workflow = new ReportWorkflow({
    service: new ReportService(),

    repository: new ReportRepository({
      supabase,
      loadDatabase
    })
  })

  // Preserve authentication, roles, and rate limits.
  router.use(
    '/admin/reports',
    authenticate,
    requireRole('admin'),
    rateLimit({ max: 100 })
  )

  // Handle known errors without exposing database details.
  const handle = (operation) =>
    async (req, res, next) => {
      try {
        await operation(req, res)
      } catch (error) {
        if (
          Number.isInteger(error?.status) &&
          error.status >= 400 &&
          error.status <= 599
        ) {
          return res.status(error.status).json({
            message: error.message
          })
        }

        return next(error)
      }
    }

  // GET: Retrieve report records.
  router.get(
    '/admin/reports/:kind',
    handle(async (req, res) => {
      const records =
        await workflow.getRecords(req.params.kind)

      return res.json({ records })
    })
  )

  // POST: Create a report record.
  router.post(
    '/admin/reports/:kind',
    handle(async (req, res) => {
      const result = await workflow.save({
        kind: req.params.kind,
        body: req.body,
        actorId: req.user.id
      })

      return res.status(result.status).json({
        id: result.id,
        message: result.message
      })
    })
  )

  // PATCH: Update a report record.
  router.patch(
    '/admin/reports/:kind/:id',
    handle(async (req, res) => {
      const result = await workflow.save({
        kind: req.params.kind,
        recordId: req.params.id,
        body: req.body,
        actorId: req.user.id
      })

      return res.status(result.status).json({
        id: result.id,
        message: result.message
      })
    })
  )

  // DELETE: Clear a report category.
  // Only administrators may delete records.
  router.delete(
    '/admin/reports/:kind',
    requireRole('admin'),
    handle(async (req, res) => {
      const result = await workflow.clear({
        kind: req.params.kind,
        body: req.body
      })

      return res.json(result)
    })
  )

  // DELETE: Remove an individual report record.
  router.delete(
    '/admin/reports/:kind/:id',
    requireRole('admin'),
    handle(async (req, res) => {
      const result = await workflow.delete({
        kind: req.params.kind,
        recordId: req.params.id
      })

      return res.json(result)
    })
  )

  return router
}
