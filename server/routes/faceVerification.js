import { Router } from 'express'
import { encryptFaceDescriptor, faceDescriptorDistance } from '../lib/face-auth.js'
import { readFaceEnrollments, readLiveFace } from '../services/faceVerification.js'
import { authenticatePassword, PasswordAuthenticationError } from '../services/passwordAuthentication.js'

export function faceVerificationRoutes({
  supabase, authenticate, requireRole, rateLimit, loadAccount, createSession,
  enabled, key, threshold, challenges, createAuthClient
}) {
  const router = Router()
  const matches = (sample, saved) => faceDescriptorDistance(sample, saved) <= threshold
  const checkEnabled = (_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    if (!enabled || !key)
      return res.status(503).json({ message: 'Face verification is not enabled.' })
    next()
  }
  router.post('/auth/face-verify', rateLimit({ max: 5 }), checkEnabled, async (req, res) => {
    const challenge = challenges.consume(req.body?.challengeToken)
    if (!challenge)
      return res.status(401).json({ message: 'Face verification expired. Log in again to retry.' })
    try {
      const descriptor = await readLiveFace(req.body?.frames, challenge.action, threshold)
      if (!descriptor)
        return res.status(401).json({ message: 'The live face check failed. Log in again to retry.' })
      const enrolled = await readFaceEnrollments(supabase, key)
      const matching = enrolled.filter((row) => matches(descriptor, row.descriptor))
      if (!matching.length || matching.some((row) => row.userId !== challenge.userId))
        return res.status(401).json({ message: 'Face verification failed. Contact the gym if it continues.' })

      const account = await loadAccount(challenge.userId)
      if (!account || account.status !== 'active' || (account.authVersion || 0) !== challenge.authVersion)
        return res.status(403).json({ message: 'Your account is unavailable. Please log in again.' })
      return res.json(createSession(account))
    } catch (error) {
      console.error('Face verification failed:', error.message)
      return res.status(503).json({ message: 'Face verification is temporarily unavailable.' })
    }
  })

  const path = '/admin/members/:id/face-enrollment'
  const enrollmentAccess = [
    authenticate, requireRole('admin', 'staff'), rateLimit({ max: 10 }), checkEnabled,
    async (req, res, next) => {
      const account = await loadAccount(req.params.id)
      if (!account || account.status !== 'active' ||
        (account.role !== 'user' && account.id !== req.user.id))
        return res.status(404).json({ message: 'Active account not found.' })
      req.faceAccount = account
      next()
    }
  ]
  router.post(path + '/challenge', ...enrollmentAccess, (req, res) =>
    res.json(challenges.issue({ userId: req.faceAccount.id, actorId: req.user.id }))
  )
  router.post(path, ...enrollmentAccess, async (req, res) => {
    const account = req.faceAccount
    const selfEnrollment = account.id === req.user.id
    if (req.body?.consent !== true || (!selfEnrollment && req.body?.idChecked !== true))
      return res.status(400).json({ message: 'Record consent and confirm the physical ID check for members.' })
    const challenge = challenges.consume(req.body?.challengeToken, req.user.id, account.id)
    if (!challenge)
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
      const descriptor = await readLiveFace(req.body?.frames, challenge.action, threshold)
      if (!descriptor)
        return res.status(400).json({ message: 'The live face check failed. Start a new capture.' })
      const encrypted = encryptFaceDescriptor(descriptor, key)
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const enrolled = await readFaceEnrollments(supabase, key)
        if (enrolled.some((row) => row.userId !== account.id && matches(descriptor, row.descriptor)))
          return res.status(409).json({ message: 'This face matches another enrollment. Contact the gym administrator.' })
        // Commit only against the same set of templates that we compared.
        const { data: saved, error } = await supabase.rpc('save_fitpulse_face_enrollment', {
          p_user_id: account.id,
          p_checked_ids: enrolled.map((row) => row.id),
          p_encrypted_descriptor: encrypted
        })
        if (error) throw error
        if (saved) return res.status(201).json({ message: 'Face verification is ready for this account.' })
      }
      return res.status(409).json({ message: 'Face enrollments changed. Start a new capture.' })
    } catch (error) {
      if (error instanceof PasswordAuthenticationError)
        return res.status(error.status === 401 ? 400 : error.status).json({ message: error.message })
      console.error('Face enrollment failed:', error.message)
      return res.status(503).json({ message: 'Could not save face enrollment. Please try again.' })
    }
  })
  return router
}
