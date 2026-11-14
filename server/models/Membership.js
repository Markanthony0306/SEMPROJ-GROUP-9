/**ENCAPSULATION**/
export class Membership {
    #role
    #status
    #membershipStart
    #membershipEnd
    #joined

    constructor(account = {}) {
        this.#role = account.role
        this.#status = account.status
        this.#membershipStart = account.membershipStart 
        this.#membershipEnd = account.membershipEnd
        this.#joined = account.joined
    }

    getStatus(now = new Date()) {// Returns the membership status, or 'expired' if the membership has ended
    return this.#membershipEnd && new Date(this.#membershipEnd) < now
        ? 'expired'
        : this.#status || 'active'
    }

    getCheckInFailure(now = Date.now()){// Returns a string code if the membership is not valid for check-in, or an empty string if valid
        if (!['user', 'member'].includes(this.#role)) return 'MEMBER_NOT_FOUND'
        if (this.#status !== 'active') return 'MEMBERSHIP_INACTIVE'

        const start = Date.parse(this.#membershipStart || this.#joined)
        const end = Date.parse(this.#membershipEnd)

        if (!Number.isFinite(start) || !Number.isFinite(end)) return 'MEMBERSHIP_DATES_MISSING'
        if (start > now) return 'MEMBERSHIP_NOT_STARTED'
        if (end <= now) return 'MEMBERSHIP_EXPIRED'

        return ''
    }

    static addDays(date, durationDays = 30){//Calculates a membership end date by adding a number of days to a given start date, defaulting to 30 days if not specified
        const next = new Date(date)

        next.setDate(next.getDate() + Number(durationDays || 30))
        return next.toISOString()
    }
}