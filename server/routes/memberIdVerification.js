import express from 'express'
import { encryptFaceDescriptor, facesMatch } from '../lib/face-auth.js'
import {
  assertUniqueFace,
  createFaceAttemptLock,
  FaceVerificationError,
  readLiveFace,
  runEnrollmentAttempt,
  withFaceEnrollmentLock
} from '../services/faceVerification.js'
import {
  MemberIdConverterError,
  MemberIdFileError,
  validateMemberIdFiles
} from '../services/memberIdFiles.js'
import { isMemberIdType, manilaDate, namesMatch } from '../services/memberIdParsing.js'
import {
  idNumberInUse,
  MemberIdError,
  memberIdProofColumns,
  memberIdTable,
  protectIdNumber,
  readStoredIdPortrait,
  saveMemberIdFiles,
  verificationUuid
} from '../services/memberIdRecords.js'
import { MemberIdImageError, scanMemberId } from '../services/memberIdScan.js'
import { memberIdFileLimit } from '../../shared/memberIdTypes.js'

const path = '/admin/id-verifications'
const columns =
  'id,member_id,applicant_name,applicant_email,opened_by,expiry_date,revision,document_passed,' +
  memberIdProofColumns

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
  const access = [authenticate, requireRole('admin')]
  const reserveFaceAttempt = createFaceAttemptLock()

  function route(handler) {
    return async (req, res) => {
      res.set('Cache-Control', 'no-store')
      try {
        await handler(req, res)
      } catch (error) {
        if (error instanceof MemberIdError || error instanceof FaceVerificationError) {
          if (error.retryAfter) res.set('Retry-After', String(error.retryAfter))
          return res.status(error.status).json({ message: error.message, code: error.code })
        }
        if (error instanceof MemberIdFileError || error instanceof MemberIdImageError)
          return res.status(422).json({ message: error.message, code: 'ID_UNREADABLE' })
        if (error instanceof MemberIdConverterError)
          return res.status(503).json({ message: error.message, code: 'ID_READER_UNAVAILABLE' })
        if (['PGRST202', 'PGRST205', '42P01', '42703'].includes(error.code)) {
          return res.status(503).json({
            code: 'ID_VERIFICATION_SCHEMA_MISSING',
            message:
              'ID verification needs Supabase migrations 010, 011, and 014. Ask the gym admin to apply them.'
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
    if (!data || data.opened_by !== req.user.id)
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

      const { data, error } = await cases()
        .insert({
          applicant_name: input.name,
          applicant_email: input.email,
          opened_by: req.user.id,
          updated_by: req.user.id
        })
        .select('id')
        .single()
      if (error) throw error
      return res.status(201).json({ verification: data })
    })
  )

  // Discard a draft when the operator cancels. The member guard also covers
  // a creation request that finished before its response reached the browser.
  router.delete(
    path + '/:id/draft',
    ...access,
    route(async (req, res) => {
      const row = await loadCase(req)
      const { error } = await cases().delete().eq('id', row.id).is('member_id', null)
      if (error) throw error
      return res.sendStatus(204)
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
      const type = req.query.type
      if (!isMemberIdType(type)) throw new MemberIdError(400, 'Choose a supported ID type.')
      if (!req.is('multipart/form-data'))
        throw new MemberIdError(415, 'Scan both the front and back of the ID.')
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
            throw new MemberIdError(413, 'Each ID scan must be 5 MB or less. Rescan the ID.')
          throw new MemberIdError(400, 'The ID scans could not be read. Rescan both sides.')
        }
        const entries = [...form.entries()]
        if (entries.length !== 2 || !form.has('front') || !form.has('back'))
          throw new MemberIdError(400, 'Scan one image of each side of the ID.')
        const files = await Promise.all(
          entries.map(async ([side, file]) => {
            if (typeof file === 'string' || !['front', 'back'].includes(side))
              throw new MemberIdError(400, 'Scan one image of each side of the ID.')
            if (!file.size || file.size > memberIdFileLimit)
              throw new MemberIdError(
                413,
                'Each ID file must contain data and be no larger than 5 MB.'
              )
            return { side, mimeType: file.type, bytes: Buffer.from(await file.arrayBuffer()) }
          })
        )
        await validateMemberIdFiles(files)
        const front = files.find((file) => file.side === 'front')
        const back = files.find((file) => file.side === 'back')
        if (front.bytes.equals(back.bytes))
          throw new MemberIdError(422, 'Use a different photo for each side of the ID.')
        const frontScan = await scanMemberId(front.bytes, front.mimeType, type)
        const backScan = await scanMemberId(back.bytes, back.mimeType, type, { front: false })
        if (!frontScan.typeRecognized && !backScan.typeRecognized)
          throw new MemberIdError(
            422,
            'The photos do not look like the selected ID type. Check the type and retake the photos.'
          )

        const details = Object.fromEntries(
          Object.entries(frontScan.fields).map(([field, value]) => [
            field,
            value.value || backScan.fields[field]?.value || null
          ])
        )
        if (!details.name)
          throw new MemberIdError(
            422,
            'The member name could not be read. Retake the photo with the full name in focus.'
          )
        if (!namesMatch(details.name, row.applicant_name))
          throw new MemberIdError(
            422,
            'The name read from the ID does not match the member name. Check the spelling and retake the photo.'
          )
        const frontNumber = frontScan.fields.idNumber.value
        const backNumber = backScan.fields.idNumber.value
        if (frontNumber && backNumber && frontNumber !== backNumber)
          throw new MemberIdError(
            422,
            'The two sides show different ID numbers. Retake both sides of the same ID.'
          )
        if (details.expiryDate && details.expiryDate < manilaDate())
          throw new MemberIdError(422, 'This ID has expired. Use a current ID.')
        const protectedNumber =
          details.idNumber && type !== 'student_id'
            ? protectIdNumber(key, type, details.idNumber)
            : {}
        if (
          protectedNumber.id_fingerprint &&
          (await idNumberInUse(supabase, protectedNumber.id_fingerprint))
        )
          throw new MemberIdError(409, 'This ID is already linked to a member.')

        await saveMemberIdFiles(supabase, key, row.id, req.user.id, type, files, row.revision)
        await update({ ...row, revision: row.revision + 1 }, req.user.id, 'document_scanned', {
          ...protectedNumber,
          document_passed: true,
          expiry_date: details.expiryDate
        })
        return res.json({ details })
      } finally {
        readingDocuments -= 1
      }
    })
  )

  async function faceEnrollmentCase(req) {
    const row = await loadCase(req)
    requireOpen(row)
    if (
      !row.has_documents ||
      !row.document_passed ||
      (row.expiry_date && row.expiry_date < manilaDate())
    )
      throw new MemberIdError(409, 'Scan both sides of a current ID before enrolling a face.')
    if (!faceKey)
      throw new MemberIdError(503, 'Face enrollment is unavailable. Contact the gym admin.')
    return row
  }

  router.post(
    path + '/:id/face/challenge',
    ...access,
    rateLimit({ max: 10 }),
    route(async (req, res) => {
      const row = await faceEnrollmentCase(req)
      return res.json(
        challenges.issue({
          userId: row.id,
          actorId: req.user.id,
          revision: row.revision,
          authVersion: req.user.authVersion || 0,
          scope: 'member-creation'
        })
      )
    })
  )

  router.post(
    path + '/:id/face',
    ...access,
    route(async (req, res) => {
      const row = await faceEnrollmentCase(req)
      const challenge = challenges.consume(
        req.body?.challengeToken,
        req.user.id,
        row.id,
        'member-creation'
      )
      if (
        !challenge ||
        challenge.revision !== row.revision ||
        challenge.authVersion !== (req.user.authVersion || 0)
      )
        throw new FaceVerificationError(
          'FACE_CHALLENGE_EXPIRED',
          'This capture expired. Start a new live check.',
          400
        )
      const saved = await runEnrollmentAttempt(reserveFaceAttempt, row.id, async () => {
        const descriptor = await readLiveFace(req.body?.frames, challenge.actions, {
          closeShot: true
        })
        const portrait = await readStoredIdPortrait(supabase, row.id, key)
        if (!facesMatch(descriptor, portrait))
          throw new FaceVerificationError(
            'FACE_MISMATCH',
            'The live face did not match the ID portrait. Check the ID and try again.'
          )
        return withFaceEnrollmentLock(async () => {
          await assertUniqueFace(supabase, faceKey, descriptor)
          return update(row, req.user.id, 'face_enrolled', {
            staged_face_encrypted: encryptFaceDescriptor(descriptor, faceKey, {
              liveEnrollment: true
            }),
            face_enrolled: true
          })
        })
      })
      return res.json({ faceEnrolled: saved.face_enrolled })
    })
  )

  return router
}
