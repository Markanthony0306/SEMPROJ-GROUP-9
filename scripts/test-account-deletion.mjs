// Isolated Express routes: no live accounts, Storage objects, or emails change.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import express from 'express'
import { accountRoutes } from '../server/routes/accounts.js'
import { deleteMemberAccount } from '../server/services/accountDeletion.js'

async function fixture(run) {
  const member = {
    id: '11111111-1111-4111-8111-111111111111',
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
    id: '22222222-2222-4222-8222-222222222222',
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
    audit: new Map(),
    photos: true,
    auditError: null,
    rpcCalls: [],
    removed: [],
    deleted: [],
    sent: [],
    mailFailure: false
  }
  const supabase = {
    rpc: async (name, values) => {
      state.rpcCalls.push({ name, values })
      if (name !== 'delete_fitpulse_member_account')
        return { data: state.ready, error: state.checkError }

      assert.equal(values.p_actor_id, admin.id)
      assert.equal(values.p_actor_auth_version, 0)
      if (state.checkError) return { error: state.checkError }
      if (state.audit.has(values.p_member_id)) return { data: true }
      const target = state.accounts.get(values.p_member_id)
      if (!target) return { error: { code: 'P0002' } }
      if (target.role !== 'user') return { error: { code: '42501' } }
      if (!target.authUserId || !state.ready) return { error: { code: '23514' } }
      if (state.authError || state.auditError) return { error: state.authError || state.auditError }
      state.deleted.push(target.authUserId)
      state.accounts.delete(target.id)
      state.audit.set(target.id, {
        member_id: target.id,
        deleted_by: values.p_actor_id,
        deleted_at: new Date().toISOString(),
        photos_cleaned_at: null
      })
      return { data: true }
    },
    from(table) {
      assert.equal(table, 'member_account_deletion_audit')
      return {
        select() { return this },
        eq(column, id) {
          assert.equal(column, 'member_id')
          this.entry = state.audit.get(id)
          if (this.changes) Object.assign(this.entry, this.changes)
          return this
        },
        single() { return { data: this.entry } },
        update(changes) {
          this.changes = changes
          return this
        }
      }
    },
    storage: {
      from: (bucket) => {
        assert.equal(bucket, 'avatars')
        return {
          list: async (folder) => {
            assert.equal(folder, member.id)
            return { data: state.photos ? [{ name: 'profile.jpg' }] : [], error: state.storageError }
          },
          remove: async (paths) => {
            state.removed.push(...paths)
            if (!state.storageError) state.photos = false
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
  const app = express()
  app.use(express.json())
  app.use(
    '/api',
    accountRoutes({
      authenticate: (req, res, next, status = 401) => {
        const id = req.headers.authorization?.replace('Bearer ', '')
        req.user = state.accounts.get(id === 'member' ? member.id : id === 'staff' ? staff.id : id)
        return req.user ? next() : res.status(status).json({ message: 'Unauthorized' })
      },
      requireRole:
        (...roles) =>
        (req, res, next) =>
          roles.includes(req.user.role) ? next() : res.status(403).json({}),
      rateLimit: () => (req, res, next) => next(),
      loadAccount: async (id) => state.accounts.get(id),
      supabase,
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
  const request = async (actor = 'admin', route = '/admin/members/' + member.id, body = {}, method = 'DELETE') => {
    const path = route === '/admin/members/member' ? '/admin/members/' + member.id : route
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${actor}` },
      body: JSON.stringify({
        confirmation: 'DELETE',
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
  fixture(async ({ state, request, member }) => {
    assert.deepEqual(await request(), { status: 200, body: { message: 'Member account deleted.' } })
    assert.deepEqual(state.deleted, ['auth-member'])
    assert.deepEqual(state.removed, [member.id + '/profile.jpg'])
    assert.equal((await request('member', '/profile')).status, 401)
    const entry = state.audit.get(member.id)
    assert.equal(entry.deleted_by, 'admin')
    assert.ok(entry.deleted_at)
    assert.ok(entry.photos_cleaned_at)
    assert.equal((await request()).status, 200)
    assert.deepEqual(state.deleted, ['auth-member'])
    assert.deepEqual(state.removed, [member.id + '/profile.jpg'])
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
        403
      )
    }
    assert.deepEqual(state.deleted, [])
    assert.equal((await request('admin', '/admin/members/member')).status, 200)
    assert.deepEqual(state.deleted, ['auth-member'])
  }))

test('only exact case-sensitive confirmation after trimming is accepted', () =>
  fixture(async ({ state, request }) => {
    for (const confirmation of ['delete', 'DELETE!', '', null, ['DELETE']])
      assert.equal((await request('admin', '/admin/members/member', { confirmation })).status, 400)
    assert.deepEqual(state.rpcCalls, [])
    assert.deepEqual(state.removed, [])
    assert.equal((await request('admin', '/admin/members/member', { confirmation: '  DELETE  ' })).status, 200)
  }))

test('self-deletion, staff targets, and unlinked members are blocked before photo cleanup', () =>
  fixture(async ({ state, request, member, admin, staff }) => {
    assert.equal((await request('admin', '/admin/members/' + admin.id)).status, 403)
    assert.deepEqual(state.rpcCalls, [])
    assert.equal((await request('admin', '/admin/members/' + staff.id)).status, 403)
    member.authUserId = null
    assert.equal((await request()).status, 409)
    assert.deepEqual(state.deleted, [])
    assert.deepEqual(state.removed, [])
  }))

test('the database can reject a stale administrator session', () =>
  fixture(async ({ state, request }) => {
    state.checkError = { code: '42501' }
    assert.equal((await request()).status, 403)
    assert.deepEqual(state.removed, [])
    assert.equal(state.audit.size, 0)
  }))

test('missing migration or changed account link stops before Storage', () =>
  fixture(async ({ state, request }) => {
    state.checkError = { code: 'PGRST202' }
    const missing = await request()
    assert.equal(missing.status, 503)
    assert.match(missing.body.message, /migration 015/)
    state.checkError = null
    state.ready = false
    assert.equal((await request()).status, 409)
    assert.deepEqual(state.removed, [])
    assert.deepEqual(state.deleted, [])
  }))

test('database or audit failure leaves the account and photos intact', () =>
  fixture(async ({ state, request, member }) => {
    state.authError = { code: 'XX001', message: 'Private Auth error detail' }
    const response = await request()
    assert.equal(response.status, 503)
    assert.doesNotMatch(response.body.message, /Private Auth error/)
    state.authError = null
    state.auditError = { code: 'XX001' }
    assert.equal((await request()).status, 503)
    assert.ok(state.accounts.has(member.id))
    assert.equal(state.audit.size, 0)
    assert.deepEqual(state.removed, [])
  }))

test('a retry after a Storage failure completes cleanup without deleting twice', () =>
  fixture(async ({ state, request, member }) => {
    state.storageError = { code: 'STORAGE_UNAVAILABLE' }
    const response = await request()
    assert.equal(response.status, 503)
    assert.match(response.body.message, /Photo cleanup is pending/)
    assert.equal(state.accounts.has(member.id), false)
    assert.equal(state.audit.get(member.id).photos_cleaned_at, null)

    state.storageError = null
    assert.equal((await request()).status, 200)
    assert.ok(state.audit.get(member.id).photos_cleaned_at)
    assert.deepEqual(state.deleted, ['auth-member'])
    assert.deepEqual(state.removed, [member.id + '/profile.jpg'])
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
    assert.deepEqual(state.removed, [member.id + '/profile.jpg'])
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
