import { membershipState } from './membership.js'

export const REPORT_TYPES = [
  ['active', 'Active memberships'],
  ['expired', 'Expired memberships'],
  ['attendance', 'Attendance'],
  ['payments', 'Payments'],
  ['renewals', 'Membership renewals'],
  ['maintenance', 'Equipment maintenance']
]
const date = (value) =>
  Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Not set'

export function buildReport(kind, data, now = Date.now()) {
  const members = data.members.filter((member) => ['user', 'member'].includes(member.role))
  if (kind === 'active' || kind === 'expired')
    return {
      headings: ['Member', 'Member ID', 'Plan', 'Start date', 'Expiry date'],
      records: members.filter((member) => membershipState(member, now).status === kind),
      rows: members
        .filter((member) => membershipState(member, now).status === kind)
        .map((member) => [
          member.name,
          member.memberCode || member.id,
          member.plan,
          date(member.membershipStart || member.joined),
          date(member.membershipEnd)
        ])
    }
  if (kind === 'attendance')
    return {
      headings: ['Member', 'Member ID', 'Check-in (Asia/Manila)', 'Recorded by'],
      records: [...data.attendance].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
      rows: [...data.attendance]
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
        .map((item) => [
          item.memberName,
          item.memberId,
          new Date(item.date).toLocaleString('en-PH', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          }),
          item.source || 'Staff'
        ])
    }
  if (kind === 'maintenance')
    return {
      headings: ['Equipment', 'Maintenance note', 'Date'],
      records: [...(data.maintenance || [])].sort(
        (a, b) => Date.parse(b.date) - Date.parse(a.date)
      ),
      rows: [...(data.maintenance || [])]
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
        .map((item) => [item.item, item.note, date(item.date)])
    }
  return {
    headings: ['Member', 'Plan', 'Payment', 'Amount (PHP)', 'Method', 'Date'],
    records: data.payments.filter((item) => kind !== 'renewals' || item.type === 'Renewal'),
    rows: data.payments
      .filter((item) => kind !== 'renewals' || item.type === 'Renewal')
      .map((item) => [
        item.memberName,
        item.plan || 'Not recorded',
        item.type || 'Membership',
        Number(item.amount || 0).toFixed(2),
        item.method,
        date(item.date)
      ])
  }
}
