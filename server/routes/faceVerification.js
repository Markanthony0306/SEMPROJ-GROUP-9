import { Router } from 'express'
import { facesMatch, requiresFaceAndId } from '../lib/face-auth.js'
import {
  FaceVerificationError,
  createFaceAttemptLock,
  hasActiveFaceEnrollment,
  readAccountFaceEnrollment,
  readLiveFace,
  runEnrollmentAttempt,
  saveFaceEnrollment
} from '../services/faceVerification.js'
import { getMemberIdPortrait, MemberIdError } from '../services/memberIdRecords.js'
import { authenticatePassword, PasswordAuthenticationError } from '../services/passwordAuthentication.js'

const unavailable = {
  code: 'FACE_SERVICE_UNAVAILABLE',
  message: 'Face verification is temporarily unavailable. Please contact the gym if this continues.'
}

export function faceVerificationRoutes({
  supabase, authenticate, requireRole, rateLimit, loadAccount, createSession,
  staffFaceEnabled, identityVerificationEnabled = false, key, memberIdKey, challenges, createAuthClient,
  reserveAttempt = createFaceAttemptLock()
}) {
  const router = Router()
  const reserveEnrollmentAttempt = createFaceAttemptLock()
  const checkEnabled = (_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    if (!key) return res.status(503).json(unavailable)
    next()
  }
  const activeAccount = (account, challenge) =>
    account?.status === 'active' && account.role === challenge.role &&
    (account.authVersion || 0) === challenge.authVersion

  router.post('/auth/accept-terms', rateLimit({ max: 20 }), async (req, res) => {
    res.set('Cache-Control', 'no-store')
    if (req.body?.accepted !== true)
      return res.status(400).json({ message: 'Please agree to the terms before continuing.' })
    const pending = challenges.consumeTerms(req.body?.termsToken)
    if (!pending)
      return res.status(401).json({ message: 'Your sign-in expired. Log in again to continue.' })
    try {
      const account = await loadAccount(pending.userId)
      if (!activeAccount(account, pending) || (account.role === 'admin' && identityVerificationEnabled))
        return res.status(403).json({ message: 'Your account is unavailable. Please log in again.' })
      const issueFaceChallenge = () => res.json({
        requiresFaceVerification: true,
        ...challenges.issue({
          userId: account.id,
          authVersion: pending.authVersion,
          role: account.role
        })
      })
      if (account.role === 'user' && identityVerificationEnabled) {
        return key ? issueFaceChallenge() : res.status(503).json(unavailable)
      }
      if (staffFaceEnabled) {
        const { data: enrollment, error } = await supabase
          .from('face_enrollments')
          .select('enrollment_id')
          .eq('user_id', account.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (error) throw error
        if (enrollment) return key ? issueFaceChallenge() : res.status(503).json(unavailable)
      }
      return res.json(createSession(account))
    } catch (error) {
      console.error('Terms acceptance failed:', error.message)
      return res.status(503).json({ message: 'Unable to continue. Please log in again.' })
    }
  })
  router.post('/auth/face-verify', checkEnabled, async (req, res) => {
    const challenge = challenges.consume(req.body?.challengeToken)
    if (!challenge)
      return res.status(401).json({ message: 'Face verification expired. Log in again to retry.' })
    const attempt = reserveAttempt(challenge.userId)
    if (attempt.retryAfter) {
      res.set('Retry-After', String(attempt.retryAfter))
      return res.status(429).json({
        code: 'FACE_ATTEMPT_LIMIT',
        message: 'Face verification is temporarily locked. Please wait before signing in again.'
      })
    }
    let failed = false
    let verified = false
    try {
      const account = await loadAccount(challenge.userId)
      if (!activeAccount(account, challenge))
        return res.status(403).json({ message: 'Your account is unavailable. Please log in again.' })

      const descriptor = await readLiveFace(req.body?.frames, challenge.actions)
      const enrollment = await readAccountFaceEnrollment(supabase, account.id, key, account.role === 'admin')
      if (!enrollment?.descriptor) {
        throw new FaceVerificationError('FACE_NOT_ENROLLED', 'Face sign-in has not been set up for this account. Contact the gym.', 403)
      }
      if (!facesMatch(descriptor, enrollment.descriptor)) {
        throw new FaceVerificationError('FACE_MISMATCH', 'Your live face does not match the enrolled face.')
      }

      if (identityVerificationEnabled && requiresFaceAndId(account.role)) {
        if (account.role === 'user' && !memberIdKey) return res.status(503).json(unavailable)
        const portrait = account.role === 'admin'
          ? enrollment.idPortrait
          : await getMemberIdPortrait(supabase, account.id, memberIdKey)
        if (!portrait) {
          throw new FaceVerificationError('ID_UNREADABLE', 'The ID portrait could not be read. Ask the gym to update your ID.', 422)
        }
        if (!facesMatch(descriptor, portrait)) {
          throw new FaceVerificationError('FACE_MISMATCH', 'Your live face does not match the portrait on your ID.')
        }
      }

      const verificationToken = challenges.issueProof(challenge, enrollment.id)
      verified = true
      return res.json({ verificationToken })
    } catch (error) {
      if (error instanceof FaceVerificationError || (error instanceof MemberIdError && error.code === 'ID_UNREADABLE')) {
        failed = error instanceof FaceVerificationError && [400, 401].includes(error.status)
        return res.status(error.status).json({ code: error.code, message: `${error.message} Log in again to retry.` })
      }
      console.error('Face verification failed:', error.code || error.name)
      return res.status(503).json(unavailable)
    } finally {
      attempt.finish({ failed, verified })
    }
  })
  router.post('/auth/face-session', rateLimit({ max: 10 }), checkEnabled, async (req, res) => {
    const proof = challenges.consumeProof(req.body?.verificationToken)
    if (!proof) return res.status(401).json({ message: 'Face verification expired. Log in again to retry.' })
    try {
      const [account, stillEnrolled] = await Promise.all([
        loadAccount(proof.userId),
        hasActiveFaceEnrollment(supabase, proof.userId, proof.enrollmentId)
      ])
      if (!activeAccount(account, proof) || !stillEnrolled)
        return res.status(403).json({ message: 'Your account is unavailable. Please log in again.' })
      return res.json(createSession(account, { faceVerified: true }))
    } catch (error) {
      console.error('Face session failed:', error.code || error.name)
      return res.status(503).json(unavailable)
    }
  })

  const path = '/admin/members/:id/face-enrollment'
  const enrollmentAccess = [
    authenticate, requireRole('admin'), rateLimit({ max: 10 }), checkEnabled,
    async (req, res, next) => {
      const account = await loadAccount(req.params.id)
      if (!account || account.status !== 'active' ||
        (account.role !== 'user' && account.id !== req.user.id))
        return res.status(404).json({ message: 'Active account not found.' })
      req.faceAccount = account
      next()
    }
  ]
  router.post(path + '/challenge', rateLimit({ max: 10 }), ...enrollmentAccess, (req, res) =>
    res.json(challenges.issue({
      userId: req.faceAccount.id, actorId: req.user.id, authVersion: req.user.authVersion || 0
    }))
  )
  router.post(path, ...enrollmentAccess, async (req, res) => {
    const account = req.faceAccount
    const selfEnrollment = account.id === req.user.id
    if (req.body?.consent !== true || (!selfEnrollment && req.body?.idChecked !== true))
      return res.status(400).json({ message: 'Record consent and confirm the physical ID check for members.' })
    const challenge = challenges.consume(req.body?.challengeToken, req.user.id, account.id)
    if (!challenge || challenge.authVersion !== (req.user.authVersion || 0))
      return res.status(400).json({ message: 'The capture expired. Start a new capture.' })

    try {
      if (selfEnrollment) {
        const password = req.body?.currentPassword
        if (typeof password !== 'string' || !password || Buffer.byteLength(password, 'utf8') > 72)
          return res.status(400).json({ message: 'Enter your current password.' })
        const user = await authenticatePassword({ createAuthClient, email: account.email, password })
        if (user.id !== account.authUserId)
          return res.status(403).json({ message: 'The current password could not be verified.' })
      }
      await runEnrollmentAttempt(reserveEnrollmentAttempt, account.id, async () => {
        const descriptor = await readLiveFace(req.body?.frames, challenge.actions)
        let expectedId
        if (account.role === 'admin') {
          const enrollment = await readAccountFaceEnrollment(supabase, account.id, key, true)
          if (!enrollment?.idPortrait)
            throw new FaceVerificationError('ID_UNREADABLE', 'The administrator ID portrait must be provisioned by the gym.', 422)
          if (!facesMatch(descriptor, enrollment.idPortrait))
            throw new FaceVerificationError('FACE_MISMATCH', 'Your live face does not match the portrait on your ID.')
          expectedId = enrollment.id
        }
        await saveFaceEnrollment(supabase, { userId: account.id, descriptor, key, expectedId })
      })
      return res.status(201).json({
        message: 'Face verification is ready for this account.',
        signInRequired: account.role === 'admin' && req.user.faceVerified !== true
      })
    } catch (error) {
      if (error instanceof PasswordAuthenticationError)
        return res.status(error.status === 401 ? 400 : error.status).json({ message: error.message })
      if (error instanceof FaceVerificationError) {
        if (error.retryAfter) res.set('Retry-After', String(error.retryAfter))
        return res.status(error.status === 401 && error.code !== 'FACE_MISMATCH' ? 400 : error.status)
          .json({ code: error.code, message: error.message })
      }
      console.error('Face enrollment failed:', error.code || error.name)
      return res.status(503).json({ message: 'Could not save face enrollment. Please try again.' })
    }
  })
  return router
}
