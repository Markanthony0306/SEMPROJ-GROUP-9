import { Router } from 'express'
import { verifyBiometric, BiometricError } from '../services/biometricEngine.js'
import { ensurePhoto, ensureIdPdf, ensureFrames, ensureMotion, issueProof, readProof, issueEnrollmentTicket, readEnrollmentTicket, consumeFaceChallenge, validEmbedding } from '../services/identityProof.js'
import { composeMemberName, normalizeNamePart } from '../../shared/memberName.js'
import { MEMBER_TERMS_VERSION } from '../../shared/memberTerms.js'

const TYPE_SET = new Set(['philid', 'ephilid', 'drivers_license', 'passport', 'umid'])

function respondFailure(res, error) {
  if (error instanceof BiometricError)
    return res.status(error.status).json({ message: error.message, code: error.code })
  console.error('Identity verification failed:', error?.name || 'UnknownError')
  return res.status(503).json({ message: 'Verification is temporarily unavailable.', code: 'BIOMETRIC_UNAVAILABLE' })
}

/** All evidence is ephemeral. Only a normalized face embedding is stored after registration. */
export function identityVerificationRoutes({ authenticate, requireRole, rateLimit, jwtSecret, supabase, loadAccount, createSession, engine = verifyBiometric }) {
  const router = Router()
  function readMemberFaceProof(challenge) {
    const proof = readProof(challenge, 'face_login', jwtSecret)
    if (proof.termsVersion !== MEMBER_TERMS_VERSION)
      throw new BiometricError('Accept the current member terms before facial verification.', 'TERMS_REQUIRED', 403)
    return proof
  }
  // Live previews run in memory; they do not enroll members or write camera images.
  router.post('/admin/identity/id-guidance', authenticate, requireRole('admin'), rateLimit({ max: 400 }), async (req, res) => {
    try {
      const result = await engine({
        task: 'id-guidance',
        image: ensurePhoto(req.body?.image),
        idType: req.body?.idType,
        side: req.body?.side,
        firstName: req.body?.firstName,
        lastName: req.body?.lastName ?? req.body?.surname
      })
      res.set('Cache-Control', 'no-store')
      return res.json(result)
    } catch (error) { return respondFailure(res, error) }
  })

  router.post('/admin/identity/face-guidance', authenticate, requireRole('admin'), rateLimit({ max: 400 }), async (req, res) => {
    try {
      const proof = readEnrollmentTicket(req.body?.ticket, 'id_verified')
      if (proof.actorId !== req.user.id) return res.status(403).json({ message: 'ID check does not belong to this admin.' })
      const result = await engine({ task: 'face-guidance', image: ensurePhoto(req.body?.image) })
      res.set('Cache-Control', 'no-store')
      return res.json(result)
    } catch (error) { return respondFailure(res, error) }
  })

  router.post('/auth/face-guidance', rateLimit({ max: 400 }), async (req, res) => {
    try {
      readMemberFaceProof(req.body?.challenge)
      const result = await engine({ task: 'face-guidance', image: ensurePhoto(req.body?.image) })
      res.set('Cache-Control', 'no-store')
      return res.json(result)
    } catch (error) { return respondFailure(res, error) }
  })

  router.post('/admin/identity/verify-id', authenticate, requireRole('admin'), rateLimit({ max: 20 }), async (req, res) => {
    try {
      const { name: submittedName, firstName: submittedFirstName, email, idType, consent, image, backImage, document } = req.body || {}
      const submittedLastName = req.body?.lastName ?? req.body?.surname
      const hasSplitName = submittedFirstName !== undefined || submittedLastName !== undefined
      const firstName = normalizeNamePart(submittedFirstName)
      const lastName = normalizeNamePart(submittedLastName)
      const name = hasSplitName
        ? composeMemberName(firstName, lastName)
        : normalizeNamePart(submittedName)
      const nameParts = hasSplitName ? { firstName, lastName } : {}
      if (consent !== true) return res.status(400).json({ message: 'Member consent is required before capturing their ID.' })
      if (!TYPE_SET.has(idType)) return res.status(400).json({ message: 'Choose a supported ID type.' })
      if (hasSplitName && !firstName) return res.status(400).json({ message: "Enter the member's first name." })
      if (hasSplitName && !lastName) return res.status(400).json({ message: "Enter the member's last name." })
      if (typeof name !== 'string' || name.trim().length < 3 || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email))
        return res.status(400).json({ message: 'Enter the member details first.' })
      if (name.length > 100) return res.status(400).json({ message: 'First name and last name must total 100 characters or fewer.' })
      // Card photos require two separately uploaded/captured sides; passports only
      // require the photo/details page. A PDF is a single submitted document and
      // may contain one or two pages, decoded locally by the biometric worker.
      const source = document
        ? { document: ensureIdPdf(document) }
        : { image: ensurePhoto(image), ...(idType === 'passport' ? {} : { backImage: ensurePhoto(backImage) }) }
      const result = await engine({ task: 'id', ...source, name, ...nameParts, idType })
      if (!validEmbedding(result.embedding)) throw new BiometricError('ID portrait verification could not finish.')
      const ticket = issueEnrollmentTicket('id_verified', { actorId: req.user.id, name, ...nameParts, email: email.trim().toLowerCase(), idType, embedding: result.embedding })
      res.set('Cache-Control', 'no-store')
      return res.json({ ticket, message: 'ID type, first name, last name and portrait checked.' })
    } catch (error) { return respondFailure(res, error) }
  })

  router.post('/admin/identity/verify-face', authenticate, requireRole('admin'), rateLimit({ max: 20 }), async (req, res) => {
    try {
      const { ticket, frames, motion } = req.body || {}
      const proof = readEnrollmentTicket(ticket, 'id_verified')
      if (proof.actorId !== req.user.id || !validEmbedding(proof.embedding))
        return res.status(403).json({ message: 'ID verification does not belong to this admin.' })
      const result = await engine({ task: 'face', frames: ensureFrames(frames), motion: ensureMotion(motion), embedding: proof.embedding })
      if (!validEmbedding(result.embedding)) throw new BiometricError('Face enrollment could not finish.')
      const enrollmentProof = issueEnrollmentTicket('member_enrollment', {
        actorId: req.user.id,
        name: proof.name,
        ...(proof.firstName ? { firstName: proof.firstName } : {}),
        ...((proof.lastName ?? proof.surname) ? { lastName: proof.lastName ?? proof.surname } : {}),
        email: proof.email,
        idType: proof.idType,
        embedding: result.embedding
      })
      res.set('Cache-Control', 'no-store')
      return res.json({ enrollmentProof, message: 'The live face matches the ID portrait.' })
    } catch (error) { return respondFailure(res, error) }
  })

  router.post('/auth/face-login', rateLimit({ max: 10 }), async (req, res) => {
    try {
      const { challenge, frames, motion } = req.body || {}
      const proof = readMemberFaceProof(challenge)
      const account = await loadAccount(proof.memberId)
      if (!account || account.status !== 'active' || account.role !== 'user' || (account.authVersion || 0) !== proof.authVersion)
        return res.status(403).json({ message: 'The member account is no longer available.' })
      const { data: enrollment, error } = await supabase.from('fitpulse_face_templates').select('embedding').eq('user_id', account.id).maybeSingle()
      if (error || !validEmbedding(enrollment?.embedding))
        return res.status(503).json({ message: 'Registered face unavailable. Contact the gym administrator.' })
      await engine({ task: 'face', frames: ensureFrames(frames), motion: ensureMotion(motion), embedding: enrollment.embedding })
      consumeFaceChallenge(proof.nonce, proof.exp)
      res.set('Cache-Control', 'no-store')
      return res.json(createSession(account, proof.termsVersion))
    } catch (error) { return respondFailure(res, error) }
  })
  return router
}
