// Isolated Express routes: no live accounts, Storage objects, or emails change.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import express from 'express'
import { accountRoutes } from '../server/routes/accounts.js'
import { deleteMemberAccount } from '../server/services/accountDeletion.js'

async function fixture(run) {
  const member = {
    id: 'member',
    authUserId: 'auth-member',
    email: 'member@fixture.test',
    name: 'Member',
    role: 'user',
    status: 'active'
  }
  const admin = {
    id: 'admin',
    authUserId: 'auth-admin',
    email: 'admin@fixture.test',
    role: 'admin'
  }
  const staff = {
    id: 'staff',
    authUserId: 'auth-staff',
    email: 'staff@fixture.test',
    role: 'staff'
  }
  const state = {
    accounts: new Map([member, admin, staff].map((account) => [account.id, account])),
    ready: true,
    checkError: null,
    storageError: null,
    authError: null,
    verifiedId: null,
    rpcCalls: [],
    removed: [],
    deleted: [],
    sent: [],
    mailFailure: false
  }
  const supabase = {
    rpc: async (name, values) => {
      state.rpcCalls.push({ name, values })
      return { data: state.ready, error: state.checkError }
    },
    storage: {
      from: (bucket) => {
        assert.equal(bucket, 'avatars')
        return {
          list: async (folder) => {
            assert.equal(folder, member.id)
            return { data: [{ name: 'profile.jpg' }], error: state.storageError }
          },
          remove: async (paths) => {
            state.removed.push(...paths)
            return { error: state.storageError }
          }
        }
      }
    },
    auth: {
      admin: {
        deleteUser: async (id) => {
          if (!state.authError) {
            state.deleted.push(id)
            state.accounts.delete(member.id)
          }
          return { error: state.authError }
        },
        generateLink: async () => ({
          data: { properties: { action_link: 'https://provider.fixture.test/reset' } }
        })
      }
    }
  }
  const createAuthClient = () => ({
    auth: {
      signInWithPassword: async ({ email, password }) => {
        const account = [...state.accounts.values()].find((item) => item.email === email)
        return password === 'Current-Password-123!'
          ? { data: { user: { id: state.verifiedId || account.authUserId } } }
          : { error: { code: 'invalid_credentials' } }
      }
    }
  })
  const app = express()
  app.use(express.json())
  app.use(
    '/api',
    accountRoutes({
      authenticate: (req, res, next) => {
        req.user = state.accounts.get(req.headers.authorization?.replace('Bearer ', ''))
        return req.user ? next() : res.status(401).json({ message: 'Unauthorized' })
      },
      requireRole:
        (...roles) =>
        (req, res, next) =>
          roles.includes(req.user.role) ? next() : res.status(403).json({}),
      rateLimit: () => (req, res, next) => next(),
      loadAccount: async (id) => state.accounts.get(id),
      supabase,
      createAuthClient,
      mailer: {
        sendMail: async (mail) => {
          if (state.mailFailure) return { accepted: [], rejected: [member.email] }
          state.sent.push(mail)
          return { accepted: [mail.to] }
        }
      },
      from: 'FitPulse <mail@fixture.test>',
      clientUrl: 'https://app.fixture.test'
    })
  )
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const request = async (actor = 'admin', route = '/admin/members/member', body = {}, method = 'DELETE') => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api${route}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${actor}` },
      body: JSON.stringify({
        confirmation: 'DELETE',
        currentPassword: 'Current-Password-123!',
        ...body
      })
    })
    return { status: response.status, body: await response.json() }
  }
  try {
    await run({ state, request, member, admin, staff, supabase })
  } finally {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
}

test('only an admin deletes a member and the deleted member loses session access', () =>
  fixture(async ({ state, request }) => {
    assert.equal((await request()).status, 200)
    assert.deepEqual(state.deleted, ['auth-member'])
    assert.deepEqual(state.removed, ['member/profile.jpg'])
    assert.equal((await request('member', '/profile')).status, 401)
    assert.equal((await request()).status, 404)
    assert.equal(state.accounts.size, 2)
  }))

test('self-deletion is denied without changing accounts, photos, or Auth', () =>
  fixture(async ({ state, request, member }) => {
    for (const role of ['user', 'member']) {
      member.role = role
      const denied = await request('member', '/profile')
      assert.equal(denied.status, 403)
      assert.match(denied.body.message, /Only an administrator/)
    }
    for (const actor of ['admin', 'staff'])
      assert.equal((await request(actor, '/profile')).status, 403)
    assert.equal((await request('unknown', '/profile')).status, 401)
    assert.equal(state.accounts.size, 3)
    assert.deepEqual(state.rpcCalls, [])
    assert.deepEqual(state.removed, [])
    assert.deepEqual(state.deleted, [])
  }))

test('admin can delete a member; staff and other members cannot', () =>
  fixture(async ({ state, request }) => {
    for (const actor of ['staff', 'member', 'unknown']) {
      assert.equal(
        (await request(actor, '/admin/members/member')).status,
        actor === 'unknown' ? 401 : 403
      )
    }
    assert.deepEqual(state.deleted, [])
    assert.equal((await request('admin', '/admin/members/member')).status, 200)
    assert.deepEqual(state.deleted, ['auth-member'])
  }))

test('confirmation, current password, and linked Auth identity are required', () =>
  fixture(async ({ state, request }) => {
    assert.equal((await request('admin', '/admin/members/member', { confirmation: 'delete' })).status, 400)
    assert.equal((await request('admin', '/admin/members/member', { currentPassword: '' })).status, 400)
    assert.equal((await request('admin', '/admin/members/member', { currentPassword: 'wrong' })).status, 401)
    state.verifiedId = 'some-other-login'
    assert.equal((await request()).status, 401)
    assert.deepEqual(state.rpcCalls, [])
    assert.deepEqual(state.removed, [])
  }))

test('staff/admin accounts and unlinked members cannot be deleted', () =>
  fixture(async ({ state, request, member }) => {
    assert.equal((await request('admin', '/admin/members/staff')).status, 403)
    assert.equal((await request('admin', '/admin/members/admin')).status, 403)
    member.authUserId = null
    assert.equal((await request('admin', '/admin/members/member')).status, 409)
    assert.deepEqual(state.deleted, [])
  }))

test('missing migration or changed account link stops before Storage and Auth', () =>
  fixture(async ({ state, request }) => {
    state.checkError = { code: 'PGRST202' }
    const missing = await request()
    assert.equal(missing.status, 503)
    assert.match(missing.body.message, /006_delete_member_accounts/)
    state.checkError = null
    state.ready = false
    assert.equal((await request()).status, 409)
    assert.deepEqual(state.removed, [])
    assert.deepEqual(state.deleted, [])
  }))

test('Storage failures preserve the login; Auth failures do not report success', () =>
  fixture(async ({ state, request }) => {
    state.storageError = { message: 'Storage unavailable' }
    assert.equal((await request()).status, 503)
    assert.deepEqual(state.deleted, [])
    state.storageError = null
    state.authError = { message: 'Database constraint failure' }
    assert.equal((await request()).status, 503)
    assert.ok(state.accounts.has('member'))
  }))

test('a renewed membership can stop scheduled deletion before photos change', () =>
  fixture(async ({ state, member, supabase }) => {
    await assert.rejects(
      deleteMemberAccount({
        supabase,
        account: member,
        beforeDelete: async (account) => {
          assert.equal(account.id, member.id)
          throw Object.assign(new Error('Membership was renewed.'), { status: 409 })
        }
      }),
      { status: 409 }
    )
    assert.deepEqual(state.removed, [])
    assert.deepEqual(state.deleted, [])
    assert.ok(state.accounts.has(member.id))
  }))

test('scheduled deletion rechecks a membership immediately before removing its login', () =>
  fixture(async ({ state, member, supabase }) => {
    await assert.rejects(
      deleteMemberAccount({
        supabase,
        account: member,
        beforeDelete: async () => {
          if (state.removed.length)
            throw Object.assign(new Error('Membership was renewed during cleanup.'), { status: 409 })
        }
      }),
      { status: 409 }
    )
    assert.deepEqual(state.removed, ['member/profile.jpg'])
    assert.deepEqual(state.deleted, [])
    assert.ok(state.accounts.has(member.id))
  }))

test('only gym staff can resend access; rejected email is a failure', () =>
  fixture(async ({ state, request }) => {
    assert.equal(
      (await request('member', '/admin/members/member/send-access', {}, 'POST')).status,
      403
    )
    assert.equal(
      (await request('staff', '/admin/members/member/send-access', {}, 'POST')).status,
      200
    )
    assert.equal(state.sent[0].to, 'member@fixture.test')
    assert.ok(!state.sent[0].text.includes('Temporary password'))
    state.mailFailure = true
    assert.equal(
      (await request('admin', '/admin/members/member/send-access', {}, 'POST')).status,
      503
    )
  }))
