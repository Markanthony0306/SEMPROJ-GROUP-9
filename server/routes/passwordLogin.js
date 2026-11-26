import {
  authenticatePassword,
  PasswordAuthenticationError
} from '../services/passwordAuthentication.js'
import { BiometricError } from '../services/biometricEngine.js'
import { consumeEnrollmentTicket, issueEnrollmentTicket, issueProof } from '../services/identityProof.js'
import { MEMBER_TERMS_VERSION } from '../../shared/memberTerms.js'

const FAILED_LOGIN_LIMIT = 5
const LOGIN_LOCK_MS = 15 * 60_000
const MAX_LOGIN_BUCKETS = 10_000

export function acceptMemberTermsHandler({ jwtSecret, supabase, loadAccount, createSession }) {
  return async (req, res) => {
    const { termsTicket, accepted, version } = req.body || {}
    if (accepted !== true || version !== MEMBER_TERMS_VERSION)
      return res.status(400).json({ message: 'Accept the current member terms to continue.' })

    let claims
    try {
      claims = consumeEnrollmentTicket(termsTicket, 'member_login_terms')
    } catch (error) {
      if (error instanceof BiometricError)
        return res.status(error.status).json({ message: error.message, code: error.code })
      return res.status(403).json({ message: 'This sign-in step is invalid or expired.', code: 'INVALID_VERIFICATION' })
    }

    try {
      const account = await loadAccount(claims.memberId)
      if (!account || account.status !== 'active' || !['user', 'member'].includes(account.role) ||
        Number(account.authVersion || 0) !== Number(claims.authVersion || 0)) {
        return res.status(403).json({ message: 'The member account is no longer available.' })
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          member_terms_version: version,
          member_terms_accepted_at: new Date().toISOString()
        })
        .eq('id', account.id)
        .eq('status', 'active')
        .select('id')
        .maybeSingle()
      if (error) {
        console.error('Member terms acceptance could not be saved:', error.code || error.name || 'database_error')
        return res.status(503).json({ message: 'Unable to save your acceptance. Please try again.', code: 'TERMS_SAVE_FAILED' })
      }
      if (!data) return res.status(403).json({ message: 'The member account is no longer available.' })

      res.set('Cache-Control', 'no-store')
      if (claims.requiresFace) {
        return res.json({
          challenge: issueProof({
            purpose: 'face_login',
            memberId: account.id,
            authVersion: account.authVersion || 0,
            termsVersion: version
          }, jwtSecret, '3m')
        })
      }
      return res.json({ session: createSession(account, version) })
    } catch (error) {
      console.error('Member terms acceptance failed:', error.code || error.name || 'account_lookup_error')
      return res.status(503).json({ message: 'Unable to complete sign-in. Please try again.', code: 'TERMS_ACCEPTANCE_UNAVAILABLE' })
    }
  }
}

