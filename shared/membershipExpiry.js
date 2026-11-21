export const ACCOUNT_DELETION_GRACE_DAYS = 15

const DAY_MS = 24 * 60 * 60 * 1000

export function accountDeletionDeadline(member) {
  const membershipEnd = member?.membershipEnd
  if (typeof membershipEnd !== 'string' || !membershipEnd.trim()) return null

  const expiry = Date.parse(membershipEnd)
  if (!Number.isFinite(expiry)) return null

  const deadline = expiry + ACCOUNT_DELETION_GRACE_DAYS * DAY_MS
  return Number.isFinite(new Date(deadline).getTime()) ? deadline : null
}
