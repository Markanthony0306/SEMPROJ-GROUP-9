import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:net'
import express from 'express'
import { registerPasswordRecoveryRoutes } from '../../server/routes/passwordRecoveryRoutes.js'
import { passwordPolicy, passwordPolicyMessage } from '../../shared/passwordPolicy.js'

const messages = []
const smtp = createServer(socket => {
  socket.setEncoding('utf8')
  socket.write('220 fixture local SMTP\r\n')
  let buffer = ''
  let message = null
  socket.on('data', chunk => {
    buffer += chunk
    let end
    while ((end = buffer.indexOf('\r\n')) >= 0) {
      const line = buffer.slice(0, end)
      buffer = buffer.slice(end + 2)
      if (message !== null) {
        if (line === '.') {
          messages.push(message)
          message = null
          socket.write('250 queued locally\r\n')
        } else message += line + '\r\n'
      } else if (/^EHLO /i.test(line)) socket.write('250-fixture\r\n250 AUTH PLAIN\r\n')
      else if (/^AUTH PLAIN /i.test(line)) socket.write('235 authenticated\r\n')
      else if (line === 'DATA') {
        message = ''
        socket.write('354 end with dot\r\n')
      } else if (line === 'QUIT') socket.end('221 done\r\n')
      else socket.write('250 ok\r\n')
    }
  })
})
smtp.listen(0, '127.0.0.1')
await once(smtp, 'listening')
Object.assign(process.env, {
  SMTP_HOST: '127.0.0.1', SMTP_PORT: smtp.address().port, SMTP_SECURE: 'false',
  SMTP_USER: 'sender@fixture.test', SMTP_PASS: 'local-fixture-only', SMTP_FROM: 'FitPulse <sender@fixture.test>'
})

const row = { id: 'fixture-1', auth_user_id: 'auth-1', auth_version: 1, status: 'active',
  name: 'Jamie', email: 'member@fixture.test', must_change_password: true }
let updated = 0
const supabase = {
  from(table) {
    assert.equal(table, 'users')
    return {
      select() {
        return { eq: (field, value) => ({
          maybeSingle: async () => ({ data: row[field] === value ? { ...row } : null, error: null })
        }) }
      },
      update(values) {
        return { eq: async (field, value) => {
          assert.equal(row[field], value)
          Object.assign(row, values)
          return { error: null }
        } }
      }
    }
  },
  auth: { admin: { updateUserById: async (id, values) => {
    assert.equal(id, row.auth_user_id)
    assert.equal(values.password, 'NewPassword#123')
    updated++
    return { error: null }
  } } }
}
const app = express()
app.use(express.json())
registerPasswordRecoveryRoutes(app, {
  supabase, clientUrl: 'http://localhost:5173', emailPattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
  passwordPolicy, passwordPolicyMessage, rateLimit: () => (_req, _res, next) => next()
})
const api = app.listen(0, '127.0.0.1')
await once(api, 'listening')
const post = (name, body, headers = {}) => fetch('http://127.0.0.1:' + api.address().port + '/api/auth/' + name, {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body)
})
try {
  const requested = await post('forgot-password', { email: row.email })
  assert.equal(requested.status, 200)
  assert.match((await requested.json()).message, /reset link was sent/)
  assert.equal(messages.length, 1)
  const mime = messages[0].replace(/=\r\n/g, '').replace(/=3D/g, '=')
  assert.match(mime, /60 seconds/)
  const token = mime.match(/http:\/\/localhost:5173\/reset-password#token=([A-Za-z0-9_-]{43})/)?.[1]
  assert.ok(token)
  const link = await post('reset-password/session', { token })
  assert.equal(link.headers.get('Cache-Control'), 'no-store')
  const checked = await link.json()
  assert.ok(checked.expiresAt - checked.serverNow <= 60_000 && checked.expiresAt > checked.serverNow)
  const passwords = { password: 'NewPassword#123', confirmPassword: 'NewPassword#123' }
  assert.equal((await post('reset-password', passwords, { Authorization: 'Bearer old-session' })).status, 410)
  assert.equal((await post('reset-password', { token, ...passwords })).status, 200)
  assert.equal((await post('reset-password', { token, ...passwords })).status, 410)
  assert.equal((await post('reset-password/session', { token })).status, 410)
  assert.equal(updated, 1)
  assert.equal(row.auth_version, 2)
  assert.equal(row.must_change_password, false)
  console.log('PASS: real Express routes and SMTP transport delivered one local reset email and rejected a replay.')
} finally {
  api.close()
  api.closeAllConnections()
  smtp.close()
}