export function passwordLoginHandler({
  createAuthClient,
  supabase,
  loadAccount,
  createSession,
  jwtSecret
}) {
  const attempts = new Map()
  return async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    // Passwords are exact values: never trim or change their case.
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' })

    const key = `${req.ip}:${email}`
    const now = Date.now()
    if (attempts.size >= MAX_LOGIN_BUCKETS) {
      for (const [id, bucket] of attempts) {
        if (bucket.expiresAt <= now && !bucket.pending) attempts.delete(id)
      }
      if (!attempts.has(key) && attempts.size >= MAX_LOGIN_BUCKETS)
        return res.status(429).json({ message: 'Sign-in is temporarily busy. Please try again shortly.' })
    }
    let bucket = attempts.get(key)
    if (!bucket || (bucket.expiresAt <= now && !bucket.pending)) {
      bucket = { failed: 0, pending: 0, expiresAt: now + LOGIN_LOCK_MS }
      attempts.set(key, bucket)
    }
    const locked = () => {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.expiresAt - Date.now()) / 1000))
      return res.set('Retry-After', String(retryAfterSeconds)).status(429).json({
        code: 'LOGIN_LOCKED',
        message: 'Too many failed sign-in attempts. Please wait up to 15 minutes and try again.',
        retryAfterSeconds
      })
    }
    if (bucket.failed >= FAILED_LOGIN_LIMIT) return locked()
    // Reserve a slot while Supabase checks the password so concurrent requests
    // from the same IP and email cannot race past the attempt limit.
    if (bucket.failed + bucket.pending >= FAILED_LOGIN_LIMIT)
      return res.status(429).json({ message: 'Sign-in is temporarily busy. Please try again shortly.' })
    bucket.pending += 1
    let checkingPassword = true

    try {
      const authUser = await authenticatePassword({ createAuthClient, email, password })
      bucket.pending -= 1
      checkingPassword = false
      bucket.failed = 0
      if (!bucket.pending) attempts.delete(key)

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, auth_user_id, role_id, name, email, phone_number, status, member_terms_version')
        .eq('auth_user_id', authUser.id)
        .maybeSingle()
      if (profileError) throw new Error('Unable to load the linked account profile.')
      if (!profile || profile.status !== 'active')
        return res.status(403).json({
          message: 'Your account is unavailable. Please contact the gym administrator.',
          code: 'ACCOUNT_UNAVAILABLE'
        })

      const { data: roleRecord, error: roleError } = await supabase
        .from('roles')
        .select('role_name')
        .eq('role_id', profile.role_id)
        .maybeSingle()
      if (roleError || !roleRecord) throw new Error('Unable to verify account permissions.')
      const roleName = String(roleRecord.role_name).toLowerCase()
      const isMemberRole = roleName === 'member' || roleName === 'user'
      if (roleName !== 'admin' && !isMemberRole)
        return res.status(403).json({
          message: 'This account does not have an application role.',
          code: 'ROLE_DENIED'
        })

      const account = await loadAccount(profile.id)
      if (
        !account ||
        account.role !== (isMemberRole ? 'user' : roleName) ||
        account.email.trim().toLowerCase() !== email ||
        account.authUserId !== authUser.id
      )
        return res.status(409).json({
          message: 'Your account profile is incomplete. Please contact the administrator.',
          code: 'PROFILE_LINK_INVALID'
        })

      let requiresFace = false
      if (isMemberRole && jwtSecret) {
        const { data: enrollment, error: faceError } = await supabase
          .from('fitpulse_face_templates')
          .select('user_id')
          .eq('user_id', account.id)
          .maybeSingle()
        if (faceError && !['42P01', 'PGRST205'].includes(faceError.code))
          throw new Error('Unable to check biometric enrollment.')
        if (enrollment) {
          requiresFace = true
        } else if (!faceError) {
          const { data: policy, error: policyError } = await supabase
            .from('fitpulse_identity_policy')
            .select('enforced_from')
            .eq('id', 1)
            .maybeSingle()
          if (policyError) throw new Error('Unable to check biometric enrollment policy.')
          if (!policy || !account.joined || new Date(account.joined) >= new Date(policy.enforced_from))
            return res.status(403).json({
              message: 'Face enrollment is required for this member. Contact the gym administrator.',
              code: 'FACE_ENROLLMENT_REQUIRED'
            })
        }

        if (profile.member_terms_version !== MEMBER_TERMS_VERSION) {
          res.set('Cache-Control', 'no-store')
          return res.json({
            requiresTerms: true,
            termsTicket: issueEnrollmentTicket('member_login_terms', {
              memberId: account.id,
              authVersion: account.authVersion || 0,
              requiresFace
            })
          })
        }
        if (requiresFace) {
          res.set('Cache-Control', 'no-store')
          return res.json({
            requiresFace: true,
            challenge: issueProof({
              purpose: 'face_login',
              memberId: account.id,
              authVersion: account.authVersion || 0,
              termsVersion: MEMBER_TERMS_VERSION
            }, jwtSecret, '3m'),
            message: 'Facial Recognition Login Security required.'
          })
        }
        res.set('Cache-Control', 'no-store')
        return res.json(createSession(account, MEMBER_TERMS_VERSION))
      }

      res.set('Cache-Control', 'no-store')
      return res.json(createSession(account))
    } catch (error) {
      if (error instanceof PasswordAuthenticationError) {
        // Log only diagnostic codes; never passwords, tokens, or provider payloads.
        if (error.status !== 401)
          console.error(
            'Password authentication failed:',
            error.code,
            error.cause?.code || error.cause?.name || 'invalid_response'
          )
        if (error.code === 'INVALID_CREDENTIALS') {
          bucket.failed += 1
          if (bucket.failed >= FAILED_LOGIN_LIMIT) {
            bucket.expiresAt = Date.now() + LOGIN_LOCK_MS
            return locked()
          }
          return res.status(401).json({
            message: error.message,
            code: error.code,
            remainingAttempts: FAILED_LOGIN_LIMIT - bucket.failed
          })
        }
        return res.status(error.status).json({ message: error.message, code: error.code })
      }
      console.error('Login account lookup failed:', error.message)
      return res.status(503).json({
        message: 'Unable to load your account. Please try again shortly.',
        code: 'ACCOUNT_SERVICE_UNAVAILABLE'
      })
    } finally {
      if (checkingPassword) {
        bucket.pending -= 1
        if (!bucket.pending && !bucket.failed) attempts.delete(key)
      }
    }
  }
}
