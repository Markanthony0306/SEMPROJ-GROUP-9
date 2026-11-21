function checked({ data, error }) {
  if (error) throw error
  return data
}

export class PasswordRecoveryRepository {
  constructor({ supabase }) {
    this.supabase = supabase
  }

  async findProfileByEmail(email) {
    // The database enforces a unique lowercased email. Escape ILIKE wildcards
    // and compare the result exactly before issuing a token.
    const pattern = email.replace(/[\\%_]/g, '\\$&')
    const profile = checked(await this.supabase
      .from('users')
      .select('id, email, name, status, auth_user_id, auth_version')
      .ilike('email', pattern)
      .maybeSingle())
    return profile?.email.toLowerCase() === email ? profile : null
  }

  async saveToken(profile, hash) {
    checked(await this.supabase.from('password_recovery_tokens').upsert({
      user_id: profile.id,
      token_hash: hash,
      auth_user_id: profile.auth_user_id,
      auth_version: profile.auth_version,
      email: profile.email,
      expires_at: new Date(Date.now() + 30 * 60_000).toISOString()
    }))
  }

  async removeToken(hash) {
    checked(await this.supabase.from('password_recovery_tokens').delete().eq('token_hash', hash))
  }

  async findToken(hash) {
    return checked(await this.supabase.rpc('check_password_recovery_token', { p_hash: hash }))
  }

  async consumeToken(hash) {
    const profiles = checked(await this.supabase.rpc('consume_password_recovery_token', { p_hash: hash }))
    return profiles?.[0]
  }

  async setAuthPassword(authUserId, password) {
    checked(await this.supabase.auth.admin.updateUserById(authUserId, { password }))
  }

  async updatePasswordState(profile) {
    const updated = checked(await this.supabase.from('users')
      .update({
        auth_version: profile.auth_version + 1,
        must_change_password: false
      })
      .eq('id', profile.id)
      .eq('auth_user_id', profile.auth_user_id)
      .eq('auth_version', profile.auth_version)
      .select('id')
      .maybeSingle())
    if (!updated) throw new Error('The account changed during password recovery.')
  }
}
