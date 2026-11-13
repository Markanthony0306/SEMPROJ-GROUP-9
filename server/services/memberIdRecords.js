import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto'
import sharp from 'sharp'
import { memberIdRejectedAttemptLimit } from '../../shared/memberIdTypes.js'
import { assertUniqueFace, readDocumentPortrait } from './faceVerification.js'
import { cacheFaceDescriptor, decryptFaceDescriptor } from '../lib/face-auth.js'
import { memberIdFrontImage, MemberIdFileError } from './memberIdFiles.js'
import { manilaDate } from './memberIdParsing.js'

export const memberIdTable = 'member_id_verifications'
export const verificationUuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
export const memberIdProofColumns = 'has_documents,face_enrolled'
const fileTable = 'member_id_verification_files'
const rejectedEmailTable = 'member_id_rejected_emails'

export class MemberIdError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

export const attemptLimitError = () =>
  new MemberIdError(
    409,
    'Too many rejected attempts. Please contact the gym admin.',
    'ID_ATTEMPT_LIMIT'
  )

export async function rejectedIdAttempts(supabase, email) {
  const { data, error } = await supabase
    .from(rejectedEmailTable)
    .select('rejected_attempts')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()
  if (error) throw error
  return data?.rejected_attempts || 0
}

export async function checkIdAttemptLimit(supabase, email) {
  if ((await rejectedIdAttempts(supabase, email)) >= memberIdRejectedAttemptLimit)
    throw attemptLimitError()
}

function fileKey(key) {
  if (!key) throw new Error('ID encryption is unavailable.')
  return createHmac('sha256', key).update('fitpulse document files v1').digest()
}

const fileContext = (id, side, type) => Buffer.from(JSON.stringify([id, side, type]))

function protectFile(key, id, { side, mimeType, bytes }) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', fileKey(key), iv)
  cipher.setAAD(fileContext(id, side, mimeType))
  const ciphertext = Buffer.concat([cipher.update(bytes), cipher.final()])
  return {
    side,
    mime_type: mimeType,
    ciphertext: Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64')
  }
}

function unprotectFile(key, id, { side, mime_type: mimeType, encrypted_file: stored }) {
  if (typeof stored !== 'string' || !stored.startsWith('\\x'))
    throw new Error('The stored ID is unavailable.')
  const data = Buffer.from(stored.slice(2), 'hex')
  const decipher = createDecipheriv('aes-256-gcm', fileKey(key), data.subarray(0, 12))
  decipher.setAAD(fileContext(id, side, mimeType))
  decipher.setAuthTag(data.subarray(12, 28))
  const bytes = Buffer.concat([decipher.update(data.subarray(28)), decipher.final()])
  return { side, mimeType, bytes }
}

export async function saveMemberIdFiles(
  supabase,
  key,
  id,
  actorId,
  idType,
  files,
  revision,
  memberId
) {
  const { data, error } = await supabase.rpc('save_fitpulse_member_id_files', {
    p_id: id,
    p_revision: revision,
    p_actor: actorId,
    p_id_type: idType,
    p_files: files.map((file) => protectFile(key, id, file)),
    ...(memberId ? { p_member_id: memberId } : {})
  })
  if (error) throw error
  if (!data) throw new MemberIdError(409, 'This verification changed. Reopen it and try again.')
}

