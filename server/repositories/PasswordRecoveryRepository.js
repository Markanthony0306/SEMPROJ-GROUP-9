/** Supabase access needed by existing password recovery API endpoints. */
export class PasswordRecoveryRepository {
  constructor({ supabase, sendResetEmail }) {
    this.supabase = supabase
    this.sendResetEmail = sendResetEmail
  }

  async findProfileByEmail(email) {
    return this.supabase
      .from('users')
      .select('id, auth_user_id, auth_version, name, email, status')
      .eq('email', email)
      .maybeSingle()
  }

  async sendResetLink(profile, recoveryUrl) {
    return this.sendResetEmail({ email: profile.email, name: profile.name, recoveryUrl })
  }

  async findLinkedProfile(authUserId) {
    return this.supabase
      .from('users')
      .select('id, auth_user_id, auth_version, email, status')
      .eq('auth_user_id', authUserId)
      .maybeSingle()
  }

  async setAuthPassword(authUserId, password) {
    // Supabase Auth hashes the password on its server. FitPulse never stores it.
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
