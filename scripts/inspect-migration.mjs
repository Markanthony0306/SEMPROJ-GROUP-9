
import { readFile } from 'node:fs/promises';

const data = JSON.parse(
  await readFile('server/data.json', 'utf8')
);

const isUuid = (value) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

console.log('ACCOUNTS');
console.table(data.accounts.map((a) => ({
  idIsUuid: isUuid(a.id),
  role: a.role,
  plan: a.plan,
  status: a.status,
  joined: a.joined,
  hasPasswordHash: Boolean(a.passwordHash),
})));

console.log('ATTENDANCE');
console.table(data.attendance.map((a) => ({
  idIsUuid: isUuid(a.id),
  memberIdIsUuid: isUuid(a.memberId),
  date: a.date,
})));

console.log('PAYMENTS');
console.table(data.payments.map((p) => ({
  idIsUuid: isUuid(p.id),
  memberIdIsUuid: isUuid(p.memberId),
  amount: p.amount,
  method: p.method,
  plan: p.plan,
  date: p.date,
})));

console.log('SETTINGS');
console.log({
  gym: data.settings?.gym ? '[present]' : '[missing]',
  remind: data.settings?.remind,
  emailOn: data.settings?.emailOn,
});
