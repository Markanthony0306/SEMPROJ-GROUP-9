import { Resolver } from 'node:dns/promises'
import { domainToASCII } from 'node:url'
import { MemberRegistrationError } from './MemberRegistrationService.js'

export function normalizeMemberEmail(value) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : ''
  const [local, rawDomain, extra] = email.split('@')
  const domain = domainToASCII(rawDomain || '')
  const validLabel = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/
  if (
    !local || local.length > 64 || extra !== undefined ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local) ||
    local.startsWith('.') || local.endsWith('.') || local.includes('..') ||
    !rawDomain || /[\s:/#?\\]/.test(rawDomain) || !domain.includes('.') ||
    !domain.split('.').every((label) => validLabel.test(label)) ||
    local.length + domain.length + 1 > 254
  ) return null
  return `${local}@${domain}`
}

const resolver = new Resolver({ timeout: 2000, tries: 2 })

export async function validateMemberEmail(value, resolveMx = (domain) => resolver.resolveMx(domain)) {
  const email = normalizeMemberEmail(value)
  if (!email) {
    throw new MemberRegistrationError('Please enter a valid email address.', 400, 'email')
  }
  if (email === 'asdf@asdf.com') {
    throw new MemberRegistrationError('Enter the member’s email instead of a placeholder.', 400, 'email')
  }
  const domain = email.split('@')[1]
  let records
  try {
    records = await resolveMx(domain)
  } catch (error) {
    if (error.code !== 'ENODATA' && error.code !== 'ENOTFOUND') {
      throw new MemberRegistrationError(
        'We could not check this email domain. Please try again.', 503, 'email'
      )
    }
    records = []
  }
  if (!records.some(({ exchange }) => Boolean(exchange?.replace(/\.$/, '')))) {
    throw new MemberRegistrationError(
      'This email domain cannot receive email. Enter another address.', 400, 'email'
    )
  }
  return email
}
