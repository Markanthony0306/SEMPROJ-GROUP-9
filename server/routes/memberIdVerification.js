import express from 'express'
import { createFaceChallenges } from '../services/faceVerification.js'
import { compareMemberIdFace, MemberIdImageError, scanMemberId } from '../services/memberIdScan.js'
import {
  isMemberIdType,
  isoDate,
  manilaDate,
  namesMatch,
  normalizeIdNumber
} from '../services/memberIdParsing.js'
import {
  idNumberInUse,
  MemberIdError,
  memberIdTable,
  protectIdNumber,
  verificationUuid
} from '../services/memberIdRecords.js'
import { memberIdAttemptLimit, memberIdImageLimit } from '../../shared/memberIdTypes.js'

const path = '/admin/id-verifications'
const columns =
  'id,member_id,applicant_name,applicant_email,id_type,verification_status,face_match_score,' +
  'attempts,document_attempts,opened_by,reviewed_by,review_notes,reasons,expiry_date,document_passed,revision,updated_at'
const finalized = ['verified', 'approved']
const isExpiredApproval = (row) =>
  finalized.includes(row.verification_status) && row.expiry_date && row.expiry_date < manilaDate()
const isWorking = (row) =>
  ['reading_document', 'checking_face'].includes(row.verification_status) &&
  Date.now() - Date.parse(row.updated_at) < 120_000
const recognized = (field) => Boolean(field?.value && field.confidence >= 75)

function caseForClient(row, canScanFace = false) {
  return {
    id: row.id,
    name: row.applicant_name,
    email: row.applicant_email,
    idType: row.id_type,
    status: row.verification_status,
    faceMatchScore: row.face_match_score,
    attempts: row.attempts,
    documentAttempts: row.document_attempts,
    reviewedBy: row.reviewed_by,
    reviewNotes: row.review_notes,
    reasons: row.reasons,
    updatedAt: row.updated_at,
    processing: isWorking(row),
    canScanFace
  }
}

