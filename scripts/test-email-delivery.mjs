import assert from 'node:assert/strict'
import { test } from 'node:test'
import nodemailer from 'nodemailer'
import { emailConfiguration, assertEmailAccepted } from '../server/services/emailDelivery.js'
import { welcomeEmail, recoveryEmail, expiryEmail } from '../server/services/emailTemplates.js'

const settings = {
  SMTP_HOST: 'smtp.fixture.test',
  SMTP_USER: 'mail@fixture.test',
  SMTP_PASS: 'private-fixture'
}

test('SMTP defaults use the authenticated sender and select TLS from the port', () => {
  assert.equal(emailConfiguration(settings).from, 'FitPulse <mail@fixture.test>')
  assert.equal(emailConfiguration(settings).transport.secure, false)
  assert.equal(emailConfiguration({ ...settings, SMTP_PORT: '465' }).transport.secure, true)
  assert.equal(emailConfiguration({}).configured, false)
})

test('invalid sender, port, or TLS settings fail with a safe actionable error', () => {
  for (const invalid of [
    { SMTP_FROM: 'FitPulse <mail@fitpulse.local>' },
    { SMTP_FROM: 'not-an-email' },
    { SMTP_FROM: 'mail@fixture.test\r\nBcc: other@fixture.test' },
    { SMTP_PORT: 'invalid' },
    { SMTP_PORT: '465', SMTP_SECURE: 'false' },
    { SMTP_PORT: '587', SMTP_SECURE: 'true' }
  ]) {
    assert.throws(
      () => emailConfiguration({ ...settings, ...invalid }),
      (error) => {
        assert.ok(!error.message.includes(settings.SMTP_PASS))
        return true
      }
    )
  }
})

test('SMTP rejection cannot be reported as email acceptance', () => {
  assert.throws(() => assertEmailAccepted({ messageId: 'missing-acceptance' }), {
    code: 'ERECIPIENT'
  })
  assert.throws(() => assertEmailAccepted({ accepted: [], rejected: ['member@fixture.test'] }), {
    code: 'ERECIPIENT'
  })
  assert.throws(() => assertEmailAccepted({ accepted: [] }), { code: 'ERECIPIENT' })
  assert.ok(assertEmailAccepted({ accepted: ['member@fixture.test'], messageId: 'fixture' }))
})

test('all four email variants compile real MIME messages, including the local logo, without sending', async () => {
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true })
  const messages = [
    welcomeEmail({
      name: 'Test Member',
      email: 'member@fixture.test',
      temporaryPassword: 'Temporary-fixture!',
      loginUrl: 'https://app.fixture.test'
    }),
    recoveryEmail({ name: 'Test Member', recoveryUrl: 'https://provider.fixture.test/reset' }),
    expiryEmail({
      name: 'Test Member',
      plan: 'Monthly',
      expiryDate: 'Oct 30, 2026',
      expired: false,
      loginUrl: 'https://app.fixture.test'
    }),
    expiryEmail({
      name: 'Test Member',
      plan: 'Monthly',
      expiryDate: 'Oct 22, 2026',
      expired: true,
      loginUrl: 'https://app.fixture.test'
    })
  ]
  try {
    for (const message of messages) {
      const result = await transport.sendMail({
        from: 'FitPulse <mail@fixture.test>',
        to: 'member@fixture.test',
        ...message
      })
      assert.ok(Buffer.isBuffer(result.message))
      const mime = result.message.toString()
      assert.ok(mime.includes('Content-ID: <fitpulse-brand>'))
      assert.ok(mime.includes('image/png'))
      assert.ok(mime.includes('text/plain') && mime.includes('text/html'))
    }
  } finally {
    transport.close()
  }
})
