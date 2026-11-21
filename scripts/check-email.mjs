import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'
import nodemailer from 'nodemailer'
import { assertEmailAccepted, emailConfiguration } from '../server/services/emailDelivery.js'
import { welcomeEmail, recoveryEmail, expiryEmail } from '../server/services/emailTemplates.js'

function testMessages(recipient) {
  const name = 'FitPulse Email Test'
  const loginUrl = 'https://example.com/fitpulse-email-test'
  const expiryDate = (days) =>
    new Date(Date.now() + days * 86_400_000).toLocaleDateString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  return [
    [
      'Welcome credentials',
      welcomeEmail({
        name,
        email: recipient,
        temporaryPassword: 'TEST-ONLY-NOT-A-REAL-PASSWORD',
        loginUrl
      })
    ],
    ['Password reset', recoveryEmail({ name, recoveryUrl: `${loginUrl}/password-reset` })],
    ['Resent sign-in link', recoveryEmail({ name, recoveryUrl: `${loginUrl}/sign-in-link` })],
    [
      'Upcoming membership expiry',
      expiryEmail({
        name,
        plan: 'Test Monthly Plan',
        expiryDate: expiryDate(7),
        expired: false,
        loginUrl
      })
    ],
    [
      'Expired membership',
      expiryEmail({
        name,
        plan: 'Test Monthly Plan',
        expiryDate: expiryDate(-1),
        expired: true,
        loginUrl
      })
    ]
  ]
}

let transport
try {
  loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)))
  const configuration = emailConfiguration()
  if (!configuration.configured)
    throw new Error('Set SMTP_HOST, SMTP_USER and SMTP_PASS in the private .env file.')
  transport = nodemailer.createTransport(configuration.transport)
  await transport.verify()
  const sendAll = process.argv.includes('--send-all-tests')
  if (sendAll || process.argv.includes('--send-test')) {
    const recipient = process.env.SMTP_USER?.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient || ''))
      throw new Error('The SMTP_USER address must be an email inbox to receive a test.')
    if (sendAll) {
      const messages = testMessages(recipient)
      const note =
        'TEST ONLY: Dummy account details and example links. No account, password, payment, or membership was changed.'
      let accepted = 0
      for (const [index, [label, message]] of messages.entries()) {
        try {
          assertEmailAccepted(
            await transport.sendMail({
              ...message,
              from: configuration.from,
              to: recipient,
              subject: `[FITPULSE TEST ${index + 1}/${messages.length}] ${message.subject}`,
              text: `${label}\n${note}\n\n${message.text}`,
              html: message.html.replace(
                /(<body[^>]*>)/i,
                `$1<div style="padding:16px;background:#fff4cf;color:#003049;font-family:Arial,sans-serif"><strong>${label}</strong><br>${note}</div>`
              )
            })
          )
          accepted += 1
          console.log(`PASS ${index + 1}/${messages.length}: ${label} accepted by SMTP.`)
        } catch (error) {
          const code = /^[A-Za-z0-9_-]+$/.test(error.code || '') ? error.code : 'EMAIL_ERROR'
          console.error(`FAIL ${index + 1}/${messages.length}: ${label} (${code}).`)
          process.exitCode = 1
        }
      }
      console.log(
        `${accepted}/${messages.length} test emails accepted for the configured SMTP_USER inbox. Check Inbox and Spam to confirm each arrival.`
      )
    } else {
      assertEmailAccepted(
        await transport.sendMail({
          from: configuration.from,
          to: recipient,
          subject: 'FitPulse email delivery check',
          text: 'This is the FitPulse email delivery test you requested. Your mail server accepted this message. No account or membership was changed.'
        })
      )
      console.log(
        'Test email accepted by SMTP for the configured SMTP_USER inbox. Check Inbox and Spam to confirm arrival.'
      )
    }
  } else {
    console.log('SMTP connection and authentication successful. No email was sent.')
  }
} catch (error) {
  const code = /^[A-Za-z0-9_-]+$/.test(error.code || '') ? ` (${error.code})` : ''
  console.error(`Email setup verification failed${code}. Check the private SMTP settings.`)
  if (/^(SMTP_|Use SMTP_SECURE|Set SMTP_HOST|The SMTP_USER)/.test(error.message || ''))
    console.error(error.message)
  process.exitCode = 1
} finally {
  transport?.close()
}
