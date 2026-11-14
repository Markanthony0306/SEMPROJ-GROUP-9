import 'dotenv/config'
import { readFile, stat } from 'node:fs/promises'
import { extname } from 'node:path'
import sharp from 'sharp'
import { memberIdFileLimit, memberIdDocumentTypes } from '../shared/memberIdTypes.js'
import { supabase } from '../server/lib/supabase.js'
import { facesMatch, parseFaceEncryptionKey } from '../server/lib/face-auth.js'
import { readDocumentPortrait, saveFaceEnrollment } from '../server/services/faceVerification.js'
import { memberIdFrontImage, validateMemberIdFiles } from '../server/services/memberIdFiles.js'

const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.pdf': memberIdDocumentTypes[0],
  '.doc': memberIdDocumentTypes[1],
  '.docx': memberIdDocumentTypes[2]
}

async function readInput(path, label) {
  const details = await stat(path)
  if (!details.isFile() || details.size === 0 || details.size > memberIdFileLimit) {
    throw new Error(`${label} must be a file up to 5 MB.`)
  }
  return readFile(path)
}

async function readPortrait(bytes, label) {
  const input = sharp(bytes, { limitInputPixels: 20_000_000, failOn: 'warning' })
  const metadata = await input.metadata()
  if (!['jpeg', 'png'].includes(metadata.format) || (metadata.pages || 1) !== 1) {
    throw new Error(`${label} must be a single JPG or PNG image.`)
  }
  const { data, info } = await input
    .autoOrient()
    .resize(1700, 1700, { fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#fff' })
    .toColourspace('srgb')
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const portrait = await readDocumentPortrait({ data, width: info.width, height: info.height })
  if (!portrait) throw new Error(`${label} must contain one clear, fully visible face.`)
  return portrait
}

try {
  const args = process.argv.slice(2)
  const idOnly = args[0] === '--id-only'
  if (idOnly) args.shift()
  const email = args.shift()
  const facePath = idOnly ? null : args.shift()
  const idPaths = args
  if (!email || (!idOnly && !facePath) || idPaths.length < 1 || idPaths.length > 2) {
    throw new Error(
      'Usage: node scripts/provision-admin-face.mjs <admin-email> <supervised-face.jpg> <ID files>\n' +
      '   or: node scripts/provision-admin-face.mjs --id-only <admin-email> <ID files>'
    )
  }
  const key = parseFaceEncryptionKey()
  if (!key)
    throw new Error(
      'Set a stable 64-character hex FACE_ENCRYPTION_KEY in the private API environment.'
    )

  const { data: account, error } = await supabase
    .from('users')
    .select('id,auth_user_id,role_id')
    .eq('email', email.trim().toLowerCase())
    .eq('status', 'active')
    .maybeSingle()
  if (error) throw error
  if (!account?.auth_user_id)
    throw new Error('An active administrator account with a linked sign-in is required.')
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('role_name')
    .eq('role_id', account.role_id)
    .maybeSingle()
  if (roleError) throw roleError
  if (role?.role_name.toLowerCase() !== 'admin')
    throw new Error('The supplied account is not an administrator.')

  const sides = idPaths.length === 1 ? ['document'] : ['front', 'back']
  const idFiles = await Promise.all(
    idPaths.map(async (path, index) => ({
      side: sides[index],
      mimeType: mimeTypes[extname(path).toLowerCase()],
      bytes: await readInput(path, 'Each ID upload')
    }))
  )
  await validateMemberIdFiles(idFiles)
  const idFront = await memberIdFrontImage(idFiles[0])
  const adminIdPortrait = await readPortrait(idFront, 'The ID front')
  const descriptor = idOnly ? null : await readPortrait(
    await readInput(facePath, 'The enrollment photo'),
    'The enrollment photo'
  )
  if (!idOnly && !facesMatch(descriptor, adminIdPortrait)) {
    throw new Error('The enrollment photo does not match the ID portrait.')
  }
  await saveFaceEnrollment(supabase, { userId: account.id, descriptor, key, adminIdPortrait })
  console.log(idOnly
    ? 'Administrator ID is ready. Sign in again and set up face sign-in in Settings.'
    : 'Administrator face sign-in is ready. Existing sessions have expired.')
} catch (error) {
  console.error(error.message || 'Administrator face provisioning failed.')
  process.exitCode = 1
}
