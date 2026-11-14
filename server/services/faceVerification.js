import { randomInt, randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import {
  FACE_CLOSE_MIN_SIZE, FACE_CLOSE_SCALE, FACE_EVIDENCE_COUNT, FACE_FRAME_BYTES, FACE_FRAME_HEIGHT, FACE_FRAME_WIDTH, FACE_MIN_CAMERA_FACE_SIZE,
  createFaceGestureSequence, faceActions, validFaceActions
} from '../../shared/faceLiveness.js'
import {
  cacheFaceDescriptor, decryptFaceDescriptor, encryptFaceDescriptor, facesMatch, normalizeFaceDescriptor
} from '../lib/face-auth.js'
import { withMemberAccountLock } from '../lib/memberAccountLock.js'

const modelsDirectory = fileURLToPath(new URL('../../public/models/face-api/', import.meta.url))
let models
const FACE_ATTEMPT_LIMIT = 5
const FACE_LOCK_MS = 15 * 60_000
const FACE_ATTEMPT_BUCKET_LIMIT = 10_000
const FACE_CHALLENGE_MS = 120_000
const FACE_PROOF_MS = 30_000
const faceEnrollmentLock = Symbol('face enrollment')

export const withFaceEnrollmentLock = (operation) => withMemberAccountLock(faceEnrollmentLock, operation)

export class FaceVerificationError extends Error {
  constructor(code, message, status = 401) {
    super(message)
    this.code = code
    this.status = status
  }
}

export function loadFaceModels() {
  models ||= import('face-api.js').then(async ({ default: api }) => {
    await Promise.all([
      api.nets.tinyFaceDetector.loadFromDisk(modelsDirectory),
      api.nets.faceLandmark68TinyNet.loadFromDisk(modelsDirectory),
      api.nets.faceRecognitionNet.loadFromDisk(modelsDirectory)
    ])
    return api
  }).catch((error) => {
    models = null
    throw error
  })
  return models
}

export function createFaceAttemptLock(now = Date.now) {
  const accounts = new Map()
  return function reserveAttempt(userId) {
    const time = now()
    let account = accounts.get(userId)
    if (account?.pending) return { retryAfter: 1 }
    if (!account || account.expiresAt <= time) {
      if (accounts.size >= FACE_ATTEMPT_BUCKET_LIMIT) {
        for (const [id, bucket] of accounts) {
          if (!bucket.pending && bucket.expiresAt <= time) accounts.delete(id)
        }
        if (accounts.size >= FACE_ATTEMPT_BUCKET_LIMIT) return { retryAfter: 60 }
      }
      account = { failures: 0, expiresAt: time, pending: false }
      accounts.set(userId, account)
    }
    if (account.failures >= FACE_ATTEMPT_LIMIT) {
      return { retryAfter: Math.ceil((account.expiresAt - time) / 1000) }
    }
    account.pending = true
    return {
      finish({ failed, verified }) {
        account.pending = false
        if (failed) {
          account.failures += 1
          account.expiresAt = now() + FACE_LOCK_MS
        } else if (verified || !account.failures) {
          accounts.delete(userId)
        }
      }
    }
  }
}

export async function runEnrollmentAttempt(reserveAttempt, subject, operation) {
  const attempt = reserveAttempt(subject)
  if (attempt.retryAfter) {
    const error = new FaceVerificationError('FACE_ATTEMPT_LIMIT', 'Face enrollment is temporarily locked. Wait and try again.', 429)
    error.retryAfter = attempt.retryAfter
    throw error
  }
  let failed = false
  let verified = false
  try {
    const result = await operation()
    verified = true
    return result
  } catch (error) {
    failed = error instanceof FaceVerificationError && [400, 401, 409].includes(error.status)
    throw error
  } finally {
    attempt.finish({ failed, verified })
  }
}

export function createFaceChallenges(now = Date.now) {
  const pending = new Map()
  const pendingTerms = new Map()
  const verified = new Map()
  const issueToken = (store, value, ttl) => {
    const time = now()
    for (const [id, item] of store) {
      if (item.expiresAt <= time) store.delete(id)
    }
    if (store.size >= 10_000) store.delete(store.keys().next().value)
    const token = randomUUID()
    store.set(token, { ...value, expiresAt: time + ttl })
    return token
  }
  const consumeToken = (store, token) => {
    const item = store.get(token)
    store.delete(token)
    return item?.expiresAt > now() ? item : null
  }
  return {
    issueTerms({ userId, authVersion, role }) {
      return { termsToken: issueToken(pendingTerms, { userId, authVersion, role }, 10 * 60_000) }
    },
    consumeTerms(token) {
      return consumeToken(pendingTerms, token)
    },
    issue({ userId, actorId, authVersion, role, revision, scope = actorId ? 'enrollment' : 'login' }) {
      const actions = [...faceActions]
      for (let index = actions.length - 1; index > 0; index -= 1) {
        const selected = randomInt(index + 1)
        const action = actions[index]
        actions[index] = actions[selected]
        actions[selected] = action
      }
      const challengeToken = issueToken(pending, {
        userId, actorId, authVersion, role, revision, scope, actions
      }, FACE_CHALLENGE_MS)
      return { challengeToken, actions }
    },
    consume(token, actorId, userId, scope = actorId ? 'enrollment' : 'login') {
      const item = pending.get(token)
      if (!item || item.scope !== scope || item.actorId !== actorId || (userId && item.userId !== userId))
        return null
      return consumeToken(pending, token)
    },
    issueProof({ userId, authVersion, role }, enrollmentId) {
      return issueToken(verified, { userId, authVersion, role, enrollmentId }, FACE_PROOF_MS)
    },
    consumeProof(token) {
      return consumeToken(verified, token)
    }
  }
}

function decodeCameraFrame(frame) {
  if (typeof frame !== 'string' || frame.length !== FACE_FRAME_BYTES * 4 / 3 ||
    !/^[A-Za-z0-9+/]+$/.test(frame)) {
    throw new FaceVerificationError('FACE_CAPTURE_INVALID', 'The camera capture could not be read.', 400)
  }
  return Buffer.from(frame, 'base64')
}

async function describeFace(api, tensor, landmarks) {
  const [aligned] = await api.extractFaceTensors(tensor, [landmarks.align(null, { useDlibAlignment: true })])
  try {
    return await api.nets.faceRecognitionNet.computeFaceDescriptor(aligned)
  } finally {
    aligned.dispose()
  }
}

async function detectFaces({ data, width, height }, inputSize, checkQuality) {
  const api = await loadFaceModels()
  const tensor = api.tf.tensor3d(data, [height, width, 3], 'int32')
  let faceTensor
  try {
    const options = new api.TinyFaceDetectorOptions({ inputSize, scoreThreshold: 0.45 })
    const detections = await api.nets.tinyFaceDetector.locateFaces(tensor, options)
    if (detections.length !== 1) return detections
    const [detection] = detections
    // Call the models directly so inference errors propagate to the route and
    // each crop can be disposed even if landmark or descriptor extraction fails.
    faceTensor = (await api.extractFaceTensors(tensor, [detection]))[0]
    const relativeLandmarks = await api.nets.faceLandmark68TinyNet.detectLandmarks(faceTensor)
    const landmarks = relativeLandmarks.shiftBy(detection.box.x, detection.box.y)
    if (checkQuality) {
      checkQuality(detection, landmarks)
      return [{ detection, landmarks }]
    }
    return [{ detection, descriptor: await describeFace(api, tensor, landmarks) }]
  } finally {
    faceTensor?.dispose()
    tensor.dispose()
  }
}

function faceWithinFrame({ box }, width, height, minSize) {
  const { x, y, width: faceWidth, height: faceHeight } = box
  return x >= 2 && y >= 2 && x + faceWidth <= width - 2 &&
    y + faceHeight <= height - 2 && Math.min(faceWidth, faceHeight) >= minSize
}

function luminance(data, width, x, y) {
  const index = (y * width + x) * 3
  return 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2]
}

