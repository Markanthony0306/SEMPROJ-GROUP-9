import crypto from 'node:crypto'

export const FACE_DESCRIPTOR_LENGTH = 128

export function parseFaceEncryptionKey(value = process.env.FACE_ENCRYPTION_KEY) {
  if (typeof value !== 'string' || !/^[a-f\d]{64}$/i.test(value)) return null
  return Buffer.from(value, 'hex')
}

export function normalizeFaceDescriptor(value) {
  if (
    !Array.isArray(value) ||
    value.length !== FACE_DESCRIPTOR_LENGTH ||
    !value.every((entry) => typeof entry === 'number' && Number.isFinite(entry) && Math.abs(entry) <= 2)
  ) {
    return null
  }
  return value
}

export function encryptFaceDescriptor(descriptor, key) {
  const normalized = normalizeFaceDescriptor(descriptor)
  if (!normalized || !Buffer.isBuffer(key) || key.length !== 32)
    throw new Error('A valid face descriptor and encryption key are required.')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(normalized), 'utf8'),
    cipher.final()
  ])
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.')
}

export function decryptFaceDescriptor(payload, key) {
  if (typeof payload !== 'string' || !Buffer.isBuffer(key) || key.length !== 32)
    throw new Error('Stored face descriptor is invalid.')
  const [ivPart, tagPart, encryptedPart, ...extra] = payload.split('.')
  if (!ivPart || !tagPart || !encryptedPart || extra.length) throw new Error('Stored face descriptor is invalid.')
  const iv = Buffer.from(ivPart, 'base64url')
  const tag = Buffer.from(tagPart, 'base64url')
  const encrypted = Buffer.from(encryptedPart, 'base64url')
  if (iv.length !== 12 || tag.length !== 16 || !encrypted.length)
    throw new Error('Stored face descriptor is invalid.')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const clear = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
  const descriptor = normalizeFaceDescriptor(JSON.parse(clear))
  if (!descriptor) throw new Error('Stored face descriptor is invalid.')
  return descriptor
}

export function faceDescriptorDistance(left, right) {
  const a = normalizeFaceDescriptor(left)
  const b = normalizeFaceDescriptor(right)
  if (!a || !b) return Number.POSITIVE_INFINITY
  let squared = 0
  for (let index = 0; index < FACE_DESCRIPTOR_LENGTH; index += 1) {
    const difference = a[index] - b[index]
    squared += difference * difference
  }
  return Math.sqrt(squared)
}
