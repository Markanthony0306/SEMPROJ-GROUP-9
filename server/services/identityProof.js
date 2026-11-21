import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { BiometricError } from './biometricEngine.js'

const MAX_IMAGE_LENGTH = 5_500_000
export function ensurePhoto(photo) {
  if (typeof photo !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[\w+/=]+$/i.test(photo) || photo.length > MAX_IMAGE_LENGTH)
    throw new BiometricError('Capture a clear photo (JPEG, PNG or WebP, up to 4 MB).', 'INVALID_IMAGE', 400)
  return photo
}
// One PDF upload may contain the front and back pages in the same document.
// Its bytes never leave the local verification worker or get stored in Supabase.
export function ensureIdPdf(document) {
  if (typeof document !== 'string' || !/^data:application\/pdf;base64,[A-Za-z0-9+/=]+$/i.test(document) || document.length > MAX_IMAGE_LENGTH)
    throw new BiometricError('Upload one PDF smaller than 4 MB.', 'INVALID_PDF', 400)
  return document
}
export function ensureFrames(frames) {
  for (const step of ['right', 'left', 'front']) ensurePhoto(frames?.[step])
  return frames
}
export function ensureMotion(motion) {
  if (!motion || typeof motion !== 'object' || Array.isArray(motion))
    throw new BiometricError('Complete the live head-turn check before continuing.', 'MOTION_REQUIRED', 400)
  const clean = {}
  for (const step of ['right', 'left']) {
    const sample = motion[step]
    if (!sample || typeof sample !== 'object' || Array.isArray(sample))
      throw new BiometricError('Look forward, then turn your head during each live scan.', 'MOTION_REQUIRED', 400)
    clean[step] = { neutral: ensurePhoto(sample.neutral), turned: ensurePhoto(sample.turned) }
  }
  return clean
}
export function issueProof(claims, secret, expiresIn = '5m') {
  return jwt.sign({ ...claims, purpose: claims.purpose, nonce: crypto.randomUUID() }, secret, { expiresIn, algorithm: 'HS256' })
}
export function readProof(token, purpose, secret) {
  try {
    const claims = jwt.verify(token, secret, { algorithms: ['HS256'] })
    if (claims.purpose !== purpose || typeof claims.nonce !== 'string') throw new Error('Wrong ticket')
    return claims
  } catch {
    throw new BiometricError('This verification expired or is invalid. Start the identity check again.', 'INVALID_VERIFICATION', 403)
  }
}
export function normalizeIdentity(value) { return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ') }
export function assertSameMember(proof, input) {
  if (normalizeIdentity(proof.name) !== normalizeIdentity(input.name) || normalizeIdentity(proof.email) !== normalizeIdentity(input.email))
    throw new BiometricError('Make sure ID details matches with the entered details', 'ID_DETAILS_MISMATCH', 422)
}
export function validEmbedding(input) {
  return Array.isArray(input) && input.length === 128 && input.every(value => Number.isFinite(value))
}

// Enrollment templates must never be placed in a browser-visible JWT:
// JWT contents are signed, not encrypted. Keep biometric data on the server.
const enrollmentTickets = new Map()
const TICKET_TTL_MS = 5 * 60 * 1000
export function issueEnrollmentTicket(purpose, claims) {
  const now = Date.now()
  if (enrollmentTickets.size > 5000) {
    for (const [token, value] of enrollmentTickets) if (value.expiresAt < now) enrollmentTickets.delete(token)
    // On an overloaded single-server demo, fail closed instead of unbounded memory.
    if (enrollmentTickets.size > 5000) throw new BiometricError('Too many active verification sessions. Retry shortly.', 'VERIFICATION_BUSY', 503)
  }
  const token = crypto.randomBytes(32).toString('base64url')
  enrollmentTickets.set(token, { purpose, claims, expiresAt: now + TICKET_TTL_MS })
  return token
}
export function readEnrollmentTicket(ticket, purpose) {
  const value = typeof ticket === 'string' ? enrollmentTickets.get(ticket) : null
  if (!value || value.purpose !== purpose || value.expiresAt <= Date.now()) {
    enrollmentTickets.delete(ticket)
    throw new BiometricError('This verification expired or is invalid. Start the identity check again.', 'INVALID_VERIFICATION', 403)
  }
  return value.claims
}
export function consumeEnrollmentTicket(ticket, purpose) {
  const claims = readEnrollmentTicket(ticket, purpose)
  enrollmentTickets.delete(ticket)
  return claims
}

const spentFaceChallenges = new Map()
export function consumeFaceChallenge(nonce, expirySeconds) {
  const now = Date.now()
  if (spentFaceChallenges.size > 5000) {
    for (const [key, expiry] of spentFaceChallenges) if (expiry < now) spentFaceChallenges.delete(key)
    if (spentFaceChallenges.size > 5000) throw new BiometricError('Too many active login challenges.', 'VERIFICATION_BUSY', 503)
  }
  if (spentFaceChallenges.has(nonce)) throw new BiometricError('This facial login challenge has already been used. Sign in again.', 'INVALID_VERIFICATION', 403)
  spentFaceChallenges.set(nonce, Math.min(Number(expirySeconds) * 1000 || now + 180000, now + 180000))
}
