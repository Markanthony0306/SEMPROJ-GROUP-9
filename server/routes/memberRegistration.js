
import { Router } from 'express'
import { MemberIdError } from '../services/memberIdRecords.js'
import { FaceVerificationError } from '../services/faceVerification.js'

import {
  MemberRegistrationError
} from '../services/MemberRegistrationService.js'

import {
  MemberRegistrationWorkflowError
} from '../services/MemberRegistrationWorkflow.js'

export function memberRegistrationRoutes({
  authenticate,
  requireRole,
  loadDatabase,
  supabase,
  validAccountInput,
  paymentMethod,
  registrationService,
  registrationWorkflow,
  verifiedRegistrationWorkflow,
  identityVerificationEnabled = false,
  faceKey,
  publicAccount
}) {
  const router = Router()

  router.post(
    '/admin/members',
    authenticate,
    requireRole('admin'),

    async (req, res) => {
      try {
        const body = req.body || {}

        // 1. Reject invalid input before querying Supabase.
        const preliminaryInput = validAccountInput(body)

        if (preliminaryInput.error) {
          return res.status(400).json({
            message: preliminaryInput.error
          })
        }

        if (identityVerificationEnabled &&
            (typeof body.verificationId !== 'string' || !body.verificationId)) {
          return res.status(409).json({
            code: 'ID_VERIFICATION_REQUIRED',
            message: 'Complete ID and face verification before creating this account.'
          })
        }

        if (
          body.recordPayment === true &&
          !paymentMethod(body)
        ) {
          return res.status(400).json({
            message: 'Choose Cash or GCash for a recorded payment.'
          })
        }

        // 2. Load existing accounts and payment configuration.
        const database = await loadDatabase([
          'accounts',
          'payments'
        ])

        // 3. Apply registration business rules.
        const prepared = registrationService.prepare({
          body,
          database
        })

        const { input } = prepared

        // 4. Check for an existing Supabase profile.
        const {
          data: existingProfile,
          error: lookupError
        } = await supabase
          .from('users')
          .select('id')
          .eq('email', input.email)
          .maybeSingle()

        if (lookupError) {
          console.error(
            'Supabase email lookup failed:',
            lookupError.message
          )

          return res.status(500).json({
            message: 'Unable to check the member account.'
          })
        }

        if (existingProfile) {
          return res.status(409).json({
            message: 'An account with this email already exists.'
          })
        }

        // 5. Use the staged, ID-verified enrollment transaction when enabled.
        let persisted, authUserId, temporaryPassword, member
        if (identityVerificationEnabled) {
          const result = await verifiedRegistrationWorkflow.execute({
            actor: req.user, prepared, verificationId: body.verificationId, faceKey
          })
          authUserId = result.authUserId
          temporaryPassword = result.temporaryPassword
          persisted = {
            member_id: result.profile.id,
            member_code: result.profile.member_code,
            plan_name: prepared.planRecord.plan_name,
            created_at: result.profile.created_at,
            start_date: result.now,
            end_date: result.membershipEnd,
            subscription_id: result.subscriptionId,
            plan_id: prepared.planRecord.plan_id
          }
        } else {
          ;({ persisted, authUserId, temporaryPassword } = await registrationWorkflow.execute({
            actorId: req.user.id, prepared
          }))
        }

        // 6. Reconstruct the existing frontend-compatible member object.
        member = {
          id: persisted.member_id,
          authUserId,
          memberCode: persisted.member_code,
          name: input.name,
          email: input.email,
          phone: input.phone || '',
          role: 'user',
          plan: persisted.plan_name,
          status: 'active',
          joined: persisted.created_at,
          membershipStart: persisted.start_date,
          membershipEnd: persisted.end_date,
          subscriptionId: persisted.subscription_id,
          subscriptionCreatedAt: persisted.created_at,
          planId: persisted.plan_id,
          mustChangePassword: true,
          authVersion: 0,
          idVerified: identityVerificationEnabled
        }

        // 7. Return the same response format as the original route.
        res.set('Cache-Control', 'no-store')

        return res.status(201).json({
          temporaryPassword,
          message: 'Member account created.',
          member: {
            ...publicAccount(member),
            memberCode: persisted.member_code,
            accountStatus: 'active',
            createdAt: persisted.created_at
          }
        })

      } catch (error) {
        // Known registration errors return appropriate HTTP statuses.
        if (
          error instanceof MemberRegistrationError ||
          error instanceof MemberRegistrationWorkflowError ||
          error instanceof MemberIdError || error instanceof FaceVerificationError
        ) {
          return res.status(error.status).json({
            message: error.message, code: error.code
          })
        }

        // Unexpected problems return a generic error.
        console.error(
          'Unable to create member:',
          error.message
        )

        return res.status(500).json({
          message: 'Unable to create the member account.'
        })
      }
    }
  )

  return router
}
