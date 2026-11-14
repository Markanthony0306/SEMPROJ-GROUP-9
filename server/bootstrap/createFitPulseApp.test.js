import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
function inspectApp() {
  const source = `
    const { createFitPulseApp } = await import('./server/bootstrap/createFitPulseApp.js')
    const { app, port, accountSeedWorkflow } = createFitPulseApp()
    console.log('APP_AUDIT=' + JSON.stringify({
      port,
      hasSeedWorkflow: typeof accountSeedWorkflow.run === 'function',
      routes: app.router.stack.filter(x => x.route).map(x => [x.route.path, Object.keys(x.route.methods).join(',')]),
      lastMiddleware: app.router.stack.at(-1)?.handle?.name
    }))
  `
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
    cwd,
    encoding: 'utf8',
    timeout: 15000,
    env: {
      ...process.env,
      // Synthetic values: only builds the Express app, never listens or seeds.
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SECRET_KEY: 'unit-test-only',
      SUPABASE_PUBLISHABLE_KEY: 'unit-test-only',
      JWT_SECRET: 'unit-test-only',
      FACE_LOGIN_ENABLED: 'false',
      NODE_ENV: 'test',
      PORT: '3001'
    }
  })
  assert.equal(run.status, 0, `Failed to assemble Express app:\n${run.stderr}`)
  const match = run.stdout.match(/^APP_AUDIT=(.+)$/m)
  assert.ok(match, 'App inspection result was not found')
  return JSON.parse(match[1])
}

test('app composition retains original route order and methods', () => {
  const result = inspectApp()
  const expected = [
    ['/api/auth/register', 'post'],
    ['/api/auth/login', 'post'],
    ['/api/admin/members/:id/face-enrollment', 'delete'],
    ['/api/profile/face-enrollment', 'get'],
    ['/api/profile/face-enrollment', 'delete'],
    ['/api/auth/forgot-password', 'post'],
    ['/api/auth/reset-password/session', 'post'],
    ['/api/auth/reset-password', 'post'],
    ['/api/me', 'get'],
    ['/api/admin/membership-plans', 'get'],
    ['/api/admin/members/:id', 'patch'],
    ['/api/admin/equipment', 'get'],
    ['/api/admin/equipment', 'post'],
    ['/api/admin/equipment/:id', 'patch'],
    ['/api/admin/settings', 'get'],
    ['/api/admin/settings', 'patch'],
    ['/api/profile', 'patch'],
    ['/api/profile/change-password', 'post'],
    ['/api/attendance', 'get'],
    ['/api/attendance/check-in', 'post'],
    ['/api/payments', 'get'],
    ['/api/admin/attendance', 'post'],
    ['/api/admin/payments', 'post']
  ]
  assert.deepEqual(result.routes, expected)
})

test('app factory preserves startup workflow, port and final error handler', () => {
  const result = inspectApp()
  assert.equal(result.port, 3001)
  assert.equal(result.hasSeedWorkflow, true)
  assert.equal(result.lastMiddleware, 'httpErrorHandler')
})
