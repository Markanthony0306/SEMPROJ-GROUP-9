
import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'

import { memberRoutes } from './members.js'

// Create an isolated Express application for testing.
function createTestApp({
  authenticated = true,
  role = 'admin',
  databaseFailure = false
} = {}) {
  const app = express()

  let databaseCalls = 0

  const accounts = [
    {
      id: 'member-1',
      name: 'Older Member',
      role: 'user',
      status: 'active',
      memberCode: 'FP-001',
      joined: '2026-01-01T00:00:00.000Z',
      authUserId: 'private-auth-id'
    },
    {
      id: 'member-2',
      name: 'Newer Member',
      role: 'user',
      status: 'active',
      memberCode: 'FP-002',
      joined: '2026-11-01T00:00:00.000Z',
      authUserId: 'another-private-id'
    }
  ]

  app.use('/api', memberRoutes({

    authenticate(req, res, next) {
      if (!authenticated) {
        return res.status(401).json({
          message: 'Authentication is required.'
        })
      }

      req.user = { id: 'admin-1', role }
      next()
    },

    requireRole: (...allowedRoles) => (req, res, next) => {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          message: 'Access denied.'
        })
      }

      next()
    },

    async loadDatabase() {
      databaseCalls++

      if (databaseFailure) {
        throw new Error('Simulated Supabase failure')
      }

      return { accounts }
    },

    publicAccount(account) {
      const { authUserId, ...safeAccount } = account
      return safeAccount
    }
  }))

  return {
    app,
    accounts,
    getDatabaseCalls: () => databaseCalls
  }
}

// Send an HTTP request to the isolated test server.
async function getMembers(app) {
  const server = app.listen(0, '127.0.0.1')

  try {
    await new Promise((resolve, reject) => {
      server.once('listening', resolve)
      server.once('error', reject)
    })

    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/members`
    )

    return {
      status: response.status,
      body: await response.json()
    }
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  }
}

// TEST 1: Members are retrieved and sorted correctly.
test('returns members sorted by newest first', async () => {
  const { app } = createTestApp()

  const response = await getMembers(app)

  assert.equal(response.status, 200)
  assert.equal(response.body.members.length, 2)

  assert.equal(response.body.members[0].id, 'member-2')
  assert.equal(response.body.members[1].id, 'member-1')
})

// TEST 2: Internal authentication data must not be exposed.
test('does not expose private authentication fields', async () => {
  const { app } = createTestApp()

  const response = await getMembers(app)

  assert.equal(response.status, 200)

  for (const member of response.body.members) {
    assert.equal(member.authUserId, undefined)
    assert.ok(member.memberCode)
    assert.ok(member.createdAt)
  }
})

// TEST 3: Unauthenticated requests are rejected.
test('rejects unauthenticated requests', async () => {
  const { app, getDatabaseCalls } = createTestApp({
    authenticated: false
  })

  const response = await getMembers(app)

  assert.equal(response.status, 401)
  assert.equal(getDatabaseCalls(), 0)
})

// TEST 4: Members cannot access the admin member list.
test('rejects users without admin permissions', async () => {
  const { app, getDatabaseCalls } = createTestApp({
    role: 'member'
  })

  const response = await getMembers(app)

  assert.equal(response.status, 403)
  assert.equal(getDatabaseCalls(), 0)
})

// TEST 5: Database failures are handled.
test('returns HTTP 500 when database loading fails', async () => {
  const { app } = createTestApp({
    databaseFailure: true
  })

  const response = await getMembers(app)

  assert.equal(response.status, 500)
  assert.equal(
    response.body.message,
    'Unable to load members.'
  )
})

// TEST 6: Sorting does not modify the original accounts array.
test('does not modify the original accounts order', async () => {
  const { app, accounts } = createTestApp()

  await getMembers(app)

  assert.equal(accounts[0].id, 'member-1')
  assert.equal(accounts[1].id, 'member-2')
})
