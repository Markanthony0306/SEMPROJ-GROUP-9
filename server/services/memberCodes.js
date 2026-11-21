import crypto from 'node:crypto'

const MEMBER_CODE = /^FP-[a-f0-9]{6,16}$/i

export function createMemberCode(accounts = []) {
  const existingCodes = new Set(
    accounts.map((account) => account.memberCode?.toUpperCase()).filter(Boolean)
  )
  let memberCode
  do {
    memberCode = `FP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
  } while (existingCodes.has(memberCode))
  return memberCode
}

// Display codes are separate from account UUIDs and never authorize QR entry.
export function ensureMemberCodes(database) {
  const seenCodes = new Set()
  let changed = false
  for (const account of database.accounts) {
    if (!['user', 'member'].includes(account.role)) continue
    const existingCode = account.memberCode?.toUpperCase()
    if (!MEMBER_CODE.test(account.memberCode || '') || seenCodes.has(existingCode)) {
      account.memberCode = createMemberCode(database.accounts)
      changed = true
    }
    seenCodes.add(account.memberCode.toUpperCase())
  }
  return changed
}
