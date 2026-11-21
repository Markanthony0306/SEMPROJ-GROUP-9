/** Supabase access needed by existing password recovery API endpoints. */
export class PasswordRecoveryRepository {
  constructor({ supabase, createAuthClient }) {
    this.supabase = supabase
    this.createAuthClient = createAuthClient
  }

  async findProfileByEmail(email) {
    return this.supabase
      .from('users')
      .select('email, status')
      .ilike('email', email)
      .maybeSingle()
  }

  async sendResetLink(email, redirectTo) {
    return this.createAuthClient().auth.resetPasswordForEmail(email, { redirectTo })
  }

  async exchangeCode(code) {
    return this.createAuthClient().auth.exchangeCodeForSession(code)
  }

  async getAuthUser(accessToken) {
    return this.createAuthClient().auth.getUser(accessToken)
  }

  async findLinkedProfile(authUserId) {
    return this.supabase
      .from('users')
      .select('id, auth_user_id, auth_version')
      .eq('auth_user_id', authUserId)
      .maybeSingle()
  }

  async setAuthPassword(authUserId, password) {
    return this.supabase.auth.admin.updateUserById(authUserId, { password })
  }

  async updatePasswordState(profile) {
    return this.supabase
      .from('users')
      .update({
        auth_version: Number(profile.auth_version || 0) + 1,
        must_change_password: false
      })
      .eq('id', profile.id)
  }
}
