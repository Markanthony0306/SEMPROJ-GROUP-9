import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'
import nodemailer from 'nodemailer'

let transport
try {
  loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)))
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS)
    throw new Error('Set SMTP_HOST, SMTP_USER and SMTP_PASS in the private .env file.')
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  })
  await transport.verify()
  console.log('SMTP connection and authentication successful. No email was sent.')
} catch (error) {
  const code = /^[A-Za-z0-9_-]+$/.test(error.code || '') ? ` (${error.code})` : ''
  console.error(`Email setup verification failed${code}. Check the private SMTP settings.`)
  process.exitCode = 1
} finally {
  transport?.close()
}
