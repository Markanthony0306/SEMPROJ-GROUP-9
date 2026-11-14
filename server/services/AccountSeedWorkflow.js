import crypto from 'node:crypto'

/**
 * Startup seeding workflow extracted from server.js without intentional
 * changes to existing account, demo data or save behavior.
 */
export class AccountSeedWorkflow {
  constructor({
    repository,
    isProduction,
    passwordPolicy,
    passwordPolicyMessage,
    availablePlan,
    addMembershipDays
  }) {
    this.repository = repository
    this.isProduction = isProduction
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
    let authUser = account?.authUserId
      ? { id: account.authUserId }
      : await this.findAuthUser(email)

    if (!authUser) {
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

  async run() {
    const adminPassword = process.env.ADMIN_PASSWORD || (this.isProduction ? '' : 'admin123')
    const existingDatabase = await this.repository.load(['accounts'])
    const existingAdmin = existingDatabase.accounts.find(
      (account) => account.email === 'admin@fitpulse.com'
    )
    const existingAdminAuth = existingAdmin?.authUserId ||
      await this.findAuthUser('admin@fitpulse.com')

    if (this.isProduction && !existingAdminAuth && !this.passwordPolicy(adminPassword)) {
      throw new Error(
        'ADMIN_PASSWORD must meet the password policy. ' + this.passwordPolicyMessage
      )
    }

    await this.ensureSeedAccount({
      email: 'admin@fitpulse.com',
      name: 'FitPulse Staff',
      password: adminPassword,
      role: 'admin',
      plan: 'Staff access'
    })

    let demoMemberId = null
    // Demo accounts and sample activity only run outside production.
    if (!this.isProduction) {
      demoMemberId = await this.ensureSeedAccount({
        email: 'member@fitpulse.com',
        name: 'Mia Cruz',
        password: 'member123',
        role: 'member',
        plan: 'Monthly - Student',
        membershipDays: 30
      })

      const database = await this.repository.load(['accounts', 'attendance', 'payments'])
      const demoMember = database.accounts.find((account) => account.id === demoMemberId)
      if (database.attendance.length === 0) {
        const day = 86_400_000
        const now = Date.now()
        for (const offset of [0, 2 * day, 4 * day, 7 * day]) {
          database.attendance.push({
            id: crypto.randomUUID(),
            memberId: demoMember.id,
            memberName: demoMember.name,
            date: new Date(now - offset).toISOString(),
            source: 'Demo'
          })
        }
      }
      if (database.payments.length === 0) {
        database.payments.push(
          {
            id: crypto.randomUUID(), memberId: demoMember.id, memberName: demoMember.name,
            amount: 1500, method: 'GCash', plan: demoMember.plan, type: 'New',
            date: new Date(Date.now() - 32 * 86_400_000).toISOString(),
            subscriptionId: demoMember.subscriptionId,
            processedByUserId: demoMember.id
          },
          {
            id: crypto.randomUUID(), memberId: demoMember.id, memberName: demoMember.name,
            amount: 1500, method: 'Cash', plan: demoMember.plan, type: 'Renewal',
            date: new Date().toISOString(),
            subscriptionId: demoMember.subscriptionId,
            processedByUserId: demoMember.id
          }
        )
      }
      await this.repository.save(database)
    }
  }
}
