
import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'

import { membershipRenewalRoutes } from './membershipRenewal.js'
import { MembershipError } from '../services/MembershipService.js'

const MEMBER_ID = 'member-123'

// Create an isolated Express app for testing.
function createTestApp({
  authenticated = true,
  role = 'admin',
  workflowError = null
} = {}) {
  const calls = {
    workflow: 0,
    database: 0
  }

  const app = express()
  app.use(express.json())

  const sampleMember = {
    id: MEMBER_ID,
    name: 'Test Member',
    role: 'user',
    plan: 'Monthly',
    status: 'active',
    membershipStart: '2026-11-01T10:00:00.000Z',
    membershipEnd: '2026-12-01T10:00:00.000Z',
    subscriptionId: 'original-subscription'
  }

  app.use('/api', membershipRenewalRoutes({

    // Simulated authentication
    authenticate(req, res, next) {
      if (!authenticated) {
        return res.status(401).json({
          message: 'Authentication is required.'
        })
      }

      req.user = { id: 'admin-1', role }
      next()
    },

    // Simulated role authorization
    requireRole: (...roles) => (req, res, next) =>
      roles.includes(req.user.role)
        ? next()
        : res.status(403).json({
            message: 'You do not have permission for this resource.'
          }),

    // Fake database data
    async loadDatabase() {
      calls.database++

      return {
        accounts: [{ ...sampleMember }],

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

    // Execute without acquiring a real account lock
    withMemberAccountLock: (_id, operation) => operation(),

    availablePlan: (plan, name) =>
      plan.is_active &&
      plan.plan_name.toLowerCase() === String(name).toLowerCase(),

    paymentMethod: (body) => {
      if (body.method === undefined) return 'Cash'

      const value =
        typeof body.method === 'string'
          ? body.method.trim().toLowerCase()
          : ''

      if (value === 'cash') return 'Cash'
      if (value === 'gcash') return 'GCash'

      return null
    },

    publicAccount: (member) => member,

    // Fake renewal workflow
    workflow: {
      async execute(input) {
        calls.workflow++

        if (workflowError) {
          throw workflowError
        }

        return {
          member: {
            ...input.member,
            membershipEnd: '2026-12-31T10:00:00.000Z'
          },

          payment: {
            id: 'payment-1',
            amount: input.paymentDetails.amount,
            method: input.paymentDetails.method
          }
        }
      }
    }
  }))

  // Simulate the existing global Express error handler
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error)

    return res.status(500).json({
      message: 'Something went wrong. Please try again.'
    })
  })

  return { app, calls }
}

// Send a real HTTP request to the isolated local test app.
async function postRenewal(
  app,
  body = { plan: 'Monthly', method: 'Cash', amount: 600 }
) {
  const server = app.listen(0, '127.0.0.1')

  try {
    await new Promise((resolve, reject) => {
      server.once('listening', resolve)
      server.once('error', reject)
    })

    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/admin/members/${MEMBER_ID}/renew`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    )

    return {
      status: response.status,
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

// TEST 1
test('successful renewal returns HTTP 200 and payment', async () => {
  const { app, calls } = createTestApp()
  const response = await postRenewal(app)

  assert.equal(response.status, 200)
  assert.equal(response.body.payment.amount, 600)
  assert.equal(response.body.member.id, MEMBER_ID)
  assert.equal(calls.workflow, 1)
})

// TEST 2
test('missing authentication returns 401 before database access', async () => {
  const { app, calls } = createTestApp({
    authenticated: false
  })

  const response = await postRenewal(app)

  assert.equal(response.status, 401)
  assert.equal(calls.database, 0)
  assert.equal(calls.workflow, 0)
})

// TEST 3
test('member role cannot use admin renewal endpoint', async () => {
  const { app, calls } = createTestApp({
    role: 'member'
  })

  const response = await postRenewal(app)

  assert.equal(response.status, 403)
  assert.equal(calls.workflow, 0)
})

// TEST 4
test('invalid payment amount returns 400 without saving', async () => {
  const { app, calls } = createTestApp()

  const response = await postRenewal(app, {
    plan: 'Monthly',
    method: 'Cash',
    amount: -50
  })

  assert.equal(response.status, 400)
  assert.equal(calls.workflow, 0)
})

// TEST 5
test('concurrent renewal produces HTTP 409', async () => {
  const error = new Error('Simulated conflict')
  error.code = 'MEMBERSHIP_RENEWAL_CONFLICT'

  const { app } = createTestApp({
    workflowError: error
  })

  const response = await postRenewal(app)

  assert.equal(response.status, 409)
  assert.match(
    response.body.message,
    /Refresh and try again/i
  )
})

// TEST 6
test('known membership validation error produces HTTP 400', async () => {
  const error = new MembershipError(
    'INVALID_PAYMENT_AMOUNT',
    'Invalid payment amount.'
  )

  const { app } = createTestApp({
    workflowError: error
  })

  const response = await postRenewal(app)

  assert.equal(response.status, 400)
  assert.equal(
    response.body.message,
    'Invalid payment amount.'
  )
})

// TEST 7
test('unexpected repository failure returns generic HTTP 500', async () => {
  const { app } = createTestApp({
    workflowError: new Error('Sensitive internal SQL details')
  })

  const response = await postRenewal(app)

  assert.equal(response.status, 500)

  assert.equal(
    response.body.message,
    'Something went wrong. Please try again.'
  )

  assert.doesNotMatch(
    JSON.stringify(response.body),
    /Sensitive internal SQL details/
  )
})
