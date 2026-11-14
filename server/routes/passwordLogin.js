import {
  authenticatePassword,
  PasswordAuthenticationError
} from '../services/passwordAuthentication.js'
import { hasActiveFaceEnrollment } from '../services/faceVerification.js'

export function passwordLoginHandler({
  createAuthClient,
  supabase,
  loadAccount,
  createSession,
  identityVerificationEnabled = false,
  createAdminFaceChallenge,
  createTermsChallenge
}) {
  return async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    // Passwords are exact values: never trim or change their case.
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' })
    try {
      const authUser = await authenticatePassword({ createAuthClient, email, password })
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, auth_user_id, role_id, name, email, phone_number, status')
        .eq('auth_user_id', authUser.id)
        .maybeSingle()
      if (profileError) throw new Error('Unable to load the linked account profile.')
      if (!profile || profile.status !== 'active')
        return res
          .status(403)
          .json({
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
      if (!['admin', 'member'].includes(roleName))
        return res
          .status(403)
          .json({ message: 'This account does not have an application role.', code: 'ROLE_DENIED' })
      const account = await loadAccount(profile.id)
      if (
        !account ||
        account.role !== (roleName === 'member' ? 'user' : roleName) ||
        account.email.trim().toLowerCase() !== email ||
        account.authUserId !== authUser.id
      )
        return res
          .status(409)
          .json({
            message: 'Your account profile is incomplete. Please contact the administrator.',
            code: 'PROFILE_LINK_INVALID'
          })
      res.set('Cache-Control', 'no-store')
      if (roleName === 'admin' && identityVerificationEnabled) {
        if (!(await hasActiveFaceEnrollment(supabase, account.id))) {
          return res.json(createSession(account, { allowUnenrolledAdmin: true }))
        }
        const challenge = createAdminFaceChallenge(account)
        if (!challenge) {
          return res.status(503).json({
            code: 'FACE_SERVICE_UNAVAILABLE',
            message: 'Face verification is temporarily unavailable. Please contact the gym.'
          })
        }
        return res.json({ requiresFaceVerification: true, ...challenge })
      }
      return res.json({ requiresTermsAcceptance: true, ...createTermsChallenge(account) })
    } catch (error) {
      if (error instanceof PasswordAuthenticationError) {
        // Log only diagnostic codes; never passwords, tokens, or provider payloads.
        if (error.status !== 401)
          console.error(
            'Password authentication failed:',
            error.code,
            error.cause?.code || error.cause?.name || 'invalid_response'
          )
        return res.status(error.status).json({ message: error.message, code: error.code })
      }
      console.error('Login account lookup failed:', error.message)
      return res
        .status(503)
        .json({
          message: 'Unable to load your account. Please try again shortly.',
          code: 'ACCOUNT_SERVICE_UNAVAILABLE'
        })
    }
  }
}
