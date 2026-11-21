import assert from 'node:assert/strict'
import test from 'node:test'
import { startRockyMembershipAlerts } from './rockyMembershipAlerts.js'
import { createFitPulseEvents } from './fitPulseEvents.js'

test('membership alerts run on the server timer without email and publish each expiry once', async () => {
  const member = {
    id: 'mia', name: 'Mia Cruz', role: 'user', status: 'active', subscriptionId: 'monthly',
    membershipStart: '2026-11-01T00:00:00.000Z', membershipEnd: '2026-12-01T00:00:00.000Z'
  }
  let time = Date.parse('2026-11-24T00:00:00.000Z')
  let tick
  const events = []
  const stop = startRockyMembershipAlerts({
    loadDatabase: async () => ({ accounts: [member], settings: { remind: 7, emailOn: false } }),
    emitEvent: async (audience, event, id, durableOnly) => events.push({ audience, event, id, durableOnly }),
    now: () => time,
    setTimer(check, delay) { assert.equal(delay, 300_000); tick = check },
    clearTimer() { tick = null }
  })
  try {
    await new Promise((resolve) => setImmediate(resolve))
    assert.deepEqual(events.map(({ event }) => event.title), ['Membership expiring'])
    assert.equal(events[0].event.target.memberId, member.id)
    time = Date.parse(member.membershipEnd) - 3 * 86_400_000
    await tick()
    assert.deepEqual(events[1].audience, { to: { userId: member.id } })
    assert.equal(events[1].event.message, 'Your membership expires in 3 days.')
    assert.deepEqual(events[1].event.target, { section: 'Membership' })
    await tick()
    assert.equal(events.length, 2)
    time = Date.parse(member.membershipEnd)
    await tick()
    assert.deepEqual(events.slice(2).map(({ event }) => event.title), ['Membership expired', 'Membership expired'])
    assert.equal(new Set(events.map(({ id }) => id)).size, 4)
    assert.ok(events.every(({ durableOnly }) => durableOnly))
  } finally {
    stop()
  }
  assert.equal(tick, null)
})

test('persisted Rocky events broadcast only to their recipient and replay deduplication prevents a second popup', async () => {
  const saved = new Set()
  const supabase = { rpc: async (name, values) => {
    assert.equal(name, 'insert_rocky_notification')
    assert.equal(values.p_staff, false)
    assert.equal(values.p_user, 'mia')
    if (saved.has(values.p_id)) return { data: null }
    saved.add(values.p_id)
    return { data: '2026-11-18T08:00:00.000Z' }
  } }
  const events = createFitPulseEvents(supabase)
  const listener = { once() {}, write: () => { assert.fail('Wrong account received the notification') } }
  const frames = []
  events.subscribe({ id: 'other', role: 'user' }, listener)
  events.subscribe({ id: 'admin', role: 'admin' }, listener)
  events.subscribe({ id: 'mia', role: 'user' }, { once() {}, write: (frame) => frames.push(frame) })
  const alert = { type: 'warning', title: 'Membership expired', message: 'Your FitPulse membership expired.' }
  await events.emitEvent({ to: { userId: 'mia' } }, alert, 'stable-key', true)
  await events.emitEvent({ to: { userId: 'mia' } }, alert, 'stable-key', true)
  assert.equal(frames.length, 1)
  assert.match(frames[0], /Membership expired/)
})
