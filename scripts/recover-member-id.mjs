import { randomUUID } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import sharp from 'sharp'
import { supabase } from '../server/lib/supabase.js'
import { parseFaceEncryptionKey } from '../server/lib/face-auth.js'
import { readDocumentPortrait } from '../server/services/faceVerification.js'
import {
  memberIdFileType,
  memberIdFrontImage,
  validateMemberIdFiles
} from '../server/services/memberIdFiles.js'
import { isMemberIdType } from '../server/services/memberIdParsing.js'
import { memberIdTable, saveMemberIdFiles } from '../server/services/memberIdRecords.js'
import { memberIdFileLimit } from '../shared/memberIdTypes.js'

async function findAccount(email) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Account was not found.')
  return data.id
}

async function idFile(side, path) {
  const details = await stat(path)
  if (!details.isFile() || !details.size || details.size > memberIdFileLimit)
    throw new Error('Each ID file must contain data and be no larger than 5 MB.')
  const bytes = await readFile(path)
  return { side, mimeType: memberIdFileType(bytes), bytes }
}

try {
  const [adminEmail, memberEmail, idType, frontPath, backPath, ...extra] = process.argv.slice(2)
  if (!adminEmail || !memberEmail || !isMemberIdType(idType) || !frontPath || extra.length)
    throw new Error(
      'Usage: node scripts/recover-member-id.mjs <admin-email> <member-email> <id-type> <document-or-front> [back]'
    )
  const key = parseFaceEncryptionKey(
    process.env.ID_VERIFICATION_KEY || process.env.FACE_ENCRYPTION_KEY
  )
  if (!key)
    throw new Error(
      'Set the stable ID_VERIFICATION_KEY or FACE_ENCRYPTION_KEY in the API environment.'
    )

  const files = backPath
    ? await Promise.all([idFile('front', frontPath), idFile('back', backPath)])
    : [await idFile('document', frontPath)]
  await validateMemberIdFiles(files)
  const image = await memberIdFrontImage(files[0])
  const { data, info } = await sharp(image)
    .toColourspace('srgb')
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  if (!(await readDocumentPortrait({ data, width: info.width, height: info.height })))
    throw new Error('The ID front must contain one clear, fully visible portrait.')

  const [actorId, memberId] = await Promise.all([findAccount(adminEmail), findAccount(memberEmail)])
  const { data: proof, error } = await supabase
    .from(memberIdTable)
    .select('id,revision')
    .eq('member_id', memberId)
    .maybeSingle()
  if (error) throw error
  await saveMemberIdFiles(
    supabase,
    key,
    proof?.id || randomUUID(),
    actorId,
    idType,
    files,
    proof?.revision ?? null,
    memberId
  )
  console.log('Member ID files updated. Sign in again to verify against the enrolled face and ID.')
} catch (error) {
  console.error(error.message || 'Could not recover the member ID.')
  process.exitCode = 1
}