export function memberIdVerificationRoutes({
  supabase,
  authenticate,
  requireRole,
  rateLimit,
  key,
  threshold,
  validAccountInput
}) {
  const router = express.Router()
  const cases = () => supabase.from(memberIdTable)
  const challenges = createFaceChallenges()
  const portraits = new Map()
  let readingDocument = false
  const access = [authenticate, requireRole('admin', 'staff')]

  function canAccess(row, actor) {
    return row && !row.member_id && (actor.role === 'admin' || row.opened_by === actor.id)
  }

  function currentPortrait(row) {
    const entry = portraits.get(row.id)
    return entry?.attempt === row.document_attempts && entry.expiresAt > Date.now() ? entry : null
  }

  function view(row) {
    if (isExpiredApproval(row))
      return caseForClient({
        ...row,
        verification_status: 'rejected',
        reasons: [...row.reasons, 'The approved document has since expired.']
      })
    const faceState = ['awaiting_face', 'needs_review', 'rejected', 'checking_face']
    return caseForClient(
      row,
      faceState.includes(row.verification_status) &&
        !isWorking(row) &&
        row.attempts < memberIdAttemptLimit &&
        Boolean(currentPortrait(row))
    )
  }

  function route(handler) {
    return async (req, res) => {
      res.set('Cache-Control', 'no-store')
      try {
        if (!key)
          throw new MemberIdError(
            503,
            'ID verification needs a server encryption key. Contact the administrator.'
          )
        await handler(req, res)
      } catch (error) {
        if (error instanceof MemberIdError)
          return res.status(error.status).json({ message: error.message, code: error.code })
        if (['PGRST205', '42P01', '42703'].includes(error.code)) {
          return res.status(503).json({
            code: 'ID_VERIFICATION_SCHEMA_MISSING',
            message: 'ID verification needs Supabase migration 010. Ask the administrator to apply it and try again.'
          })
        }
        console.error('Member ID verification failed:', error.code || error.name || 'unknown error')
        return res
          .status(503)
          .json({
            message: 'ID verification is unavailable. Check the server setup and try again.'
          })
      }
    }
  }

  async function loadCase(req) {
    if (!verificationUuid.test(req.params.id))
      throw new MemberIdError(404, 'Verification was not found.')
    const { data, error } = await cases().select(columns).eq('id', req.params.id).maybeSingle()
    if (error) throw error
    if (!canAccess(data, req.user)) throw new MemberIdError(404, 'Verification was not found.')
    return data
  }

  async function update(row, actorId, event, changes) {
    const { data, error } = await cases()
      .update({ ...changes, updated_by: actorId, event })
      .eq('id', row.id)
      .eq('revision', row.revision)
      .is('member_id', null)
      .select(columns)
      .maybeSingle()
    if (error) throw error
    if (!data)
      throw new MemberIdError(409, 'This verification changed. Reopen it to see the latest result.')
    return data
  }

  function requireAvailable(row) {
    if (isWorking(row))
      throw new MemberIdError(409, 'A check is still running. Wait for the result and refresh.')
    if (finalized.includes(row.verification_status) && !isExpiredApproval(row))
      throw new MemberIdError(409, 'This verification has already been approved.')
  }

  router.get(
    path,
    ...access,
    route(async (req, res) => {
      const page = Math.min(1000, Math.max(0, Number.parseInt(req.query.page, 10) || 0))
      let query = cases().select(columns).is('member_id', null)
      if (req.user.role !== 'admin') query = query.eq('opened_by', req.user.id)
      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .order('id')
        .range(page * 25, page * 25 + 25)
      if (error) throw error
      return res.json({ cases: data.slice(0, 25).map(view), hasMore: data.length > 25 })
    })
  )

  router.post(
    path,
    ...access,
    rateLimit({ max: 30 }),
    route(async (req, res) => {
      if (req.body?.consent !== true)
        throw new MemberIdError(400, 'Record the member’s consent before capturing an ID or face.')
      const input = validAccountInput(req.body)
      if (input.error) throw new MemberIdError(400, input.error)
      const { data: existingMember, error: memberError } = await supabase
        .from('users')
        .select('id')
        .eq('email', input.email)
        .maybeSingle()
      if (memberError) throw memberError
      if (existingMember) throw new MemberIdError(409, 'An account with this email already exists.')

      const lookup = () =>
        cases()
          .select(columns)
          .eq('applicant_email', input.email)
          .is('member_id', null)
          .maybeSingle()
      let { data, error } = await lookup()
      if (error) throw error
      if (!data) {
        const created = await cases()
          .insert({
            applicant_name: input.name,
            applicant_email: input.email,
            opened_by: req.user.id,
            updated_by: req.user.id
          })
          .select(columns)
          .single()
        const result = created.error?.code === '23505' ? await lookup() : created
        data = result.data
        error = result.error
        if (error) throw error
      }
      if (!canAccess(data, req.user) || data.applicant_name !== input.name) {
        throw new MemberIdError(
          409,
          'A verification already exists for this email. Ask the administrator to review it.'
        )
      }
      return res.json({ verification: view(data) })
    })
  )

  router.get(
    path + '/:id',
    ...access,
    route(async (req, res) => {
      return res.json({ verification: view(await loadCase(req)) })
    })
  )

  const readUpload = express.raw({
    type: ['image/jpeg', 'image/png'],
    limit: memberIdImageLimit,
    inflate: false
  })
  router.post(
    path + '/:id/document',
    ...access,
    rateLimit({ max: 30 }),
    route(async (req, res) => {
      const row = await loadCase(req)
      requireAvailable(row)
      if (row.document_attempts >= memberIdAttemptLimit)
        throw new MemberIdError(
          409,
          'The upload limit was reached. Request an administrator review.'
        )
      const type = req.query.type
      if (!isMemberIdType(type)) throw new MemberIdError(400, 'Choose a supported ID type.')
      if (readingDocument)
        throw new MemberIdError(429, 'Another ID is being read. Try again in a moment.')
      readingDocument = true
      try {
        const started = await update(row, req.user.id, 'document_attempt_started', {
          id_type: type,
          document_attempts: row.document_attempts + 1,
          verification_status: 'reading_document',
          id_number: null,
          id_fingerprint: null,
          expiry_date: null,
          document_passed: false,
          face_match_score: null,
          reasons: []
        })
        portraits.delete(row.id)
        let scan
        try {
          await new Promise((resolve, reject) =>
            readUpload(req, res, (error) => (error ? reject(error) : resolve()))
          )
          scan = await scanMemberId(req.body, req.get('Content-Type'), type)
        } catch (error) {
          const uploadError =
            error.type === 'entity.too.large' || error.type === 'encoding.unsupported'
          const badImage = uploadError || error instanceof MemberIdImageError
          const message = uploadError
            ? 'Upload an uncompressed JPG or PNG file up to 5 MB.'
            : badImage
              ? error.message
              : 'The document check is unavailable. Try again or request review.'
          const result = await update(started, req.user.id, 'document_attempt_finished', {
            verification_status:
              started.document_attempts >= memberIdAttemptLimit || !badImage
                ? 'needs_review'
                : 'rejected',
            reasons: [message]
          })
          return res.json({ verification: view(result) })
        }

        const { fields, typeRecognized, portrait } = scan
        const reasons = []
        const today = manilaDate()
        if (!typeRecognized)
          reasons.push('The selected ID type could not be confirmed from the text.')
        if (!recognized(fields.name))
          reasons.push('The full name could not be read with enough confidence.')
        else if (!namesMatch(fields.name.value, row.applicant_name))
          reasons.push('The name on the ID differs from the member form.')
        if (!recognized(fields.idNumber))
          reasons.push('The ID number is unclear or has an unsupported format.')
        if (!recognized(fields.birthDate) || fields.birthDate.value > today)
          reasons.push('The date of birth could not be confirmed.')
        if (!recognized(fields.expiryDate)) reasons.push('An expiry date could not be confirmed.')
        if (type === 'student_id')
          reasons.push('An administrator must check the school’s ID and validity in person.')

        const protectedNumber =
          recognized(fields.idNumber) && type !== 'student_id'
            ? protectIdNumber(key, type, fields.idNumber.value)
            : null
        const expired = recognized(fields.expiryDate) && fields.expiryDate.value < today
        const duplicate =
          protectedNumber && (await idNumberInUse(supabase, protectedNumber.id_fingerprint))
        if (expired) reasons.push('This ID has expired.')
        if (duplicate) reasons.push('This ID is already linked to a member.')
        const rejected = expired || duplicate
        const result = await update(started, req.user.id, 'document_attempt_finished', {
          ...protectedNumber,
          expiry_date: recognized(fields.expiryDate) ? fields.expiryDate.value : null,
          verification_status: rejected ? 'rejected' : 'awaiting_face',
          document_passed: reasons.length === 0,
          reasons
        })
        if (!rejected) {
          const entry = {
            descriptor: portrait,
            attempt: result.document_attempts,
            reasons,
            expiresAt: Date.now() + 15 * 60_000
          }
          portraits.set(row.id, entry)
          const timer = setTimeout(() => {
            if (portraits.get(row.id) === entry) portraits.delete(row.id)
          }, 15 * 60_000)
          timer.unref()
        }
        return res.json({ verification: view(result), fields })
      } finally {
        readingDocument = false
      }
    })
  )

  function scanEntry(row) {
    requireAvailable(row)
    const entry = currentPortrait(row)
    if (!view(row).canScanFace || !entry)
      throw new MemberIdError(
        409,
        'Face capture is unavailable. Re-upload the ID or request admin review.'
      )
    return entry
  }

  router.post(
    path + '/:id/face-challenge',
    ...access,
    rateLimit({ max: 30 }),
    route(async (req, res) => {
      const row = await loadCase(req)
      scanEntry(row)
      const started = await update(row, req.user.id, 'face_attempt_started', {
        attempts: row.attempts + 1
      })
      return res.json(
        challenges.issue({
          userId: row.id,
          actorId: req.user.id,
          authVersion: started.revision,
          actions: ['blink', 'turn']
        })
      )
    })
  )

  router.post(
    path + '/:id/face',
    ...access,
    rateLimit({ max: 30 }),
    route(async (req, res) => {
      const row = await loadCase(req)
      requireAvailable(row)
      const entry = currentPortrait(row)
      const challenge = challenges.consume(req.body?.challengeToken, req.user.id, row.id)
      if (!entry || !challenge || challenge.authVersion !== row.revision)
        throw new MemberIdError(400, 'The face prompt expired. Start a new capture.')
      const started = await update(row, req.user.id, 'face_frames_received', {
        verification_status: 'checking_face',
        reasons: entry.reasons
      })
      let outcome
      try {
        outcome = await compareMemberIdFace(
          req.body?.frames,
          challenge.action,
          entry.descriptor,
          threshold
        )
      } catch {
        outcome = {
          status: 'needs_review',
          score: null,
          reason: 'The face check is unavailable. Retake the scan or request review.'
        }
      }
      const reasons = [...entry.reasons, ...(outcome.reason ? [outcome.reason] : [])]
      const status =
        outcome.status === 'verified' && !row.document_passed ? 'needs_review' : outcome.status
      const result = await update(started, req.user.id, 'face_attempt_finished', {
        verification_status: status,
        reasons,
        face_match_score: outcome.score
      })
      if (status === 'verified' || result.attempts >= memberIdAttemptLimit) portraits.delete(row.id)
      return res.json({ verification: view(result) })
    })
  )

  router.post(
    path + '/:id/request-review',
    ...access,
    route(async (req, res) => {
      const row = await loadCase(req)
      requireAvailable(row)
      if (!row.document_attempts)
        throw new MemberIdError(400, 'Upload the ID before requesting a review.')
      const result = await update(row, req.user.id, 'manual_review_requested', {
        verification_status: 'needs_review'
      })
      portraits.delete(row.id)
      return res.json({ verification: view(result) })
    })
  )

  router.post(
    path + '/:id/review',
    authenticate,
    requireRole('admin'),
    rateLimit({ max: 30 }),
    route(async (req, res) => {
      const row = await loadCase(req)
      requireAvailable(row)
      if (
        !['needs_review', 'rejected'].includes(row.verification_status) &&
        !isExpiredApproval(row)
      )
        throw new MemberIdError(409, 'Request a manual review before deciding this case.')
      const { decision, inspected, idNumber, expiryDate, noExpiry, issuer } = req.body || {}
      const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : ''
      if (!['approve', 'reject'].includes(decision) || !notes || notes.length > 600)
        throw new MemberIdError(
          400,
          'Select a decision and enter review notes up to 600 characters.'
        )
      const changes = {
        reviewed_by: req.user.id,
        review_notes: notes,
        verification_status: 'rejected'
      }
      if (decision === 'approve') {
        if (inspected !== true)
          throw new MemberIdError(
            400,
            'Confirm you checked the original document and the member in person.'
          )
        const number = normalizeIdNumber(row.id_type, idNumber)
        if (!number) throw new MemberIdError(400, 'Enter a valid number for this document type.')
        const school =
          typeof issuer === 'string'
            ? issuer.trim().normalize('NFKC').toLowerCase().replace(/\s+/g, ' ')
            : ''
        if (row.id_type === 'student_id' && (!school || school.length > 120))
          throw new MemberIdError(400, 'Enter the issuing school.')
        const expiry = isoDate(expiryDate)
        const withoutExpiry =
          noExpiry === true && ['student_id', 'national_id'].includes(row.id_type)
        if (
          (!expiry && !withoutExpiry) ||
          (expiry && expiry < manilaDate()) ||
          (withoutExpiry && expiryDate)
        )
          throw new MemberIdError(
            400,
            'Enter a valid, unexpired date or confirm that this document has no expiry.'
          )
        const protectedNumber = protectIdNumber(
          key,
          row.id_type,
          number,
          row.id_type === 'student_id' ? school : 'PHL'
        )
        if (await idNumberInUse(supabase, protectedNumber.id_fingerprint))
          throw new MemberIdError(409, 'This ID is already linked to a member.')
        Object.assign(changes, protectedNumber, {
          expiry_date: expiry,
          verification_status: 'approved'
        })
      }
      const result = await update(row, req.user.id, `manual_${decision}`, changes)
      portraits.delete(row.id)
      return res.json({ verification: view(result) })
    })
  )

  return router
}