function clearFeature(data, width, height, points, padding) {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const left = Math.floor(Math.min(...xs) - padding)
  const top = Math.floor(Math.min(...ys) - padding)
  const right = Math.ceil(Math.max(...xs) + padding)
  const bottom = Math.ceil(Math.max(...ys) + padding)
  if (left < 1 || top < 1 || right >= width - 1 || bottom >= height - 1) return false

  let clipped = 0
  let edgeEnergy = 0
  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const value = luminance(data, width, x, y)
      if (value < 15 || value > 245) clipped += 1
      const laplacian = 4 * value - luminance(data, width, x - 1, y) - luminance(data, width, x + 1, y) -
        luminance(data, width, x, y - 1) - luminance(data, width, x, y + 1)
      edgeEnergy += laplacian ** 2
    }
  }
  const pixels = (right - left) * (bottom - top)
  return pixels > 0 && clipped / pixels < 0.65 && edgeEnergy / pixels >= 22
}

async function readCameraFace(data) {
  const width = FACE_FRAME_WIDTH
  const height = FACE_FRAME_HEIGHT
  const results = await detectFaces({ data, width, height }, FACE_FRAME_WIDTH, (detection, landmarks) => {
    const features = [landmarks.getLeftEye(), landmarks.getRightEye(), landmarks.getNose(), landmarks.getMouth()]
    // Reject clipped or low-detail features before running face recognition.
    if (detection.score < 0.78 || !faceWithinFrame(detection, width, height, FACE_MIN_CAMERA_FACE_SIZE) ||
      !features.every((points) => clearFeature(data, width, height, points, 3))) {
      throw new FaceVerificationError('FACE_UNCLEAR', 'Your face is unclear or partially covered. Use even lighting and keep your full face visible.')
    }
  })
  if (!results.length) {
    throw new FaceVerificationError('FACE_NOT_DETECTED', 'No face detected. Center your face in the camera.')
  }
  if (results.length > 1) {
    throw new FaceVerificationError('FACE_MULTIPLE', 'Multiple faces detected. Keep only your face in view.')
  }

  return results[0]
}

