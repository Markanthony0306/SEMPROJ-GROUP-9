export const FACE_FRAME_WIDTH = 224
export const FACE_FRAME_HEIGHT = 168
export const FACE_FRAME_BYTES = FACE_FRAME_WIDTH * FACE_FRAME_HEIGHT * 3
export const FACE_MIN_CAMERA_FACE_SIZE = 64
export const FACE_CLOSE_MIN_SIZE = 80
export const FACE_CLOSE_SCALE = 1.2

export const faceActions = ['blink', 'left', 'right']
export const FACE_BLINK_COUNT = 3
export const FACE_CLOSED_SAMPLES = 2
export const FACE_TURN_DEGREES = 25
export const FACE_FORWARD_DEGREES = 12
export const FACE_STEP_MS = { align: 10_000, blink: 15_000, left: 10_000, right: 10_000 }
export const FACE_EVIDENCE_COUNT = 1 + FACE_BLINK_COUNT * (FACE_CLOSED_SAMPLES + 1) + 4
export const FACE_BODY_LIMIT = (FACE_EVIDENCE_COUNT + 1) * FACE_FRAME_BYTES * 4 / 3 + 8192

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const eyeRatio = (eye) =>
  (distance(eye[1], eye[5]) + distance(eye[2], eye[4])) / (2 * distance(eye[0], eye[3]))
const eyeRatios = (landmarks) => [eyeRatio(landmarks.getLeftEye()), eyeRatio(landmarks.getRightEye())]

const center = (points) => points.reduce((sum, point) => ({
  x: sum.x + point.x / points.length,
  y: sum.y + point.y / points.length
}), { x: 0, y: 0 })

export function estimateFaceYaw(landmarks) {
  const first = center(landmarks.getLeftEye())
  const second = center(landmarks.getRightEye())
  const nose = landmarks.getNose()[3]
  const axisX = second.x - first.x
  const axisY = second.y - first.y
  const eyeSpanSquared = axisX ** 2 + axisY ** 2
  if (!nose || !eyeSpanSquared) return NaN
  const offset = ((nose.x - first.x) * axisX + (nose.y - first.y) * axisY) / eyeSpanSquared - 0.5
  // Project onto the eye line to remove roll and translation. Positive yaw
  // means the user's left in the unmirrored camera image.
  return Math.atan(2 * offset) * 180 / Math.PI
}

export function validFaceActions(actions) {
  return Array.isArray(actions) && actions.length === faceActions.length &&
    faceActions.every((action) => actions.includes(action))
}

export function createFaceGestureSequence(actions) {
  const evidence = []
  const closedFrames = []
  let baseline
  let index = 0
  let blinks = 0
  let sideFrame

  return {
    evidence,
    get step() { return baseline ? actions[index] : 'align' },
    get complete() { return index === actions.length },
    get blinks() { return blinks },
    get returning() { return Boolean(sideFrame) },
    resetPending() {
      closedFrames.length = 0
      sideFrame = undefined
    },
    observe(landmarks, capture) {
      if (this.complete) return
      const eyes = eyeRatios(landmarks)
      const yaw = estimateFaceYaw(landmarks)
      if (![...eyes, yaw].every(Number.isFinite)) {
        this.resetPending()
        return
      }
      const forward = Math.abs(yaw) <= FACE_FORWARD_DEGREES &&
        (!baseline || Math.abs(yaw - baseline.yaw) <= FACE_FORWARD_DEGREES)
      const open = eyes.every((ratio, eye) =>
        ratio >= Math.max(0.21, (baseline?.eyes[eye] ?? 0) * 0.85))
      if (!baseline) {
        if (!forward || !open) return
        baseline = { eyes, yaw }
        evidence.push({ frame: capture(), frontal: true })
        return
      }

      if (this.step === 'blink') {
        if (!forward) {
          this.resetPending()
          return
        }
        if (open) {
          if (closedFrames.length === FACE_CLOSED_SAMPLES) {
            evidence.push(...closedFrames, { frame: capture(), frontal: true })
            blinks += 1
            if (blinks === FACE_BLINK_COUNT) index += 1
          }
          closedFrames.length = 0
        } else if (eyes.every((ratio, eye) => ratio <= Math.min(0.19, baseline.eyes[eye] * 0.72))) {
          if (closedFrames.length < FACE_CLOSED_SAMPLES) {
            closedFrames.push({ frame: capture(), frontal: false })
          }
        } else if (closedFrames.length < FACE_CLOSED_SAMPLES) {
          closedFrames.length = 0
        }
        return
      }

      const direction = this.step === 'left' ? 1 : -1
      if (sideFrame && forward && open) {
        evidence.push(sideFrame, { frame: capture(), frontal: true })
        sideFrame = undefined
        index += 1
      } else if (open && direction * yaw >= FACE_TURN_DEGREES &&
          direction * (yaw - baseline.yaw) >= FACE_TURN_DEGREES) {
        sideFrame ||= { frame: capture(), frontal: false }
      }
    }
  }
}
