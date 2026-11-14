
import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'

import { memberRegistrationRoutes } from './memberRegistration.js'
import { MemberRegistrationService } from '../services/MemberRegistrationService.js'
import { MemberRegistrationWorkflowError } from '../services/MemberRegistrationWorkflow.js'

const ACTOR_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const AUTH_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const MEMBER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const SUBSCRIPTION_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'

const DATE = '2026-11-12T10:00:00.000Z'
const END_DATE = '2026-12-12T10:00:00.000Z'
const TEMP_PASSWORD = 'TestTemporary!456'

// Create an isolated Express application for testing.
function createTestApp(options = {}) {
  const calls = {
    databaseLoads: 0,
    profileLookups: 0,
    workflowCalls: []
  }

  // Test version of the existing account input validator.
  const validAccountInput = (body) => {
    const name =
      typeof body.name === 'string' ? body.name.trim() : ''

    const email =
      typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : ''

    const plan =
      typeof body.plan === 'string' ? body.plan.trim() : ''

    if (!name || !email || !plan) {
      return { error: 'Complete all required fields.' }
    }

    return {
      name,
      email,
      plan,
      phone:
        typeof body.phone === 'string' ? body.phone.trim() : ''
    }
  }

  // Test version of the payment method helper.
  const paymentMethod = (body) => {
    if (body.method === undefined) return 'Cash'

    const method =
      typeof body.method === 'string'
        ? body.method.trim().toLowerCase()
        : ''

    if (method === 'cash') return 'Cash'
    if (method === 'gcash') return 'GCash'

    return null
  }

  const availablePlan = (plan, name) =>
    plan.is_active &&
    plan.plan_name.toLowerCase() === name.toLowerCase()

  // Use the REAL registration service with test dependencies.
  const registrationService = new MemberRegistrationService({
    validAccountInput,
    paymentMethod,
    availablePlan
  })

  // Fake Supabase client.
  // It supports only the profile lookup this route performs.
  const supabase = {
    from(table) {
      assert.equal(table, 'users')

      return {
        select(columns) {
          assert.equal(columns, 'id')

          return {
            eq(field, value) {
              assert.equal(field, 'email')
              assert.equal(value, 'mia@example.test')

              return {
                async maybeSingle() {
                  calls.profileLookups++

                  return {
                    data: options.duplicateProfile
                      ? { id: 'already-exists' }
                      : null,

                    error: options.lookupError
                      ? { message: 'Simulated query failure' }
                      : null
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // Fake registration workflow.
  const registrationWorkflow = {
    async execute(input) {
      calls.workflowCalls.push(input)

      if (options.workflowError) {
        throw options.workflowError
      }

      return {
        authUserId: AUTH_ID,
        temporaryPassword: TEMP_PASSWORD,

        persisted: {
          member_id: MEMBER_ID,
          member_code: 'FP-TEST1234',
          subscription_id: SUBSCRIPTION_ID,

          payment_id: input.prepared.recordPayment
            ? 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
            : null,

          plan_id: 2,
          plan_name: 'Monthly',
          start_date: DATE,
          end_date: END_DATE,
          created_at: DATE,

          amount: input.prepared.recordPayment ? 600 : null
        }
      }
    }
  }

  const app = express()
  app.use(express.json())

  app.use('/api', memberRegistrationRoutes({

    // Fake authentication.
    authenticate(req, res, next) {
      if (options.authenticated === false) {
        return res.status(401).json({
          message: 'Authentication is required.'
        })
      }

      req.user = {
        id: ACTOR_ID,
        role: options.role || 'admin'
      }

      next()
    },

    // Fake authorization.
    requireRole: (...roles) => (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          message: 'Access denied.'
        })
      }

      next()
    },

    // Fake database loader.
    async loadDatabase(sections) {
      calls.databaseLoads++

      assert.deepEqual(sections, ['accounts', 'payments'])

      return {
        accounts: options.duplicateLoadedEmail
          ? [{
              id: 'member-old',
              email: 'MIA@example.test'
            }]
          : [],

        payments: [],

        membershipPlans: [{
          plan_id: 2,
          plan_name: 'Monthly',
          duration_days: 30,
          price: 600,
          is_active: true
        }],

        paymentMethods: [
          { method_name: 'Cash' },
          { method_name: 'GCash' }
        ]
      }
    },

    supabase,
    validAccountInput,
    paymentMethod,
    registrationService,
    registrationWorkflow,

    // Simulate the existing public-account formatter.
    publicAccount(member) {
      const {
        authUserId,
        authVersion,
        subscriptionId,
        subscriptionCreatedAt,
        planId,
        ...safe
      } = member

      return safe
    }
  }))

  return { app, calls }
}

// Send a real HTTP request to a temporary local test server.
async function postRegistration(app, overrides = {}) {
  const server = app.listen(0, '127.0.0.1')

  try {
    await new Promise((resolve, reject) => {
      server.once('listening', resolve)
      server.once('error', reject)
    })

    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/admin/members`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          name: 'Mia Cruz',
          email: 'mia@example.test',
          plan: 'Monthly',
          recordPayment: false,
          ...overrides
        })
      }
    )

    return {
      status: response.status,
      headers: response.headers,
      body: await response.json()
    }

  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) =>
        error ? reject(error) : resolve()
      )
    )
  }
}

// TEST 1: Successful registration without payment.
test('returns HTTP 201 and a temporary password without exposing internal fields', async () => {
  const { app, calls } = createTestApp()
  const response = await postRegistration(app)

  assert.equal(response.status, 201)
  assert.equal(response.body.temporaryPassword, TEMP_PASSWORD)
  assert.equal(response.body.message, 'Member account created.')
  assert.equal(response.headers.get('cache-control'), 'no-store')

  assert.equal(response.body.member.id, MEMBER_ID)
  assert.equal(response.body.member.memberCode, 'FP-TEST1234')
  assert.equal(response.body.member.mustChangePassword, true)
  assert.equal(response.body.member.accountStatus, 'active')
  assert.equal(response.body.member.createdAt, DATE)
  assert.equal(response.body.member.membershipEnd, END_DATE)

  assert.equal(response.body.member.authUserId, undefined)
  assert.equal(response.body.member.subscriptionId, undefined)

  assert.equal(calls.workflowCalls.length, 1)
  assert.equal(calls.workflowCalls[0].actorId, ACTOR_ID)
  assert.equal(calls.workflowCalls[0].prepared.recordPayment, false)
})

// TEST 2: Registration with GCash payment.
test('sends a GCash payment request to the workflow', async () => {
  const { app, calls } = createTestApp()

  const response = await postRegistration(app, {
    recordPayment: true,
    method: 'gcash'
  })

  assert.equal(response.status, 201)
  assert.equal(calls.workflowCalls.length, 1)

  const prepared = calls.workflowCalls[0].prepared

  assert.equal(prepared.recordPayment, true)
  assert.equal(prepared.method, 'GCash')
  assert.equal(prepared.planRecord.plan_id, 2)
})

// TEST 3: Authentication protection.
test('rejects unauthenticated registration before database access', async () => {
  const { app, calls } = createTestApp({
    authenticated: false
  })

  const response = await postRegistration(app)

  assert.equal(response.status, 401)
  assert.equal(calls.databaseLoads, 0)
  assert.equal(calls.workflowCalls.length, 0)
})

// TEST 4: Authorization protection.
test('rejects staff registration without admin permission', async () => {
  const { app, calls } = createTestApp({
    role: 'staff'
  })

  const response = await postRegistration(app)

  assert.equal(response.status, 403)
  assert.equal(calls.databaseLoads, 0)
  assert.equal(calls.workflowCalls.length, 0)
})

// TEST 5: Required input validation.
test('rejects missing name before loading the database', async () => {
  const { app, calls } = createTestApp()

  const response = await postRegistration(app, {
    name: ''
  })

  assert.equal(response.status, 400)
  assert.equal(calls.databaseLoads, 0)
  assert.equal(calls.workflowCalls.length, 0)
})

// TEST 6: Payment method validation.
test('rejects unsupported recorded payment methods', async () => {
  const { app, calls } = createTestApp()

  const response = await postRegistration(app, {
    recordPayment: true,
    method: 'Card'
  })

  assert.equal(response.status, 400)
  assert.equal(calls.databaseLoads, 0)
  assert.equal(calls.workflowCalls.length, 0)
})

// TEST 7: Membership plan validation.
test('rejects unavailable membership plans', async () => {
  const { app, calls } = createTestApp()

  const response = await postRegistration(app, {
    plan: 'Unknown'
  })

  assert.equal(response.status, 400)
  assert.equal(calls.workflowCalls.length, 0)
})

// TEST 8: Duplicate email in loaded accounts.
test('rejects duplicate emails in loaded accounts', async () => {
  const { app, calls } = createTestApp({
    duplicateLoadedEmail: true
  })

  const response = await postRegistration(app)

  assert.equal(response.status, 409)
  assert.equal(calls.profileLookups, 0)
  assert.equal(calls.workflowCalls.length, 0)
})

// TEST 9: Duplicate email in Supabase.
test('rejects duplicate emails found directly in Supabase', async () => {
  const { app, calls } = createTestApp({
    duplicateProfile: true
  })

  const response = await postRegistration(app)

  assert.equal(response.status, 409)
  assert.equal(calls.workflowCalls.length, 0)
})

// TEST 10: Supabase lookup failure.
test('does not call the workflow if profile lookup fails', async () => {
  const { app, calls } = createTestApp({
    lookupError: true
  })

  const response = await postRegistration(app)

  assert.equal(response.status, 500)

  assert.equal(
    response.body.message,
    'Unable to check the member account.'
  )

  assert.equal(calls.workflowCalls.length, 0)
})

// TEST 11: Confirmed registration conflict.
test('returns HTTP 409 for a confirmed registration conflict', async () => {
  const { app } = createTestApp({
    workflowError: new MemberRegistrationWorkflowError(
      'REGISTRATION_CONFLICT',
      'A member account with conflicting details already exists.',
      { status: 409 }
    )
  })

  const response = await postRegistration(app)

  assert.equal(response.status, 409)
  assert.match(response.body.message, /conflicting details/)
})

// TEST 12: Uncertain registration result.
test('returns HTTP 503 when registration outcome is uncertain', async () => {
  const { app } = createTestApp({
    workflowError: new MemberRegistrationWorkflowError(
      'REGISTRATION_OUTCOME_UNCERTAIN',
      'Registration could not be confirmed. Check the member profile and Auth account before retrying.',
      { status: 503 }
    )
  })

  const response = await postRegistration(app)

  assert.equal(response.status, 503)
  assert.match(response.body.message, /before retrying/)
})

// TEST 13: Unexpected internal error.
test('hides unexpected internal errors from the client', async () => {
  const { app } = createTestApp({
    workflowError: new Error('Secret SQL connection information')
  })

  const response = await postRegistration(app)

  assert.equal(response.status, 500)

  assert.equal(
    response.body.message,
    'Unable to create the member account.'
  )

  assert.doesNotMatch(
    JSON.stringify(response.body),
    /Secret SQL connection information/
  )
})
