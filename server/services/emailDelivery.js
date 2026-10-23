import nodemailer from 'nodemailer'

export function emailConfiguration(env = process.env) {
  const host = (env.SMTP_HOST || '').trim()
  const user = (env.SMTP_USER || '').trim()
  const pass = env.SMTP_PASS || ''
  const port = Number(env.SMTP_PORT || 587)
  const secure =
    env.SMTP_SECURE === undefined || env.SMTP_SECURE === ''
      ? port === 465
      : env.SMTP_SECURE === 'true'
  const from = (env.SMTP_FROM || '').trim() || (user ? `FitPulse <${user}>` : '')
  const address = from.match(/<([^<>]+)>$/)?.[1] || from
  const configured = Boolean(host && user && pass)
  if (configured) {
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      throw new Error('SMTP_PORT must be a valid port number.')
    if ((port === 465 && !secure) || (port === 587 && secure))
      throw new Error('Use SMTP_SECURE=true for port 465 and false for port 587.')
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ||
      /[\r\n]/.test(from) ||
      /\.local$/i.test(address)
    )
      throw new Error('SMTP_FROM must use a real sender address authorized by your email provider.')
  }
  return {
    configured,
    from,
    transport: {
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 30_000
    }
  }
}

export function assertEmailAccepted(result) {
  if (!Array.isArray(result?.accepted) || !result.accepted.length || result?.rejected?.length) {
    const error = new Error('The mail server did not confirm recipient acceptance.')
    error.code = 'ERECIPIENT'
    throw error
  }
  return result
}

export function createEmailDelivery(configuration) {
  if (!configuration.configured) return null
  const transport = nodemailer.createTransport(configuration.transport)
  return {
    verify: () => transport.verify(),
    close: () => transport.close(),
    sendMail: async (message) => assertEmailAccepted(await transport.sendMail(message))
  }
}
