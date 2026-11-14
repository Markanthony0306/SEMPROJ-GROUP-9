import { PaymentService } from '../services/PaymentService.js'
import { PaymentRepository } from '../repositories/PaymentRepository.js'
import { PaymentWorkflow } from '../services/PaymentWorkflow.js'

export function registerActivityAndPaymentRoutes(app, { authenticate, requireRole, loadDatabase, supabase, paymentMethod }) {
  app.get('/api/attendance', authenticate, async (req, res) => {
    const database = await loadDatabase(['attendance'])
    const isAdmin = req.user.role === 'admin'
    const attendance = isAdmin
      ? database.attendance
      : database.attendance.filter((item) => item.memberId === req.user.id)
    res.json({ attendance: attendance.map(({ qrTokenId, scannerRequestId, ...record }) => record) })
  })

  app.post('/api/attendance/check-in', authenticate, (req, res) => {
    res
      .status(403)
      .json({ message: 'Check-in must be recorded by the entrance scanner.' })
  })

  app.get('/api/payments', authenticate, async (req, res) => {
    const database = await loadDatabase(['payments'])
    const isAdmin = req.user.role === 'admin'
    const payments = isAdmin
      ? database.payments
      : database.payments.filter((item) => item.memberId === req.user.id)
    res.json({ payments })
  })

  app.post('/api/admin/attendance', authenticate, requireRole('admin'), (req, res) => {
    res.status(403).json({ message: 'Check-in must be recorded by the entrance scanner.' })
  })


  app.post(
    '/api/admin/payments',
    authenticate,
    requireRole('admin'),
    async (req, res) => {
      try {
        // STEP 1: Initialize the OOP components.
        const service = new PaymentService({
          paymentMethod
        })

        const repository = new PaymentRepository({
          supabase,
          loadDatabase
        })

        const workflow = new PaymentWorkflow({
          service,
          repository
        })

        // STEP 2: Record the payment.
        const payment = await workflow.execute({
          body: req.body,
          actorId: req.user.id
        })

        // STEP 3: Return the result.
        return res.status(201).json({
          payment
        })

      } catch (error) {
        console.error(
          'Payment recording failed:',
          error.code || error.name
        )

        const status =
          Number.isInteger(error.status) &&
          error.status >= 400 &&
          error.status <= 599
            ? error.status
            : 500

        return res.status(status).json({
          message:
            error.message ||
            'Unable to record payment.'
        })
      }
    }
  )



}
