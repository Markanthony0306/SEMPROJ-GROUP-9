import {
  memberIdDocumentTypes,
  memberIdFileLimit,
  memberIdImageTypes
} from '../../shared/memberIdTypes'

const [pdfType, docType, docxType] = memberIdDocumentTypes
const textDecoder = new TextDecoder()

function hasSignature(bytes, signature) {
  return signature.every((byte, index) => bytes[index] === byte)
}

function isWordDocument(bytes) {
  // Word 97–2003 shares its container header with other Office formats.
  const wordStreamName = 'WordDocument\0'
  for (let offset = 512; offset + 128 <= bytes.length; offset += 128) {
    if (bytes[offset + 66] !== 2 || bytes[offset + 64] !== wordStreamName.length * 2) continue
    if (
      [...wordStreamName].every(
        (character, index) =>
          bytes[offset + index * 2] === character.charCodeAt(0) &&
          bytes[offset + index * 2 + 1] === 0
      )
    )
      return true
  }
  return false
}

function isWordArchive(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  // Look through the ZIP directory. Other ZIP-based files can share the DOCX header.
  const searchStart = Math.max(0, bytes.length - 65557)
  for (let end = bytes.length - 22; end >= searchStart; end -= 1) {
    if (view.getUint32(end, true) !== 0x06054b50) continue
    if (end + 22 + view.getUint16(end + 20, true) !== bytes.length) continue

    let entry = view.getUint32(end + 16, true)
    const directoryEnd = entry + view.getUint32(end + 12, true)
    if (directoryEnd !== end) return false
    const requiredFiles = new Set(['[Content_Types].xml', 'word/document.xml'])
    while (entry + 46 <= directoryEnd) {
      if (view.getUint32(entry, true) !== 0x02014b50) return false
      const nameEnd = entry + 46 + view.getUint16(entry + 28, true)
      const nextEntry =
        nameEnd + view.getUint16(entry + 30, true) + view.getUint16(entry + 32, true)
      if (nextEntry > directoryEnd) return false
      requiredFiles.delete(textDecoder.decode(bytes.subarray(entry + 46, nameEnd)))
      entry = nextEntry
    }
    return entry === directoryEnd && requiredFiles.size === 0
  }
  return false
}

function detectType(bytes) {
  if (hasSignature(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (hasSignature(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (hasSignature(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return pdfType
  if (
    hasSignature(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) &&
    isWordDocument(bytes)
  )
    return docType
  if (hasSignature(bytes, [0x50, 0x4b, 0x03, 0x04]) && isWordArchive(bytes)) return docxType
  return ''
}

export async function validateMemberIdFile(file, side) {
  const allowedTypes = side === 'document' ? memberIdDocumentTypes : memberIdImageTypes
  const formatLabel = side === 'document' ? 'PDF, DOC, or DOCX document' : 'JPG or PNG image'
  if (!file.size || file.size > memberIdFileLimit) {
    throw new Error('Choose a file larger than 0 bytes and no larger than 5 MB.')
  }

  const type = detectType(new Uint8Array(await file.arrayBuffer()))
  if (!allowedTypes.includes(type)) {
    throw new Error(`Choose a valid ${formatLabel}. FitPulse checks the file contents.`)
  }
  const reportedType = file.type.toLowerCase()
  if (reportedType && reportedType !== 'application/octet-stream' && reportedType !== type) {
    throw new Error(`The file type does not match its contents. Choose a valid ${formatLabel}.`)
  }
  return reportedType === type
    ? file
    : new File([file], file.name, { type, lastModified: file.lastModified })
}
