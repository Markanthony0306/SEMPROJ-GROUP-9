import { PasswordRecoveryWorkflowError, RESET_LINK_LIFETIME_SECONDS } from './PasswordRecoveryService.js'
import { createHash, randomBytes } from 'node:crypto'
import { withMemberAccountLock } from '../lib/memberAccountLock.js'

const RESET_LIFETIME_MS = RESET_LINK_LIFETIME_SECONDS * 1000
const tokenDigest = (token) => createHash('sha256').update(token).digest('hex')

export class PasswordRecoveryWorkflow {
  constructor({ service, repository, clientUrl, now = Date.now }) {
    this.service = service
    this.repository = repository
    this.clientUrl = clientUrl
    this.now = now
  }

  // The localhost API is a single process. A restart discards outstanding reset links.
  #links = new Map()

  #forget(digest) {
    clearTimeout(this.#links.get(digest)?.timer)
    this.#links.delete(digest)
  }

  #validLink(token) {
    const digest = typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token)
      ? tokenDigest(token)
      : null
    const link = this.#links.get(digest)
    const serverNow = this.now()
    if (!link || serverNow >= link.expiresAt) {
      if (link) this.#forget(digest)
      throw new PasswordRecoveryWorkflowError('This link has expired or already been used.', 410)
    }
    return { link, digest, serverNow }
  }

  async forgotPassword(body) {
    const response = { message: 'If that email exists, a reset link was sent.' }
    const email = this.service.normalizedEmail(body)
    if (!email) return response

    const { data: profile, error: profileError } =
      await this.repository.findProfileByEmail(email)

    if (profileError) {
      console.error('Forgot-password profile lookup failed:', profileError.message)
      throw new PasswordRecoveryWorkflowError(
        'Unable to process your request. Please try again.',
        500
      )
    }

    if (profile?.status !== 'active' || !profile.auth_user_id) return response

    const token = randomBytes(32).toString('base64url')
    const expiresAt = this.now() + RESET_LIFETIME_MS
    const digest = tokenDigest(token)
    const timer = setTimeout(() => this.#forget(digest), RESET_LIFETIME_MS)
    timer.unref()
    this.#links.set(digest, { profile, expiresAt, timer })
    try {
      // The fragment stays out of HTTP access logs and referrer URLs.
      await this.repository.sendResetLink(profile, `${this.clientUrl}/reset-password#token=${token}`)
    } catch (error) {
      this.#forget(digest)
      throw error
    }
    return response
  }

  checkLink(body) {
    const { link, serverNow } = this.#validLink(body?.token)
    return { expiresAt: link.expiresAt, serverNow }
  }

  async resetPassword(body) {
    const password = this.service.requirePassword(body)
    const { link } = this.#validLink(body.token)
    return withMemberAccountLock(link.profile.id, () => this.#applyPassword(body.token, password))
  }

  async #applyPassword(token, password) {
    const { link, digest } = this.#validLink(token)
    const authUserId = link.profile.auth_user_id
    const { data: profile, error: profileError } =
      await this.repository.findLinkedProfile(authUserId)

    if (profileError) {
      throw new PasswordRecoveryWorkflowError('Unable to verify your account. Please try again.', 503)
    }
    if (profile?.status !== 'active' || profile.id !== link.profile.id ||
      profile.email !== link.profile.email || profile.auth_version !== link.profile.auth_version) {
      this.#forget(digest)
      throw new PasswordRecoveryWorkflowError('This link has expired or already been used.', 410)
    }

    // Recheck after database work, then consume the link before calling Auth.
    this.#validLink(token)
    this.#forget(digest)

    const { error: updateError } =
      await this.repository.setAuthPassword(authUserId, password)
    if (updateError) {
      console.error('Supabase password reset failed:', updateError.message)
      throw new PasswordRecoveryWorkflowError(
        'Unable to reset your password. Request a new link to try again.',
        500
      )
    }

    const { error: profileUpdateError } =
      await this.repository.updatePasswordState(profile)
    if (profileUpdateError) {
      console.error('Supabase password state update failed:', profileUpdateError.message)
      throw new PasswordRecoveryWorkflowError(
        'Unable to reset your password. Please try again.',
        500
      )
    }

    return { message: 'Password reset successfully. Please log in with your new password.' }
  }
}
