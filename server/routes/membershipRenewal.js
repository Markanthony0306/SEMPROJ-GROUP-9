
import { Router } from 'express'
import { MembershipError } from '../services/MembershipService.js'

export function membershipRenewalRoutes({
  authenticate,
  requireRole,
  loadDatabase,
  withMemberAccountLock,
  availablePlan,
  paymentMethod,
  publicAccount,
  workflow
}) {
  const router = Router()

  router.post(
    '/admin/members/:id/renew',
    authenticate,
    requireRole('admin'),

    async (req, res) =>
      withMemberAccountLock(req.params.id, async () => {

        // 1. Load the current member and payment configuration
        const database = await loadDatabase(['accounts', 'payments'])

        const member = database.accounts.find(
          (account) =>
            account.id === req.params.id &&
            ['user', 'member'].includes(account.role)
        )

        if (!member) {
          return res.status(404).json({
            message: 'Member not found.'
          })
        }

        // 2. Validate the selected plan
        const body = req.body || {}
        const method = paymentMethod(body)

        const planName =
          typeof body.plan === 'string' && body.plan.trim()
            ? body.plan.trim()
            : member.plan

        const planRecord = database.membershipPlans.find(
          (item) => availablePlan(item, planName)
        )

        if (!planRecord) {
          return res.status(400).json({
            message: `The ${planName} membership plan is not active in Supabase.`
          })
        }

        // 3. Validate the payment information
        const amount =
          body.amount === undefined
            ? Number(planRecord.price)
            : Number(body.amount)

        if (!method || !Number.isFinite(amount) || amount <= 0) {
          return res.status(400).json({
            message: 'Use Cash or GCash and a positive payment amount.'
          })
        }

        const methodConfigured = database.paymentMethods.some(
          (item) =>
            String(item.method_name).toLowerCase() ===
            method.toLowerCase()
        )

        if (!methodConfigured) {
          return res.status(400).json({
            message: `The ${method} payment method is not configured in Supabase.`
          })
        }

        // 4. Execute the OOP renewal workflow
        let result

        try {
          result = await workflow.execute({
            member,
            planRecord,
            paymentDetails: {
              method,
              paymentMethods: database.paymentMethods,
              amount
            },
            actorId: req.user.id
          })
        } catch (error) {

          if (error instanceof MembershipError) {
            const status =
              error.code === 'MEMBER_NOT_FOUND' ? 404 : 400

            return res.status(status).json({
              message: error.message
            })
          }

          if (error.code === 'MEMBERSHIP_RENEWAL_CONFLICT') {
            return res.status(409).json({
              message: 'Membership changed during renewal. Refresh and try again.'
            })
          }

          // Unexpected errors go to the existing Express error handler
          throw error
        }

        // 5. Respond only after the database operation succeeds
        return res.json({
          member: publicAccount(result.member),
          payment: result.payment
        })
      })
  )

  return router
}
