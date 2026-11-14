import { MemberUpdateService } from '../services/MemberUpdateService.js'
import { MemberUpdateRepository } from '../repositories/MemberUpdateRepository.js'
import { MemberUpdateWorkflow } from '../services/MemberUpdateWorkflow.js'

export function registerMemberUpdateRoutes(app, { authenticate, requireRole, loadDatabase, validAccountInput, passwordPolicy, passwordPolicyMessage, supabase, publicAccount }) {
  app.patch(
    '/api/admin/members/:id',
    authenticate,
    requireRole('admin'),
    async (req, res) => {
      try {
        // STEP 1: Validate the request structure.
        const body = req.body ?? {}

        if (
          typeof body !== 'object' ||
          Array.isArray(body)
        ) {
          return res.status(400).json({
            message: 'Invalid member update request.'
          })
        }

        const supportedFields = [
          'name',
          'email',
          'phone',
          'plan',
          'password'
        ]

        const unsupportedFields =
          Object.keys(body).filter(
            (field) => !supportedFields.includes(field)
          )

        if (unsupportedFields.length > 0) {
          return res.status(400).json({
            message: 'Unsupported member update fields.'
          })
        }

        // STEP 2: Load the member account.
        const database = await loadDatabase(['accounts'])

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

        // STEP 3: Initialize the OOP components.
        const service = new MemberUpdateService({
          validAccountInput,
          passwordPolicy,
          passwordPolicyMessage
        })

        const repository = new MemberUpdateRepository(
          supabase
        )

        const workflow = new MemberUpdateWorkflow({
          service,
          repository,
          authAdmin: supabase.auth.admin
        })

        // STEP 4: Let the workflow handle the update.
        const result = await workflow.execute({
          actorId: req.user.id,
          member,
          body,
          accounts: database.accounts
        })

        // STEP 5: Synchronize the response object.
        // Database writes were already performed
        // by the OOP repository.
        Object.assign(member, {
          name: result.updatedProfile.name,
          email: result.updatedProfile.email,
          phone:
            result.updatedProfile.phone_number || '',
          plan: result.input.plan,
          subscriptionId:
            result.subscriptionId ?? member.subscriptionId
        })

        // Password changes invalidate old sessions.
        if (result.passwordChanged) {
          member.authVersion = result.authVersion
          member.mustChangePassword = false
        }

        // STEP 6: Return the updated member.
        return res.json({
          member: publicAccount(member)
        })

      } catch (error) {
        console.error(
          'Member update failed:',
          error.code || error.message
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
            'Unable to update the member.'
        })
      }
    }
  )



}
