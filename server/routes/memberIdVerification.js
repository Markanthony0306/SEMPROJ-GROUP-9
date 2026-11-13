import express from 'express'
import { encryptFaceDescriptor } from '../lib/face-auth.js'
import {
  assertUniqueFace, createFaceAttemptLock, FaceVerificationError, readLiveFace,
  runEnrollmentAttempt, withFaceEnrollmentLock
} from '../services/faceVerification.js'
import {
  MemberIdConverterError,
  MemberIdFileError,
  validateMemberIdFiles
} from '../services/memberIdFiles.js'
import {
  isMemberIdType,
  isoDate,
  manilaDate,
  normalizeIdNumber
} from '../services/memberIdParsing.js'
import {
  attemptLimitError,
  checkIdAttemptLimit,
  idNumberInUse,
  MemberIdError,
  memberIdProofColumns,
  memberIdTable,
  protectIdNumber,
  rejectedIdAttempts,
  saveMemberIdFiles,
  verificationUuid
} from '../services/memberIdRecords.js'
import { memberIdFileLimit, memberIdRejectedAttemptLimit } from '../../shared/memberIdTypes.js'

const path = '/admin/id-verifications'
const columns =
  'id,member_id,applicant_name,applicant_email,id_type,verification_status,face_match_score,' +
  'attempts,document_attempts,opened_by,reviewed_by,review_notes,reasons,expiry_date,revision,updated_at,' +
  memberIdProofColumns
const enrollmentStatuses = ['awaiting_face', 'verified', 'approved']
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function caseForClient(row, rejectedAttempts) {
  const remainingAttempts = Math.max(0, memberIdRejectedAttemptLimit - rejectedAttempts)
  const expired = row.expiry_date && row.expiry_date < manilaDate()
  return {
    id: row.id,
    memberId: row.member_id,
    name: row.applicant_name,
    email: row.applicant_email,
    idType: row.id_type,
    status: expired ? 'rejected' : row.verification_status,
    faceMatchScore: row.face_match_score,
    attempts: row.attempts,
    documentAttempts: row.document_attempts,
    reviewedBy: row.reviewed_by,
    reviewNotes: row.review_notes,
    reasons: expired ? [...row.reasons, 'The approved document has since expired.'] : row.reasons,
    updatedAt: row.updated_at,
    hasDocuments: row.has_documents,
    faceEnrolled: row.face_enrolled,
    rejectedAttempts,
    remainingAttempts,
    canEnroll:
      !row.member_id &&
      row.has_documents &&
      remainingAttempts > 0 &&
      enrollmentStatuses.includes(row.verification_status) &&
      !expired
  }
}

