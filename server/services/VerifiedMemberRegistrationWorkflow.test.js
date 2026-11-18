import assert from 'node:assert/strict'
import test from 'node:test'
import { VerifiedMemberRegistrationWorkflow } from './VerifiedMemberRegistrationWorkflow.js'
import { MemberIdError } from './memberIdRecords.js'

// Only a confirmed rejection releases the email automatically.
test('verified registration cleans up only on confirmed rejection', async () => {
  const actor = { id: 'admin-a', role: 'admin' }
  const input = { name: 'Test Member', email: 'member@example.test' }
  const verificationId = '11111111-1111-4111-8111-111111111111'
  const proof = {
    id: verificationId,
    has_documents: true,
    face_enrolled: true,
    document_passed: true,
    verification_status: 'awaiting_face',
    opened_by: actor.id,
    applicant_name: input.name,
    applicant_email: input.email
  }
  const deleted = []
  let registrationError = new MemberIdError(409, 'Enrollment was rejected.')
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: proof }) }
  const workflow = new VerifiedMemberRegistrationWorkflow({
    repository: {
      supabase: { from: () => query },
      register: async () => {
        throw registrationError
      }
    },
    authAdmin: {
      createUser: async () => ({ data: { user: { id: 'new-auth-user' } } }),
      deleteUser: async (id) => {
        deleted.push(id)
        return {}
      }
    },
    generateTemporaryPassword: () => 'fixture-password'
  })
  const execute = () => workflow.execute({ actor, prepared: { input }, verificationId })
  await assert.rejects(execute, (error) => error === registrationError)
  assert.deepEqual(deleted, ['new-auth-user'])
  registrationError = new Error('Connection lost')
  await assert.rejects(execute, { code: 'ENROLLMENT_OUTCOME_UNCERTAIN' })
  assert.deepEqual(deleted, ['new-auth-user'])
})
