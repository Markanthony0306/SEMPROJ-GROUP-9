import crypto from 'node:crypto'
import { membershipPeriod } from '../../shared/membershipPlans.js'

export function issueMembershipQr(member, start = new Date()) {
  Object.assign(member, membershipPeriod(start, member.plan), {
    qr_id: crypto.randomUUID(),
    qr_token: `FPQR1.${crypto.randomBytes(32).toString('base64url')}`
  })
}

export function findQrMember(accounts, token) {
  if (typeof token !== 'string' || !/^FPQR1\.[A-Za-z0-9_-]{43}$/.test(token)) return null
  const provided = crypto.createHash('sha256').update(token).digest()
  return (
    accounts.find((account) => {
      if (!account.qr_token) return false
      const stored = crypto.createHash('sha256').update(account.qr_token).digest()
      return crypto.timingSafeEqual(provided, stored)
    }) || null
  )
}
