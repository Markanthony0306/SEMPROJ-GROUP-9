
import test from 'node:test'
import assert from 'node:assert/strict'
import { Membership } from './Membership.js'

const NOW = Date.parse('2026-11-11T10:00:00.000Z')

function makeMember(overrides = {}) {
  return {
    id: 'member-1',
    role: 'user',
    status: 'active',
    joined: '2026-11-01T10:00:00.000Z',
    membershipStart: '2026-11-01T10:00:00.000Z',
    membershipEnd: '2026-12-01T10:00:00.000Z',
    ...overrides
  }
}

test('returns active for a current membership', () => {
  const membership = new Membership(makeMember())
  assert.equal(membership.getStatus(new Date(NOW)), 'active')
})

test('returns expired for an expired membership', () => {
  const membership = new Membership(makeMember({
    membershipEnd: '2026-11-10T10:00:00.000Z'
  }))
  assert.equal(membership.getStatus(new Date(NOW)), 'expired')
})

test('preserves inactive account status', () => {
  const membership = new Membership(makeMember({ status: 'inactive' }))
  assert.equal(membership.getStatus(new Date(NOW)), 'inactive')
})

test('rejects an admin account from member check-in', () => {
  const membership = new Membership(makeMember({ role: 'admin' }))
  assert.equal(membership.getCheckInFailure(NOW), 'MEMBER_NOT_FOUND')
})

test('rejects inactive members', () => {
  const membership = new Membership(makeMember({ status: 'inactive' }))
  assert.equal(membership.getCheckInFailure(NOW), 'MEMBERSHIP_INACTIVE')
})

test('rejects missing membership dates', () => {
  const membership = new Membership(makeMember({ membershipEnd: null }))
  assert.equal(membership.getCheckInFailure(NOW), 'MEMBERSHIP_DATES_MISSING')
})

test('rejects memberships that have not started', () => {
  const membership = new Membership(makeMember({
    membershipStart: '2026-11-12T10:00:00.000Z'
  }))
  assert.equal(membership.getCheckInFailure(NOW), 'MEMBERSHIP_NOT_STARTED')
})

test('rejects expired memberships during check-in', () => {
  const membership = new Membership(makeMember({
    membershipEnd: '2026-11-11T09:59:59.999Z'
  }))
  assert.equal(membership.getCheckInFailure(NOW), 'MEMBERSHIP_EXPIRED')
})

test('accepts valid memberships during check-in', () => {
  const membership = new Membership(makeMember())
  assert.equal(membership.getCheckInFailure(NOW), '')
})

test('adds the requested number of days', () => {
  assert.equal(
    Membership.addDays('2026-11-11T10:00:00.000Z', 7),
    '2026-11-18T10:00:00.000Z'
  )
})