export function memberIdVerificationRoutes({
  supabase,
  authenticate,
  requireRole,
  rateLimit,
  key,
  faceKey,
  challenges,
  validAccountInput
}) {
  const router = express.Router()
  const cases = () => supabase.from(memberIdTable)
  const access = [authenticate, requireRole('admin', 'staff')]
  const adminAccess = [authenticate, requireRole('admin')]
  const reserveFaceAttempt = createFaceAttemptLock()
  const view = async (row) =>
    caseForClient(row, await rejectedIdAttempts(supabase, row.applicant_email))

  function route(handler) {
    return async (req, res) => {
      res.set('Cache-Control', 'no-store')
      try {
        await handler(req, res)
      } catch (cause) {
        const error = cause.code === 'P5405' ? attemptLimitError() : cause
        if (error instanceof MemberIdError || error instanceof FaceVerificationError) {
          if (error.retryAfter) res.set('Retry-After', String(error.retryAfter))
          return res.status(error.status).json({ message: error.message, code: error.code })
        }
        if (error instanceof MemberIdFileError)
          return res.status(422).json({ message: error.message, code: 'ID_UNREADABLE' })
        if (error instanceof MemberIdConverterError)
          return res.status(503).json({ message: error.message, code: 'ID_READER_UNAVAILABLE' })
        if (['PGRST202', 'PGRST205', '42P01', '42703'].includes(error.code)) {
          return res.status(503).json({
            code: 'ID_VERIFICATION_SCHEMA_MISSING',
            message:
              'ID verification needs Supabase migrations 010 and 011. Ask the gym admin to apply them.'
          })
        }
        console.error('Member ID verification failed:', error.code || error.name || 'unknown error')
        return res
          .status(503)
          .json({ message: 'ID verification is unavailable. Try again or contact the gym admin.' })
      }
    }
  }

  async function loadCase(req) {
    if (!verificationUuid.test(req.params.id))
      throw new MemberIdError(404, 'Verification was not found.')
    const { data, error } = await cases().select(columns).eq('id', req.params.id).maybeSingle()
    if (error) throw error
    if (!data || (req.user.role !== 'admin' && (data.member_id || data.opened_by !== req.user.id)))
      throw new MemberIdError(404, 'Verification was not found.')
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

  function requireOpen(row) {
    if (row.member_id) throw new MemberIdError(409, 'This ID belongs to an existing member.')
  }

  function requireKey() {
    if (!key)
      throw new MemberIdError(
        503,
        'ID verification needs a server encryption key. Contact the gym admin.'
      )
  }

  async function resetAttempts(email, actorId) {
    const { error } = await supabase.rpc('reset_fitpulse_id_rejections', {
      p_email: email,
      p_actor: actorId
    })
    if (error) throw error
  }

  router.get(
    path,
    ...access,
    route(async (req, res) => {
      const page = Math.min(1000, Math.max(0, Number.parseInt(req.query.page, 10) || 0))
      let query = cases().select(columns)
      if (req.user.role !== 'admin')
        query = query.is('member_id', null).eq('opened_by', req.user.id)
      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .order('id')
        .range(page * 25, page * 25 + 25)
      if (error) throw error
      const visible = data.slice(0, 25)
      const counts = new Map()
      if (visible.length) {
        const { data: attempts, error: countError } = await supabase
          .from('member_id_rejected_emails')
          .select('email,rejected_attempts')
          .in('email', [...new Set(visible.map((row) => row.applicant_email))])
        if (countError) throw countError
        for (const row of attempts) counts.set(row.email, row.rejected_attempts)
      }
      return res.json({
        cases: visible.map((row) => caseForClient(row, counts.get(row.applicant_email) || 0)),
        hasMore: data.length > 25
      })
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
      await checkIdAttemptLimit(supabase, input.email)
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
      if (
        !data ||
        (req.user.role !== 'admin' && data.opened_by !== req.user.id) ||
        data.applicant_name !== input.name
      ) {
        throw new MemberIdError(
          409,
          'A verification already exists for this email. Ask the gym admin to review it.'
        )
      }
      return res.json({ verification: await view(data) })
    })
  )

  router.get(
    path + '/:id',
    ...access,
    route(async (req, res) => {
      return res.json({ verification: await view(await loadCase(req)) })
    })
  )

  const readUpload = express.raw({
    type: 'multipart/form-data',
    limit: 2 * memberIdFileLimit + 32 * 1024,
    inflate: false
  })
  let readingDocuments = 0
  router.post(
    path + '/:id/document',
    ...access,
    rateLimit({ max: 30 }),
    route(async (req, res) => {
      requireKey()
      const row = await loadCase(req)
      requireOpen(row)
      await checkIdAttemptLimit(supabase, row.applicant_email)
      const type = req.query.type
      if (!isMemberIdType(type)) throw new MemberIdError(400, 'Choose a supported ID type.')
      if (!req.is('multipart/form-data'))
        throw new MemberIdError(
          415,
          'Upload the ID using the front and back slots or the document slot.'
        )
      if (readingDocuments >= 2)
        throw new MemberIdError(429, 'The ID reader is busy. Try again in a moment.')
      readingDocuments += 1
      try {
        let form
        try {
          await new Promise((resolve, reject) =>
            readUpload(req, res, (error) => (error ? reject(error) : resolve()))
          )
          form = await new Response(req.body, {
            headers: { 'Content-Type': req.get('Content-Type') }
          }).formData()
        } catch (error) {
          if (error.type === 'entity.too.large')
            throw new MemberIdError(413, 'Upload ID files up to 5 MB each.')
          throw new MemberIdError(400, 'The ID upload could not be read. Select the files again.')
        }
        const entries = [...form.entries()]
        if (entries.length < 1 || entries.length > 2)
          throw new MemberIdError(
            400,
            'Upload exactly one front and one back image, or one document.'
          )
        const files = await Promise.all(
          entries.map(async ([side, file]) => {
            if (typeof file === 'string' || !['front', 'back', 'document'].includes(side))
              throw new MemberIdError(
                400,
                'Upload exactly one front and one back image, or one document.'
              )
            if (!file.size || file.size > memberIdFileLimit)
              throw new MemberIdError(
                413,
                'Each ID file must contain data and be no larger than 5 MB.'
              )
            return { side, mimeType: file.type, bytes: Buffer.from(await file.arrayBuffer()) }
          })
        )
        await validateMemberIdFiles(files)
        await saveMemberIdFiles(supabase, key, row.id, req.user.id, type, files, row.revision)
        return res.json({ verification: await view(await loadCase(req)) })
      } finally {
        readingDocuments -= 1
      }
    })
  )

  async function faceEnrollmentCase(req) {
    const row = await loadCase(req)
    requireOpen(row)
    const verification = await view(row)
    if (!verification.remainingAttempts) throw attemptLimitError()
    if (!verification.canEnroll)
      throw new MemberIdError(409, 'Upload both sides of the ID or wait for the review before enrolling a face.')
    if (!faceKey)
      throw new MemberIdError(503, 'Face enrollment is unavailable. Contact the gym admin.')
    return row
  }

  router.post(path + '/:id/face/challenge', ...adminAccess, rateLimit({ max: 10 }), route(async (req, res) => {
    const row = await faceEnrollmentCase(req)
    return res.json(challenges.issue({
      userId: row.id, actorId: req.user.id, revision: row.revision,
      authVersion: req.user.authVersion || 0, scope: 'member-creation'
    }))
  }))

  router.post(
    path + '/:id/face',
    ...adminAccess,
    route(async (req, res) => {
      const row = await faceEnrollmentCase(req)
      const challenge = challenges.consume(req.body?.challengeToken, req.user.id, row.id, 'member-creation')
      if (!challenge || challenge.revision !== row.revision || challenge.authVersion !== (req.user.authVersion || 0))
        throw new FaceVerificationError('FACE_CHALLENGE_EXPIRED', 'This capture expired. Start a new live check.', 400)
      const saved = await runEnrollmentAttempt(reserveFaceAttempt, row.applicant_email, async () => {
        const descriptor = await readLiveFace(req.body?.frames, challenge.actions)
        return withFaceEnrollmentLock(async () => {
          await assertUniqueFace(supabase, faceKey, descriptor)
          return update(row, req.user.id, 'face_enrolled', {
            staged_face_encrypted: encryptFaceDescriptor(descriptor, faceKey, { liveEnrollment: true }),
            face_enrolled: true
          })
        })
      })
      return res.json({ verification: await view(saved) })
    })
  )

  router.post(
    path + '/:id/request-review',
    ...access,
    route(async (req, res) => {
      const row = await loadCase(req)
      requireOpen(row)
      await checkIdAttemptLimit(supabase, row.applicant_email)
      if (!row.has_documents || row.verification_status !== 'awaiting_face')
        throw new MemberIdError(409, 'Upload the ID before requesting a review.')
      const result = await update(row, req.user.id, 'manual_review_requested', {
        verification_status: 'needs_review'
      })
      return res.json({ verification: await view(result) })
    })
  )

  router.post(
    path + '/:id/review',
    ...adminAccess,
    rateLimit({ max: 30 }),
    route(async (req, res) => {
      const row = await loadCase(req)
      requireOpen(row)
      await checkIdAttemptLimit(supabase, row.applicant_email)
      if (
        !row.has_documents ||
        !['needs_review', 'awaiting_face'].includes(row.verification_status)
      )
        throw new MemberIdError(409, 'Upload the ID before deciding this case.')
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
        requireKey()
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
      } else {
        changes.staged_face_encrypted = null
        changes.face_enrolled = false
      }
      const result = await update(row, req.user.id, 'manual_' + decision, changes)
      return res.json({ verification: await view(result) })
    })
  )

  router.delete(
    path + '/:id',
    ...adminAccess,
    rateLimit({ max: 30 }),
    route(async (req, res) => {
      const row = await loadCase(req)
      const { data, error } = await cases()
        .delete()
        .eq('id', row.id)
        .eq('revision', row.revision)
        .select('id')
        .maybeSingle()
      if (error) throw error
      if (!data) throw new MemberIdError(409, 'This verification changed. Refresh before deleting.')
      return res.json({ message: 'ID review and stored files deleted.' })
    })
  )

  router.post(
    path + '/reset-attempts',
    ...adminAccess,
    rateLimit({ max: 30 }),
    route(async (req, res) => {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
      if (email.length > 254 || !emailPattern.test(email))
        throw new MemberIdError(400, 'Enter a valid email address.')
      await resetAttempts(email, req.user.id)
      return res.json({ message: 'Rejected attempts reset.' })
    })
  )

  router.post(
    path + '/:id/reset-attempts',
    ...adminAccess,
    rateLimit({ max: 30 }),
    route(async (req, res) => {
      const row = await loadCase(req)
      await resetAttempts(row.applicant_email, req.user.id)
      return res.json({
        message: 'Rejected attempts reset.',
        verification: await view(await loadCase(req))
      })
    })
  )

  return router
}
