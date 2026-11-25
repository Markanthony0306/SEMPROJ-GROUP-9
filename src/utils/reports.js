import { membershipState } from './membership.js'
import { formatDate, formatDateTime, formatTime } from '../../shared/formatDate.js'

export const REPORT_TYPES = [
  ['active', 'Active memberships'],
  ['expired', 'Expired memberships'],
  ['attendance', 'Attendance'],
  ['payments', 'Payments'],
  ['renewals', 'Membership renewals'],
  ['maintenance', 'Equipment maintenance']
]
const date = (value) => formatDate(value, 'Not set')

export function parseReportDateTime(date, time, now = Date.now()) {
  const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date)
  if (!parts || !/^\d{2}:\d{2}$/.test(time))
    throw new Error('Enter a date in dd/mm/yyyy and choose a valid Manila time.')
  const [, day, month, year] = parts
  // Manila has used UTC+08:00 throughout the supported report date range.
  const timestamp = Date.parse(`${year}-${month}-${day}T${time}:00+08:00`)
  if (formatDate(timestamp) !== date || formatTime(timestamp, { hour12: false }) !== time)
    throw new Error('Enter a valid calendar date and time.')
  if (timestamp < Date.UTC(2000, 0, 1) || timestamp > now)
    throw new Error('Choose a record date and time between January 2000 and now.')
  return new Date(timestamp).toISOString()
}

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
          formatDateTime(item.date, 'Not set'),
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
