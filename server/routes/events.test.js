import assert from 'node:assert/strict'
import { once } from 'node:events'
import test from 'node:test'
import express from 'express'
import { eventRoutes } from './events.js'
import { createSessionAuth } from '../middleware/sessionAuth.js'
import { createFitPulseEvents } from '../services/fitPulseEvents.js'
import { gorillaEvents } from '../../shared/gorillaEvents.js'
import { registerEquipmentRoutes } from './equipmentRoutes.js'
import { EQUIPMENT_CATEGORIES } from '../../shared/equipmentCategories.js'
import { MEMBER_TERMS_VERSION } from '../../shared/memberTerms.js'

// Use the actual session and SSE middleware with synthetic accounts and no database writes.
test('stream tickets are scoped and alerts are isolated by role and account', async () => {
  const jwtSecret = 'events-test-only'
  const accounts = Object.fromEntries(
    [
      ['admin-a', 'admin'],
      ['staff-a', 'staff'],
      ['member-a', 'user'],
      ['member-b', 'member']
    ].map(([id, role]) => [id, { id, role, status: 'active', authVersion: 0 }])
  )
  const { createSession, authenticate, authenticateEventStream } = createSessionAuth({
    jwtSecret,
    loadAccount: async (id) => accounts[id],
    membershipStatus: (account) => account.status
  })
  const events = createFitPulseEvents()
  const app = express()
  app.use('/api', eventRoutes({ authenticate, authenticateEventStream, events, jwtSecret }))
  app.get('/private', authenticate, (_req, res) => res.sendStatus(204))
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const base = `http://127.0.0.1:${server.address().port}`
  const stream = `${base}/api/events`
  const request = new AbortController()

  async function mint(account) {
    const { token } = createSession(account, ['user', 'member'].includes(account.role) ? MEMBER_TERMS_VERSION : undefined)
    const response = await fetch(`${stream}/ticket`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      signal: request.signal
    })
    assert.equal(response.status, 200)
    return { ...(await response.json()), token }
  }

  try {
    assert.equal((await fetch(stream)).status, 401)
    assert.equal((await fetch(`${stream}/ticket`, { method: 'POST' })).status, 401)
    const { ticket, token, expiresAt } = await mint(accounts['admin-a'])
    assert.ok(expiresAt <= Date.now() + 90_000)
    assert.equal((await fetch(`${stream}?ticket=${token}`)).status, 401)
    assert.equal(
      (await fetch(`${base}/private`, { headers: { Authorization: `Bearer ${ticket}` } })).status,
      401
    )

    const { ticket: rejected } = await mint(accounts['member-b'])
    accounts['member-b'].authVersion += 1
    assert.equal((await fetch(`${stream}?ticket=${rejected}`)).status, 401)

    const readers = await Promise.all(
      Object.values(accounts).map(async (account) => {
        const { ticket: key } = await mint(account)
        const response = await fetch(`${stream}?ticket=${key}`, { signal: request.signal })
        assert.equal(response.status, 200)
        assert.match(response.headers.get('content-type'), /^text\/event-stream/)
        return [account.id, response.body.getReader()]
      })
    )

    events.emitEvent(
      { to: 'admins' },
      gorillaEvents.memberCreated('Taylor Cruz', 'new-member')
    )
    events.emitEvent(
      { to: { userId: 'member-a' } },
      gorillaEvents.payment(null, 500, 'Cash')
    )
    for (const [id] of readers)
      events.emitEvent({ to: { userId: id } }, { type: 'info', title: 'End', message: 'Sentinel' })

    for (const [id, reader] of readers) {
      const decoder = new TextDecoder()
      let buffer = ''
      while (!buffer.includes('"title":"End"')) {
        const { value, done } = await reader.read()
        assert.equal(done, false)
        buffer += decoder.decode(value, { stream: true })
      }
      const alerts = buffer
        .split('\n')
        .filter((line) => line.startsWith('data: '))
        .map((line) => JSON.parse(line.slice(6)))
      assert.deepEqual(
        alerts.map((alert) => alert.title),
        id === 'member-a' ? ['Payment recorded', 'End']
          : id === 'member-b' ? ['End'] : ['New member created', 'End']
      )
      assert.deepEqual(alerts[0].target, id === 'member-a' ? { section: 'Payments' }
        : id === 'member-b' ? undefined : { section: 'Members', memberId: 'new-member' })
    }
  } finally {
    request.abort()
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
})

test('equipment routes announce saved changes once and skip a repeated condition', async () => {
  const handlers = {}
  const app = Object.fromEntries(
    ['get', 'post', 'patch'].map((method) => [
      method, (_path, ...callbacks) => { handlers[method] = callbacks.at(-1) }
    ])
  )
  let database = { equipment: [], maintenance: [] }
  const alerts = []
  registerEquipmentRoutes(app, {
    authenticate: () => {},
    requireRole: () => () => {},
    loadDatabase: async () => structuredClone(database),
    saveDatabase: async (saved) => { database = saved },
    emitEvent(recipient, alert) {
      assert.deepEqual(recipient, { to: 'admins' })
      assert.equal(database.equipment.length, 1)
      alerts.push(alert)
    }
  })
  const response = { status: () => response, json: (body) => body }
  const { equipment } = await handlers.post(
    { body: { name: 'Treadmill', category: EQUIPMENT_CATEGORIES[0] } }, response
  )
  const update = (body) => handlers.patch({ params: { id: equipment.id }, body }, response)
  await update({ condition: 'Needs Maintenance' })
  await update({ condition: 'Needs Maintenance' })
  await update({ inspected: true })
  assert.deepEqual(alerts, [
    gorillaEvents.equipmentAdded('Treadmill'),
    gorillaEvents.equipmentUpdated('Treadmill', 'condition changed to Needs Maintenance', 'warning'),
    gorillaEvents.equipmentUpdated('Treadmill', 'inspection completed')
  ])
})
