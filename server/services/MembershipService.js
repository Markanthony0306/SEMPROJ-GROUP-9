import crypto from 'node:crypto'

import {Membership} from '../models/Membership.js'
import {isRetiredPlan} from '../../shared/membershipPlans.js'

export class MembershipError extends Error {
    constructor(code, message){
        super(message)

        this.name = 'MembershipError'
        this.code = code
    }
}

export class MembershipService {
    constructor({
        now = () => new Date(),
        createId = () => crypto.randomUUID()} = {}) {

        this.now = now
        this.createId = createId
    }

    renew(member, planRecord, paymentDetails = {}) {

        //1. Member Validation
        if(!member || !['user', 'member'].includes(member.role)) {
            throw new MembershipError('MEMBER_NOT_FOUND', 'Member not found.')
        }

        //2. Membership Plan Validation
        if (!planRecord || !planRecord.is_active || isRetiredPlan(planRecord.plan_name)) {
            throw new MembershipError('PLAN_UNAVAILABLE', 'Membership plan not available.')
        }

        const duration = Number(planRecord.duration_days)

        if (!Number.isInteger(duration) || duration <= 0) {
            throw new Error('Invalid membership plan duration.')
        }

        //3. Payment Validation
        const rawMethod = paymentDetails.method

        const method = rawMethod === undefined ? 'Cash' : typeof rawMethod === 'string' ? rawMethod.trim().toLowerCase() === 'cash' ? 'Cash' : rawMethod.trim().toLowerCase() === 'gcash' ? 'GCash' : null : null

        if(!method) {
            throw new MembershipError('INVALID_PAYMENT_METHOD', 'Use Cash or Gcash.')
        }
        const configuredMethods = Array.isArray(paymentDetails.paymentMethods) ? paymentDetails.paymentMethods: []

        const methodExists = configuredMethods.some((item) => String(item.method_name).toLowerCase() === method.toLowerCase())

        if (!methodExists) {
            throw new MembershipError('PAYMENT_METHOD_NOT_CONFIGURED', `Payment method ${method} not configured.`)
        }

        //4. Calculate payment amount
        const amount = paymentDetails.amount === undefined ? Number(planRecord.price): Number(paymentDetails.amount)

        if(!Number.isFinite(amount) || amount <= 0) {
            throw new MembershipError('INVALID_PAYMENT_AMOUNT', 'Invalid payment amount.')
        }

        //5. Determine when the new membership starts
        const now = new Date(this.now())
        const existingStart = new Date(member.membershipStart)
        const existingEnd = new Date(member.membershipEnd)

        //check whether the member still has remaining membership days
        const hasUnexpiredEnd = Boolean(member.membershipEnd)&& Number.isFinite(existingEnd.getTime())&& existingEnd > now

        //check whether the original membership start date is valid
        const hasValidExistingStart = Boolean(member.membershipStart)&& Number.isFinite(existingStart.getTime())&& existingStart < existingEnd

        //extend from the existing expiration date if the member still has remaining membership days and the original membership start date is valid
        const base = hasUnexpiredEnd ? existingEnd : now

        //6. Renewed membership start and end dates
        const subscriptionId = this.createId()
        const renewalDate = now.toISOString()

        const membershipStart = hasUnexpiredEnd && hasValidExistingStart ? existingStart.toISOString() : now.toISOString()
        const membershipEnd = Membership.addDays(base, duration)

        const renewedMember = {
            ...member,
            plan: planRecord.plan_name,
            status: 'active',
            membershipStart,
            membershipEnd,
            subscriptionId,
            subscriptionCreatedAt: renewalDate,
            planId: planRecord.plan_id
        }
        
        //7. payment record
        const payment = {
            id:this.createId(),
            memberId: member.id,
            memberName: member.name,
            amount,
            method,
            plan: planRecord.plan_name,
            type: 'Renewal',
            date: renewalDate,
            subscriptionId,
            processedByUserId: paymentDetails.processedByUserId
        }
        
        //8. Return the results without saving to the database
        return {
         member: renewedMember, payment
        }
    }
}
