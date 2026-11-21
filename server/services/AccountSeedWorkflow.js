import crypto from 'node:crypto'

/**
 * Ensure the administrator account exists when the server starts.
 */
export class AccountSeedWorkflow {
  constructor({
    repository,
    passwordPolicy,
    passwordPolicyMessage,
    availablePlan,
    addMembershipDays
  }) {
    this.repository = repository
    this.passwordPolicy = passwordPolicy
    this.passwordPolicyMessage = passwordPolicyMessage
    this.availablePlan = availablePlan
    this.addMembershipDays = addMembershipDays
  }

  async findAuthUser(email) {
    for (let page = 1; ; page += 1) {
      const { data, error } = await this.repository.findAuthUsersPage(page)
      if (error) {
        throw new Error(`Unable to look up ${email} in Supabase Auth: ${error.message}`)
      }
      const found = data.users.find((user) => user.email?.toLowerCase() === email)
      if (found || data.users.length < 1000) return found || null
    }
  }

  async ensureSeedAccount({ email, name, password, role, plan, membershipDays = 0 }) {
    const database = await this.repository.load(['accounts'])
    let account = database.accounts.find((item) => item.email.toLowerCase() === email)
    if (role === 'admin') {
      if (account && account.role !== 'admin') {
        throw new Error('ADMIN_EMAIL belongs to a non-admin FitPulse account.')
      }
      if (account?.authUserId) return account.id
      // This is a first-admin bootstrap. An existing admin keeps its identity on restart.
      if (!account && database.accounts.some((item) => item.role === 'admin')) return
    }
    let authUser = account?.authUserId
      ? { id: account.authUserId }
      : await this.findAuthUser(email)

    if (authUser && !account && role === 'admin') {
      throw new Error('ADMIN_EMAIL belongs to an Auth user without a linked FitPulse admin profile.')
    }
    if (!authUser) {
      if (!this.passwordPolicy(password)) {
        throw new Error('Set ADMIN_PASSWORD in the server environment. ' + this.passwordPolicyMessage)
      }
      const { data, error } = await this.repository.createAuthUser({ email, name, password })
      if (error || !data.user) {
        throw new Error(
          `Unable to provision ${email} in Supabase Auth: ${error?.message || 'no user returned'}`
        )
      }
      authUser = data.user
    }

    const now = new Date().toISOString()
    if (!account) {
      account = {
        id: crypto.randomUUID(),
        authUserId: authUser.id,
        memberCode: '',
        name,
        email,
        phone: '',
        role: role === 'member' ? 'user' : role,
        plan,
        status: 'active',
        joined: now,
        membershipStart: null,
        membershipEnd: null,
        subscriptionId: null,
        mustChangePassword: false,
        authVersion: 0,
        avatarId: ''
      }
      database.accounts.push(account)
    } else {
      account.authUserId = authUser.id
      account.role = role === 'member' ? 'user' : role
      account.name ||= name
      account.status ||= 'active'
    }

    if (membershipDays && (!account.membershipStart || !account.membershipEnd)) {
      const planRecord = database.membershipPlans.find(
        (item) => this.availablePlan(item, plan)
      )
      if (!planRecord) {
        throw new Error(`The ${plan} membership plan is not active in Supabase.`)
      }
      account.plan = planRecord.plan_name
      account.planId = planRecord.plan_id
      account.membershipStart = now
      account.membershipEnd = this.addMembershipDays(now, planRecord.duration_days)
      account.subscriptionId ||= crypto.randomUUID()
      account.subscriptionCreatedAt = now
    }

    await this.repository.save(database)
    return account.id
  }

  async run(env = process.env) {
    await this.ensureSeedAccount({
      email: (env.ADMIN_EMAIL || 'admin@fitpulse.com').trim().toLowerCase(),
      name: 'FitPulse Staff',
      password: env.ADMIN_PASSWORD || '',
      role: 'admin',
      plan: 'Staff access'
    })

  }
}
