import { randomInt, randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import {
  FACE_FRAME_BYTES, FACE_FRAME_HEIGHT, FACE_FRAME_WIDTH,
  faceActions, faceActionScore, neutralFace, performedFaceAction
} from '../../shared/faceLiveness.js'
import { decryptFaceDescriptor, faceDescriptorDistance } from '../lib/face-auth.js'

const modelsDirectory = fileURLToPath(new URL('../../public/models/face-api/', import.meta.url))
let models

function loadModels() {
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

export function createFaceChallenges(now = Date.now) {
  const pending = new Map()
  const pendingTerms = new Map()
  return {
    issueTerms({ userId, authVersion }) {
      const time = now()
      for (const [id, item] of pendingTerms) {
        if (item.expiresAt <= time) pendingTerms.delete(id)
      }
      if (pendingTerms.size >= 10_000) pendingTerms.delete(pendingTerms.keys().next().value)
      const termsToken = randomUUID()
      pendingTerms.set(termsToken, { userId, authVersion, expiresAt: time + 10 * 60_000 })
      return { termsToken }
    },
    consumeTerms(token) {
      const item = pendingTerms.get(token)
      if (!item) return null
      pendingTerms.delete(token)
      return item.expiresAt > now() ? item : null
    },
    issue({ userId, actorId, authVersion }) {
      const time = now()
      for (const [id, item] of pending) {
        if (item.expiresAt <= time) pending.delete(id)
      }
      if (pending.size >= 10_000) pending.delete(pending.keys().next().value)
      const challengeToken = randomUUID()
      const action = faceActions[randomInt(faceActions.length)]
      pending.set(challengeToken, { userId, actorId, authVersion, action, expiresAt: time + 120_000 })
      return { challengeToken, action }
    },
    consume(token, actorId, userId) {
      const item = pending.get(token)
      if (!item || item.actorId !== actorId || (userId && item.userId !== userId)) return null
      pending.delete(token)
      return item.expiresAt > now() ? item : null
    }
  }
}

export async function readLiveFace(frames, action, matchThreshold) {
  if (!Array.isArray(frames) || frames.length !== 3 ||
    !frames.every((frame) => typeof frame === 'string' && frame.length === FACE_FRAME_BYTES * 4 / 3 &&
      /^[A-Za-z0-9+/]+$/.test(frame))) return null

  const api = await loadModels()
  const detections = []
  for (const frame of frames) {
    const tensor = api.tf.tensor3d(Buffer.from(frame, 'base64'), [FACE_FRAME_HEIGHT, FACE_FRAME_WIDTH, 3], 'int32')
    try {
      const result = await api
        .detectAllFaces(tensor, new api.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.55 }))
        .withFaceLandmarks(true)
        .withFaceDescriptors()
      if (result.length !== 1) return null
      detections.push(result[0])
    } finally {
      tensor.dispose()
    }
  }
  const [before, during, after] = detections.map((detection) => faceActionScore(detection.landmarks, action))
  if (!neutralFace(before, action) || !neutralFace(after, action) ||
    !performedFaceAction(during, before, action) || !performedFaceAction(during, after, action)) return null

  const descriptors = detections.map(({ descriptor }) => Array.from(descriptor))
  return descriptors.every((item) => faceDescriptorDistance(descriptors[0], item) <= matchThreshold)
    ? descriptors[0]
    : null
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
