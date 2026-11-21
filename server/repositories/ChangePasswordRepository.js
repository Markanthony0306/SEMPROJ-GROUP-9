/** Supabase and database snapshot operations for the existing password change. */
export class ChangePasswordRepository {
  constructor({ supabase, loadDatabase, saveDatabase }) {
    this.supabase = supabase
    this.loadDatabase = loadDatabase
    this.saveDatabase = saveDatabase
  }

  async loadAccounts() {
    return this.loadDatabase(['accounts'])
  }

  async findLinkedProfile(accountId) {
    return this.supabase
      .from('users')
      .select('auth_user_id, email')
      .eq('id', accountId)
      .maybeSingle()
  }

  async updateAuthPassword(authUserId, password) {
    return this.supabase.auth.admin.updateUserById(authUserId, { password })
  }

  async save(database) {
    return this.saveDatabase(database)
  }
}
