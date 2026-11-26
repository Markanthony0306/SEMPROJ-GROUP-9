import { Membership } from '../models/Membership.js'
import { isRetiredPlan } from '../../shared/membershipPlans.js'
import { composeMemberName, normalizeNamePart } from '../../shared/memberName.js'

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
  // Accept surname from older clients, but keep lastName as the canonical field.
  const submittedLastName = body.lastName ?? body.surname
  const hasSplitName = body.firstName !== undefined || body.lastName !== undefined || body.surname !== undefined
  const firstName = normalizeNamePart(body.firstName)
  const lastName = normalizeNamePart(submittedLastName)
  const name = hasSplitName
    ? composeMemberName(firstName, lastName)
    : normalizeNamePart(body.name)
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const plan = typeof body.plan === 'string' ? body.plan.trim() : ''
  // Field names let the registration sheet focus the control the server rejected.
  if (hasSplitName && !firstName) return { error: 'Please enter a first name.', field: 'firstName' }
  if (hasSplitName && !lastName) return { error: 'Please enter a last name.', field: 'lastName' }
  if (!name || name.length > 100) return {
    error: hasSplitName ? 'First name and last name must total 100 characters or fewer.' : 'Please enter a name of up to 100 characters.',
    field: hasSplitName ? 'lastName' : 'name'
  }
  if (!emailPattern.test(email)) return { error: 'Please enter a valid email address.', field: 'email' }
  if (!plan || plan.length > 100) return { error: 'Choose a valid membership plan.', field: 'plan' }
  return {
    name,
    ...(hasSplitName ? { firstName, lastName } : {}),
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
