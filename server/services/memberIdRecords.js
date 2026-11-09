import { createCipheriv, createHmac, randomBytes } from 'node:crypto'
import { manilaDate } from './memberIdParsing.js'

export const memberIdTable = 'member_id_verifications'
export const verificationUuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i

export class MemberIdError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
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
  const required = () =>
    new MemberIdError(
      409,
      'Complete ID verification or obtain administrator approval before creating this account.',
      'ID_VERIFICATION_REQUIRED'
    )
  if (typeof verificationId !== 'string' || !verificationUuid.test(verificationId)) throw required()
  const { data, error } = await supabase
    .from(memberIdTable)
    .select(
      'id,member_id,opened_by,applicant_name,applicant_email,verification_status,expiry_date,id_fingerprint'
    )
    .eq('id', verificationId)
    .maybeSingle()
  if (error) throw error
  if (
    !data ||
    data.member_id ||
    !['verified', 'approved'].includes(data.verification_status) ||
    (actor.role !== 'admin' && data.opened_by !== actor.id) ||
    data.applicant_name !== input.name ||
    data.applicant_email !== input.email ||
    (data.expiry_date && data.expiry_date < manilaDate())
  )
    throw required()
  if (await idNumberInUse(supabase, data.id_fingerprint))
    throw new MemberIdError(409, 'This ID is already linked to a member.', 'DUPLICATE_MEMBER_ID')
  return data.id
}
