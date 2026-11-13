import crypto from 'node:crypto'

export const FACE_DESCRIPTOR_LENGTH = 128
// face-api.js distances are smaller for closer matches. Keep one stricter cutoff.
export const FACE_MATCH_THRESHOLD = 0.50
const DESCRIPTOR_CACHE_MS = 60_000
const DESCRIPTOR_CACHE_SIZE = 64
const descriptorCaches = new WeakMap()
const LIVE_ENROLLMENT_VERSION = 'blink-and-turn-v1'

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

export function encryptFaceDescriptor(descriptor, key, { liveEnrollment = false } = {}) {
  const normalized = normalizeFaceDescriptor(descriptor)
  if (!normalized || !Buffer.isBuffer(key) || key.length !== 32)
    throw new Error('A valid face descriptor and encryption key are required.')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const stored = liveEnrollment ? { version: LIVE_ENROLLMENT_VERSION, descriptor: normalized } : normalized
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(stored), 'utf8'),
    cipher.final()
  ])
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.')
}

export function decryptFaceDescriptor(payload, key, { requireLiveEnrollment = false } = {}) {
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
  const stored = JSON.parse(clear)
  const liveEnrollment = stored?.version === LIVE_ENROLLMENT_VERSION
  if (requireLiveEnrollment && !liveEnrollment) return null
  const descriptor = normalizeFaceDescriptor(liveEnrollment ? stored.descriptor : stored)
  if (!descriptor) throw new Error('Stored face descriptor is invalid.')
  return descriptor
}

// Read the current record first. Its exact ciphertext (or digest) is the
// version key, so an old result cannot stand in for a changed or deleted row.
export async function cacheFaceDescriptor(key, version, read) {
  let cache = descriptorCaches.get(key)
  if (!cache) {
    cache = new Map()
    descriptorCaches.set(key, cache)
  }
  const remove = (version) => {
    clearTimeout(cache.get(version)?.timer)
    cache.delete(version)
  }
  const cached = cache.get(version)
  if (cached?.expiresAt > Date.now()) return cached.descriptor
  remove(version)

  const descriptor = normalizeFaceDescriptor(await read())
  if (!descriptor) return null
  remove(version)
  if (cache.size >= DESCRIPTOR_CACHE_SIZE) remove(cache.keys().next().value)
  cache.set(version, {
    descriptor: Object.freeze(descriptor),
    expiresAt: Date.now() + DESCRIPTOR_CACHE_MS,
    timer: setTimeout(() => cache.delete(version), DESCRIPTOR_CACHE_MS).unref()
  })
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

export function facesMatch(left, right) {
  return faceDescriptorDistance(left, right) <= FACE_MATCH_THRESHOLD
}

export function requiresFaceAndId(role) {
  return role === 'admin' || role === 'user'
}
