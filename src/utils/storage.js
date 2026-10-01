const STORAGE_KEY = 'fitpulse-data-v1'

const defaultData = {
  accounts: [
    {
      id: 'FP-ADMIN',
      name: 'FitPulse Staff',
      email: 'admin@fitpulse.com',
      password: 'admin123',
      role: 'admin',
      phone: '0917 555 0100',
      plan: 'Staff access'
    }
  ],
  attendance: [
    { memberId: 'FP-20483', date: 'Sep 29, 2026 · 6:42 PM' },
    { memberId: 'FP-20483', date: 'Sep 27, 2026 · 9:15 AM' },
    { memberId: 'FP-20483', date: 'Sep 25, 2026 · 6:31 PM' }
  ],
  payments: [
    {
      memberId: 'FP-20483',
      date: 'Sep 01, 2026',
      method: 'Online Payment',
      amount: 1500,
      plan: 'Unlimited Monthly'
    },
    {
      memberId: 'FP-20483',
      date: 'Aug 01, 2026',
      method: 'Cash',
      amount: 1500,
      plan: 'Unlimited Monthly'
    }
  ]
}

export function getData() {
  try {
    return { ...defaultData, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) }
  } catch {
    return defaultData
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
export function createMemberId() {
  return `FP-${Math.floor(10000 + Math.random() * 89999)}`
}
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount)
}
