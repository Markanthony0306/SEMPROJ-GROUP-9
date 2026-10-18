export const DAY_MS = 86400000
export const MEMBERSHIP_PLANS = [
  { name: 'Weekly', durationDays: 7, price: 200 },
  { name: 'Monthly', durationDays: 30, price: 800 },
  { name: 'Quarterly', durationDays: 90, price: 2200 },
  { name: 'Annual', durationDays: 365, price: 7800 },
  { name: 'Unlimited Monthly', durationDays: 30, price: 1500 }
]

export const getMembershipPlan = (name) => MEMBERSHIP_PLANS.find((plan) => plan.name === name)

export function membershipPeriod(start, planName) {
  const plan = getMembershipPlan(planName)
  const timestamp = new Date(start).getTime()
  if (!plan || !Number.isFinite(timestamp))
    throw new Error('A valid plan and start date are required.')
  const membershipStart = new Date(timestamp).toISOString()
  // Elapsed days are independent of the host timezone. Display timestamps in Asia/Manila.
  const valid_until = new Date(timestamp + plan.durationDays * DAY_MS).toISOString()
  return { membershipStart, membershipEnd: valid_until, valid_until }
}