async function describeCameraFrame({ data, landmarks }) {
  const api = await loadFaceModels()
  const tensor = api.tf.tensor3d(data, [FACE_FRAME_HEIGHT, FACE_FRAME_WIDTH, 3], 'int32')
  try {
    const sample = normalizeFaceDescriptor(Array.from(await describeFace(api, tensor, landmarks)))
    if (!sample) throw new Error('The face model returned an invalid descriptor.')
    return sample
  } finally {
    tensor.dispose()
  }
}

export async function readLiveFace(frames, actions, { closeShot = false } = {}) {
  if (!Array.isArray(frames) || frames.length !== FACE_EVIDENCE_COUNT + Number(closeShot) || !validFaceActions(actions)) {
    throw new FaceVerificationError('FACE_CAPTURE_INVALID', 'The camera capture is incomplete.', 400)
  }
  const captured = frames.map(decodeCameraFrame)
  if (new Set(frames).size !== frames.length) {
    throw new FaceVerificationError('FACE_LIVENESS_FAILED', 'The camera sent repeated frames. Start a new live check.')
  }

  const sequence = createFaceGestureSequence(actions)
  let normalSize
  const sizeOf = ({ box }) => Math.min(box.width, box.height)
  for (const data of captured.slice(0, FACE_EVIDENCE_COUNT)) {
    const { landmarks, detection } = await readCameraFace(data)
    if (sequence.step === 'align') normalSize = sizeOf(detection)
    sequence.observe(landmarks, () => ({ data, landmarks, score: detection.score }))
  }
  if (!sequence.complete || sequence.evidence.length !== FACE_EVIDENCE_COUNT) {
    throw new FaceVerificationError('FACE_LIVENESS_FAILED', 'The camera did not capture all requested blinks and turns in order.')
  }

  // Keep the same-person check on all submitted evidence. Only the best
  // frontal sample will be compared to the stored identity or enrolled.
  const descriptors = []
  let bestIndex = 0
  for (const [index, { frame, frontal }] of sequence.evidence.entries()) {
    descriptors.push(await describeCameraFrame(frame))
    if (frontal && frame.score > sequence.evidence[bestIndex].frame.score) bestIndex = index
  }
  if (closeShot) {
    const data = captured.at(-1)
    const { landmarks, detection } = await readCameraFace(data)
    if (sizeOf(detection) < Math.max(FACE_CLOSE_MIN_SIZE, normalSize * FACE_CLOSE_SCALE)) {
      throw new FaceVerificationError('FACE_TOO_FAR', 'Move closer for the final shot and try again.')
    }
    descriptors.push(await describeCameraFrame({ data, landmarks }))
  }
  if (!descriptors.every((sample, index) =>
    descriptors.slice(index + 1).every((other) => facesMatch(sample, other)))) {
    throw new FaceVerificationError('FACE_MISMATCH', 'The same face must stay in view throughout the live check.')
  }
  return descriptors[bestIndex]
}

