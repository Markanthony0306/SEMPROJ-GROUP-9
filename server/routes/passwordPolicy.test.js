import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { passwordPolicy, passwordPolicyMessage } from '../../shared/passwordPolicy.js'
import { generateTemporaryPassword } from '../lib/temporaryPassword.js'
import { validAccountInput } from '../lib/accountRules.js'
import { ChangePasswordService } from '../services/ChangePasswordService.js'
import { PasswordRecoveryService } from '../services/PasswordRecoveryService.js'
import { MemberUpdateService } from '../services/MemberUpdateService.js'
import { registerChangePasswordRoutes } from './changePasswordRoutes.js'
import { registerPasswordRecoveryRoutes } from './passwordRecoveryRoutes.js'
import { registerMemberUpdateRoutes } from './memberUpdateRoutes.js'

const policy = { passwordPolicy, passwordPolicyMessage }
const member = {
  id: 'member-1', role: 'user', name: 'Test Member',
  email: 'member@example.com', plan: 'Monthly'
}

test('new passwords accept six through ten characters without requiring lowercase or symbols', () => {
  const change = new ChangePasswordService(policy)
  const recovery = new PasswordRecoveryService(policy)
  const update = new MemberUpdateService({ ...policy, validAccountInput })

  for (const password of ['Abc123', 'HELLO12345', 'Test@1234']) {
    assert.equal(passwordPolicy(password), true)
    assert.equal(change.validate({
      currentPassword: 'legacy-password-longer-than-ten', password, confirmPassword: password
    }).password, password)
    assert.equal(recovery.requirePassword({ password, confirmPassword: password }), password)
    assert.equal(update.prepare({ member, body: { password } }).authUpdates.password, password)
  }
})

test('registration generates compliant temporary passwords', () => {
  for (let index = 0; index < 100; index += 1) {
    const password = generateTemporaryPassword()
    assert.equal(password.length, 10)
    assert.match(password, /[A-Z]/)
    assert.match(password, /[0-9]/)
    assert.equal(passwordPolicy(password), true)
  }
})

test('HTTP password endpoints reject invalid values before writing to Auth or the database', async (context) => {
  const app = express()
  app.use(express.json())
  let passwordDatabaseReads = 0
  const dependencies = {
    ...policy,
    authenticate: (req, res, next) => { req.user = { id: 'admin-1', role: 'admin' }; next() },
    requireRole: () => (req, res, next) => next(),
    rateLimit: () => (req, res, next) => next(),
    loadDatabase: async () => ({ accounts: [member] }),
    supabase: {
      from() { passwordDatabaseReads += 1; throw new Error('Unexpected database access') },
      auth: { admin: { updateUserById() { assert.fail('Invalid password reached Auth') } } }
    },
    validAccountInput,
    emailPattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
    clientUrl: 'https://fitpulse.example'
  }
  registerChangePasswordRoutes(app, {
    ...dependencies,
    loadDatabase: async () => { passwordDatabaseReads += 1; assert.fail('Invalid change reached database') }
  })
  registerPasswordRecoveryRoutes(app, dependencies)
  registerMemberUpdateRoutes(app, dependencies)
  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  context.after(() => new Promise((resolve) => server.close(resolve)))
  const base = `http://127.0.0.1:${server.address().port}/api`

  for (const [label, password] of [
    ['over ten characters', 'Abcdefgh123'],
    ['missing uppercase', 'abc123'],
    ['missing number', 'Abcdef'],
    ['below provider minimum', 'Abc12'],
    ['non-ASCII uppercase', 'Éabc123'],
    ['non-ASCII number', 'Abcde١'],
    ['non-string', 123456]
  ]) {
    await context.test(label, async () => {
      assert.equal(passwordPolicy(password), false)
      for (const [path, method, body] of [
        ['/profile/change-password', 'POST', {
          currentPassword: 'legacy-password', password, confirmPassword: password
        }],
        ['/auth/reset-password', 'POST', {
          token: 'a'.repeat(43), password, confirmPassword: password
        }],
        ['/admin/members/member-1', 'PATCH', { password }]
      ]) {
        const response = await fetch(base + path, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        assert.equal(response.status, 400, path)
        assert.equal((await response.json()).message, passwordPolicyMessage, path)
      }
    })
  }
  assert.equal(passwordDatabaseReads, 0)
})
