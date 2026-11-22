import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Synthetic settings isolate the policy tests from the developer's .env and database.
function inspectConfig(flag, nodeEnv = 'test', extraEnvironment = {}) {
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import fs from 'node:fs'
    const readFileSync = fs.readFileSync
    fs.readFileSync = (file, ...options) => {
      if (String(file).endsWith('.env')) throw new Error('No .env in this isolated test')
      return readFileSync(file, ...options)
    }
    if (process.env.TEST_FLAG_MISSING === 'true') delete process.env.ID_VERIFICATION_ENABLED
    const { createRuntimeConfig } = await import('./server/config/runtimeConfig.js')
    console.log('CONFIG=' + JSON.stringify(createRuntimeConfig().identityVerificationEnabled))
  `], {
    cwd: fileURLToPath(new URL('../../', import.meta.url)),
    encoding: 'utf8',
    timeout: 10000,
    env: {
      ...process.env,
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_PUBLISHABLE_KEY: 'unit-test-only',
      JWT_SECRET: 'unit-test-only',
      FACE_LOGIN_ENABLED: 'false',
      FACE_ENCRYPTION_KEY: 'ab'.repeat(32),
      ID_VERIFICATION_KEY: 'cd'.repeat(32),
      FACE_MATCH_THRESHOLD: '0.5',
      NODE_ENV: nodeEnv,
      ID_VERIFICATION_ENABLED: flag ?? '',
      TEST_FLAG_MISSING: flag === undefined ? 'true' : 'false',
      ...extraEnvironment
    }
  })
  return run
}

test('only exact false disables verification outside production and logs the warning', () => {
  for (const flag of ['false', 'true', '', 'False', 'FALSE', '0', ' false ', 'invalid']) {
    const run = inspectConfig(flag)
    assert.equal(run.status, 0, run.stderr)
    assert.match(run.stdout, new RegExp(`CONFIG=${flag !== 'false'}`))
    assert.equal(run.stderr.includes('WARNING: ID verification is DISABLED. For testing only.'), flag === 'false')
  }
})

test('missing flag defaults on without reading the real environment file', () => {
  const run = inspectConfig(undefined)
  assert.equal(run.status, 0, run.stderr)
  assert.match(run.stdout, /CONFIG=true/)
  assert.doesNotMatch(run.stderr, /DISABLED/)
})

test('production forces verification on and logs an error when bypass is requested', () => {
  const run = inspectConfig('false', 'production')
  assert.equal(run.status, 0, run.stderr)
  assert.match(run.stdout, /CONFIG=true/)
  assert.match(run.stderr, /ERROR:.*forbidden in production.*forced ON/)
  assert.doesNotMatch(run.stderr, /WARNING:.*DISABLED/)
})

test('production still requires verification encryption keys', () => {
  const run = inspectConfig('false', 'production', { FACE_ENCRYPTION_KEY: '', ID_VERIFICATION_KEY: '' })
  assert.notEqual(run.status, 0)
  assert.match(run.stderr, /ID verification is forced ON/)
  assert.match(run.stderr, /must be valid 64-character hex keys/)
})
