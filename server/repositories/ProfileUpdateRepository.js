
export class ProfileUpdateRepository {
  constructor({ supabase, loadDatabase }) {
    this.supabase = supabase
    this.loadDatabase = loadDatabase
  }

  async loadAccounts() {
    return this.loadDatabase(['accounts'])
  }

  async findDuplicateEmail(email, accountId) {
    return this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', accountId)
      .maybeSingle()
  }

  async updateAuthUser(authUserId, updates) {
    return this.supabase.auth.admin.updateUserById(
      authUserId,
      updates
    )
  }

  async updateProfile(accountId, input) {
    return this.supabase
      .from('users')
      .update({
        name: input.name,
        email: input.email,
        phone_number: input.phone || null
      })
      .eq('id', accountId)
      .select('id, name, email, phone_number')
      .maybeSingle()
  }
}
