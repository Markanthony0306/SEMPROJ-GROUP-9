import { Membership } from '../models/Membership.js'
import { isRetiredPlan } from '../../shared/membershipPlans.js'

export const availablePlan =(plan, name) =>
  plan.is_active && !isRetiredPlan(plan.plan_name) &&
  String(plan.plan_name).toLowerCase() === name.toLowerCase()

function publicAccount(account) {
  const { authUserId, authVersion, subscriptionId, subscriptionCreatedAt, planId, ...safe } = account
  return { ...safe, status: membershipStatus(account) }
}

function membershipStatus(account) {
  return new Membership(account).getStatus()
}
function addMembershipDays(date, durationDays = 30) {
  return Membership.addDays(date, durationDays)
}
function validAccountInput(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const plan = typeof body.plan === 'string' ? body.plan.trim() : ''
  if (!name || name.length > 100) return { error: 'Please enter a name of up to 100 characters.' }
  if (!emailPattern.test(email)) return { error: 'Please enter a valid email address.' }
  if (!plan || plan.length > 100) return { error: 'Choose a valid membership plan.' }
  return {
    name,
    email,
    phone: typeof body.phone === 'string' ? body.phone.trim() : '',
    plan
  }
}

function paymentMethod(body) {
  if (body.method === undefined) return 'Cash'
  const method = typeof body.method === 'string' ? body.method.trim().toLowerCase() : ''
  return method === 'cash' ? 'Cash' : method === 'gcash' ? 'GCash' : null
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export { publicAccount, membershipStatus, addMembershipDays, validAccountInput, paymentMethod, emailPattern }
