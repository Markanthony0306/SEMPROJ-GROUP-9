import assert from 'node:assert/strict'
import { test } from 'node:test'
import { withMemberAccountLock } from '../server/lib/memberAccountLock.js'

test('same-member operations wait while another member can proceed', async () => {
  let release
  const held = new Promise((resolve) => { release = resolve })
  const events = []
  const renewal = withMemberAccountLock('first-member', async () => {
    events.push('renewal started')
    await held
    events.push('renewal finished')
  })
  const cleanup = withMemberAccountLock('first-member', () => events.push('cleanup started'))
  await withMemberAccountLock('second-member', () => events.push('other member'))
  assert.deepEqual(events, ['renewal started', 'other member'])
  release()
  await Promise.all([renewal, cleanup])
  assert.deepEqual(events, ['renewal started', 'other member', 'renewal finished', 'cleanup started'])
})

test('a failed operation releases the queue for the next operation', async () => {
  const failure = withMemberAccountLock('error-member', () => { throw new Error('Fixture failure') })
  const next = withMemberAccountLock('error-member', () => 'retry completed')
  await assert.rejects(failure, /Fixture failure/)
  assert.equal(await next, 'retry completed')
})
