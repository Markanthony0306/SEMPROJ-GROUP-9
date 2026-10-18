// Display codes never replace the account ID used by API routes and record joins.
export function displayMemberCode(member) {
  if (member?.memberCode) return member.memberCode
  const accountId = String(member?.id || '')
    .replaceAll('-', '')
    .toUpperCase()
  if (!accountId) return 'Not assigned'
  if (accountId.length <= 8) return accountId
  return `ID-${accountId.slice(0, 4)}-${accountId.slice(-4)}`
}