export async function readDocumentPortrait({ data, width, height }) {
  const results = await detectFaces({ data, width, height }, 608)
  if (results.length !== 1) return null
  const [{ detection, descriptor }] = results
  if (detection.score < 0.65 || !faceWithinFrame(detection, width, height, 40)) return null
  return normalizeFaceDescriptor(Array.from(descriptor))
}

export async function hasActiveFaceEnrollment(supabase, userId, expectedId) {
  let enrollment = supabase
    .from('face_enrollments')
    .select('enrollment_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .not('descriptor_encrypted', 'is', null)
  if (expectedId) enrollment = enrollment.eq('enrollment_id', expectedId)
  const { data, error } = await enrollment.limit(1).maybeSingle()
  if (error) throw error
  return Boolean(data)
}

export async function readAccountFaceEnrollment(supabase, userId, key, includeIdPortrait = false) {
  const { data, error } = await supabase
    .from('face_enrollments')
    .select(includeIdPortrait ? 'enrollment_id,descriptor_encrypted,id_portrait_encrypted' : 'enrollment_id,descriptor_encrypted')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const readTemplate = (encrypted) => encrypted
    ? cacheFaceDescriptor(key, encrypted, () => decryptFaceDescriptor(encrypted, key))
    : null
  const [descriptor, idPortrait] = await Promise.all([
    readTemplate(data.descriptor_encrypted),
    readTemplate(data.id_portrait_encrypted)
  ])
  return {
    id: data.enrollment_id,
    descriptor,
    idPortrait
  }
}

export async function readFaceEnrollments(supabase, key) {
  const rows = []
  for (let start = 0; ; start += 1000) {
    const { data, error } = await supabase
      .from('face_enrollments')
      .select('enrollment_id,user_id,descriptor_encrypted')
      .eq('status', 'active')
      .order('enrollment_id')
      .range(start, start + 999)
    if (error) throw error
    rows.push(...data)
    if (data.length < 1000) break
  }
  return rows.map((row) => ({
    id: row.enrollment_id,
    userId: row.user_id,
    descriptor: row.descriptor_encrypted ? decryptFaceDescriptor(row.descriptor_encrypted, key) : null
  }))
}

function rejectDuplicateFace(enrolled, descriptor, userId) {
  if (enrolled.some((row) => row.userId !== userId && facesMatch(descriptor, row.descriptor))) {
    throw new FaceVerificationError('FACE_ALREADY_ENROLLED', 'This face matches another enrollment. Contact the gym administrator.', 409)
  }
}

export async function assertUniqueFace(supabase, key, descriptor) {
  rejectDuplicateFace(await readFaceEnrollments(supabase, key), descriptor)
}

export function saveFaceEnrollment(supabase, enrollment) {
  return withFaceEnrollmentLock(() => saveUniqueFaceEnrollment(supabase, enrollment))
}

async function saveUniqueFaceEnrollment(supabase, { userId, descriptor, key, adminIdPortrait, expectedId }) {
  const idOnly = descriptor === null && Boolean(adminIdPortrait)
  const encrypted = idOnly ? null : encryptFaceDescriptor(descriptor, key)
  const provision = adminIdPortrait
    ? { p_admin_id_portrait: encryptFaceDescriptor(adminIdPortrait, key) }
    : {}
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const enrolled = await readFaceEnrollments(supabase, key)
    if (expectedId && !enrolled.some((row) => row.id === expectedId && row.userId === userId)) break
    if (idOnly && enrolled.some((row) => row.userId === userId && row.descriptor)) {
      throw new FaceVerificationError('FACE_ALREADY_ENROLLED', 'This administrator already has a face enrollment.', 409)
    }
    rejectDuplicateFace(enrolled, descriptor, userId)
    // Commit only against the same set of templates that we compared.
    const { data: saved, error } = await supabase.rpc('save_fitpulse_face_enrollment', {
      p_user_id: userId,
      p_checked_ids: enrolled.map((row) => row.id),
      p_encrypted_descriptor: encrypted,
      ...provision
    })
    if (error) throw error
    if (saved) return
  }
  throw new FaceVerificationError('FACE_ENROLLMENT_CHANGED', 'Face enrollments changed. Start a new capture.', 409)
}
