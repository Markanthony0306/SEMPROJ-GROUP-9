import test from 'node:test'
import assert from 'node:assert/strict'
import { PasswordRecoveryService, invalidResetMessage } from './PasswordRecoveryService.js'
import { PasswordRecoveryWorkflow } from './PasswordRecoveryWorkflow.js'
import { PasswordRecoveryRepository } from '../repositories/PasswordRecoveryRepository.js'

const profile = { id: 'member-1', email: 'member@example.com', status: 'active', auth_user_id: 'auth-1' }
const body = { password: 'a-new-password', confirmPassword: 'a-new-password' }

function fixture({ account = profile, mailError, authError } = {}) {
  let saved
  let link
  const updates = []
  const service = new PasswordRecoveryService({
    emailPattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
    passwordPolicy: (password) => password.length >= 8,
    passwordPolicyMessage: 'Invalid password'
  })
  const workflow = new PasswordRecoveryWorkflow({
    clientUrl: 'https://fitpulse.example',
    service,
    repository: {
      async findProfileByEmail(email) {
        assert.equal(email, 'member@example.com')
        return account
      },
      async saveToken(row, hash) { saved = { row, hash } },
      async removeToken(hash) { if (saved?.hash === hash) saved = null },
      async findToken(hash) { return saved?.hash === hash },
      async consumeToken(hash) {
        if (saved?.hash !== hash) return null
        const { row } = saved
        saved = null
        return row
      },
      async setAuthPassword(authId, password) {
        if (authError) throw authError
        updates.push([authId, password])
      },
      async updatePasswordState(row) { updates.push(row.id) }
    },
    sendResetLink: async (row, url) => {
      if (mailError) throw mailError
      link = new URL(url)
      assert.equal(row.email, profile.email)
    }
  })
  async function issue() {
    await workflow.forgotPassword({ email: ' Member@Example.com ' })
    return new URLSearchParams(link.hash.slice(1)).get('token')
  }
  return { workflow, service, issue, updates, saved: () => saved, link: () => link }
}

test('unregistered or unavailable emails receive no token or message', async () => {
  for (const account of [null, { ...profile, status: 'inactive' }, { ...profile, auth_user_id: null }]) {
    const f = fixture({ account })
    await assert.rejects(() => f.issue(), { status: 404, message: 'No account found with this email.' })
    assert.equal(f.saved(), undefined)
    assert.equal(f.link(), undefined)
  }
  await assert.rejects(() => fixture().workflow.forgotPassword({ email: 'invalid' }), { status: 400 })
})

test('the URL carries a raw token in its fragment and the database receives only its hash', async () => {
  const f = fixture()
  const token = await f.issue()
  assert.equal(f.link().pathname, '/reset-password')
  assert.equal(f.link().search, '')
  assert.match(token, /^[A-Za-z0-9_-]{43}$/)
  assert.equal(f.saved().hash, f.service.tokenHash({ token }))
  assert.notEqual(f.saved().hash, token)
  assert.deepEqual(await f.workflow.checkToken({ token }), { valid: true })
})

test('mismatched passwords preserve the token, and only one concurrent reset succeeds', async () => {
  const f = fixture()
  const token = await f.issue()
  await assert.rejects(() => f.workflow.resetPassword({ ...body, token, confirmPassword: 'wrong' }),
    { status: 400, message: 'The passwords do not match.' })
  const results = await Promise.allSettled([
    f.workflow.resetPassword({ ...body, token }),
    f.workflow.resetPassword({ ...body, token })
  ])
  assert.equal(results.filter(({ status }) => status === 'fulfilled').length, 1)
  assert.equal(results.find(({ status }) => status === 'rejected').reason.status, 401)
  assert.deepEqual(f.updates, [['auth-1', body.password], 'member-1'])
  await assert.rejects(() => f.workflow.checkToken({ token }), { status: 401, message: invalidResetMessage })
})

test('a newer link replaces the older link and failed delivery removes its token', async () => {
  const f = fixture()
  const older = await f.issue()
  await f.issue()
  await assert.rejects(() => f.workflow.checkToken({ token: older }), { status: 401 })
  const failed = fixture({ mailError: new Error('SMTP rejected') })
  await assert.rejects(() => failed.issue(), /SMTP rejected/)
  assert.equal(failed.saved(), null)
})

test('a provider failure cannot make a consumed token reusable', async () => {
  const f = fixture({ authError: new Error('Auth unavailable') })
  const token = await f.issue()
  await assert.rejects(() => f.workflow.resetPassword({ ...body, token }), /Auth unavailable/)
  await assert.rejects(() => f.workflow.resetPassword({ ...body, token }), { status: 401 })
})

test('new reset tokens expire 30 minutes after they are saved', async (context) => {
  const now = Date.UTC(2026, 10, 19, 0)
  context.mock.method(Date, 'now', () => now)
  const repository = new PasswordRecoveryRepository({
    supabase: {
      from(table) {
        assert.equal(table, 'password_recovery_tokens')
        return { async upsert(row) {
          assert.equal(Date.parse(row.expires_at) - now, 30 * 60_000)
          assert.equal(row.token_hash, 'hashed-token')
          return {}
        } }
      }
    }
  })
  await repository.saveToken({ ...profile, auth_version: 2 }, 'hashed-token')
})
