
import { Router } from 'express'
import { gorillaEvents } from '../../shared/gorillaEvents.js'
import { emitPayment } from '../services/fitPulseEvents.js'
import { readEnrollmentTicket, consumeEnrollmentTicket, assertSameMember, validEmbedding } from '../services/identityProof.js'
import { BiometricError } from '../services/biometricEngine.js'

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
  emitEvent,
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
            message: preliminaryInput.error,
            field: preliminaryInput.field
          })
        }

        if (
          body.recordPayment === true &&
          !paymentMethod(body)
        ) {
          return res.status(400).json({
            message: 'Choose Cash or GCash for a recorded payment.',
            field: 'method'
          })
        }

        // Member creation requires a signed, server-verified ID/face proof.
        const enrollment = readEnrollmentTicket(body.enrollmentProof, 'member_enrollment')
        if (enrollment.actorId !== req.user.id || !validEmbedding(enrollment.embedding))
          throw new BiometricError('Member ID and facial verification must finish first.', 'INVALID_VERIFICATION', 403)
        assertSameMember(enrollment, preliminaryInput)

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
            message: 'An account with this email already exists.',
            field: 'email'
          })
        }

        // 5. Create the Auth account and save the profile, membership, and optional payment.
        // Prevent two concurrent account creations from reusing an enrollment.
        consumeEnrollmentTicket(body.enrollmentProof, 'member_enrollment')
        const { persisted, authUserId, temporaryPassword } = await registrationWorkflow.execute({
          actorId: req.user.id, prepared: { ...prepared, enrollment }
        })

        // 6. Reconstruct the existing frontend-compatible member object.
        const member = {
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
          authVersion: 0
        }

        // Notify after commit. The opaque ID also deduplicates the creator's local alert.
        if (prepared.recordPayment) {
          emitPayment(emitEvent, {
            memberId: member.id, memberName: member.name,
            amount: Number(prepared.planRecord.price), method: prepared.method
          })
        }
        const notificationId = emitEvent?.(
          { to: 'admins' },
          gorillaEvents.memberCreated(member.name, member.id)
        )

        // 7. Return the original credentials and member details.
        res.set('Cache-Control', 'no-store')

        return res.status(201).json({
          temporaryPassword,
          notificationId,
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
          error instanceof MemberRegistrationWorkflowError &&
          error.code === 'REGISTRATION_OUTCOME_UNCERTAIN' &&
          process.env.FITPULSE_REGISTRATION_DEBUG === '1'
        ) {
          const repositoryError = error.cause
          const databaseError = repositoryError?.cause
          console.error('FitPulse registration persistence diagnostic:', {
            workflowCode: error.code,
            repositoryCode: repositoryError?.code || null,
            databaseCode: databaseError?.code || null,
            databaseMessage: databaseError?.message || null,
            databaseDetails: databaseError?.details || null,
            databaseHint: databaseError?.hint || null
          })
        }

        if (
          error instanceof MemberRegistrationError ||
          error instanceof MemberRegistrationWorkflowError ||
          error instanceof BiometricError
        ) {
          return res.status(error.status).json({
            message: error.message, code: error.code, field: error.field
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