export async function getMemberIdPortrait(supabase, memberId, key) {
  const unreadable = () =>
    new MemberIdError(
      422,
      'The saved ID is unreadable or missing. Ask the gym admin to update it.',
      'ID_UNREADABLE'
    )
  const { data: proof, error: proofError } = await supabase
    .from(memberIdTable)
    .select('id,verification_status,has_documents,expiry_date')
    .eq('member_id', memberId)
    .maybeSingle()
  if (proofError) throw proofError
  if (
    !proof?.has_documents ||
    !['verified', 'approved', 'awaiting_face'].includes(proof.verification_status) ||
    (proof.expiry_date && proof.expiry_date < manilaDate())
  )
    throw unreadable()

  const { data, error } = await supabase
    .from(fileTable)
    .select('side,mime_type,encrypted_file')
    .eq('verification_id', proof.id)
    .in('side', ['front', 'document'])
    .maybeSingle()
  if (error) throw error
  if (typeof data?.encrypted_file !== 'string') throw unreadable()
  if (!key) throw new Error('ID encryption is unavailable.')
  const digest = createHash('sha256').update(data.encrypted_file).digest('hex')
  const version = JSON.stringify([proof.id, data.side, data.mime_type, digest])
  const portrait = await cacheFaceDescriptor(key, version, async () => {
    let file
    try {
      file = unprotectFile(key, proof.id, data)
    } catch {
      throw unreadable()
    }
    try {
      const image = await memberIdFrontImage(file)
      const { data: pixels, info } = await sharp(image)
        .toColourspace('srgb')
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
      return await readDocumentPortrait({ data: pixels, width: info.width, height: info.height })
    } catch (error) {
      if (error instanceof MemberIdFileError) throw unreadable()
      throw error
    }
  })
  if (!portrait) throw unreadable()
  return portrait
}

export function protectIdNumber(key, type, number, issuer = 'PHL') {
  const encryptionKey = createHmac('sha256', key).update('fitpulse document encryption v1').digest()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv)
  const ciphertext = Buffer.concat([cipher.update(number, 'utf8'), cipher.final()])
  const fingerprint = createHmac('sha256', key)
    .update(JSON.stringify(['fitpulse document fingerprint v1', type, issuer, number]))
    .digest('hex')
  return {
    id_number: [iv, cipher.getAuthTag(), ciphertext]
      .map((part) => part.toString('base64url'))
      .join('.'),
    id_fingerprint: fingerprint
  }
}

export async function idNumberInUse(supabase, fingerprint) {
  const { data, error } = await supabase
    .from(memberIdTable)
    .select('id')
    .eq('id_fingerprint', fingerprint)
    .not('member_id', 'is', null)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}

export async function requireMemberIdApproval(supabase, actor, input, verificationId) {
  await checkIdAttemptLimit(supabase, input.email)
  const required = () =>
    new MemberIdError(
      409,
      'Upload both sides of the ID and enroll a face before creating this account.',
      'ID_VERIFICATION_REQUIRED'
    )
  if (typeof verificationId !== 'string' || !verificationUuid.test(verificationId)) throw required()
  const { data, error } = await supabase
    .from(memberIdTable)
    .select(
      'id,member_id,opened_by,applicant_name,applicant_email,verification_status,expiry_date,id_fingerprint,' +
        memberIdProofColumns
    )
    .eq('id', verificationId)
    .maybeSingle()
  if (error) throw error
  if (
    !data ||
    data.member_id ||
    !data.has_documents ||
    !data.face_enrolled ||
    !['awaiting_face', 'verified', 'approved'].includes(data.verification_status) ||
    (actor.role !== 'admin' && data.opened_by !== actor.id) ||
    data.applicant_name !== input.name ||
    data.applicant_email !== input.email ||
    (data.expiry_date && data.expiry_date < manilaDate())
  )
    throw required()
  if (data.id_fingerprint && (await idNumberInUse(supabase, data.id_fingerprint)))
    throw new MemberIdError(409, 'This ID is already linked to a member.', 'DUPLICATE_MEMBER_ID')
  return data.id
}

// Call while holding the enrollment lock, immediately before the profile
// insert activates the staged descriptor through the database trigger.
export async function assertUniqueStagedFace(supabase, verificationId, key) {
  const { data, error } = await supabase.from(memberIdTable)
    .select('staged_face_encrypted')
    .eq('id', verificationId)
    .is('member_id', null)
    .maybeSingle()
  if (error) throw error
  if (!key || !data?.staged_face_encrypted) {
    throw new MemberIdError(409, 'Complete face enrollment before creating this account.', 'ID_VERIFICATION_REQUIRED')
  }
  const descriptor = decryptFaceDescriptor(data.staged_face_encrypted, key, { requireLiveEnrollment: true })
  if (!descriptor)
    throw new MemberIdError(409, 'Ask an administrator to retake the face capture before creating this account.', 'FACE_RECAPTURE_REQUIRED')
  await assertUniqueFace(supabase, key, descriptor)
}
