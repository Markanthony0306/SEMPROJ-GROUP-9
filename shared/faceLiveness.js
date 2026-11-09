export const FACE_FRAME_WIDTH = 224
export const FACE_FRAME_HEIGHT = 168
export const FACE_FRAME_BYTES = FACE_FRAME_WIDTH * FACE_FRAME_HEIGHT * 3

export const faceActions = ['blink', 'mouth']

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

export function faceActionScore(landmarks, action) {
  if (action === 'mouth') {
    const mouth = landmarks.getMouth()
    return distance(mouth[14], mouth[18]) / distance(mouth[0], mouth[6])
  }
  const eyeRatio = (eye) =>
    (distance(eye[1], eye[5]) + distance(eye[2], eye[4])) / (2 * distance(eye[0], eye[3]))
  const eyes = [eyeRatio(landmarks.getLeftEye()), eyeRatio(landmarks.getRightEye())]
  return Math.max(...eyes)
}

export function neutralFace(score, action) {
  return Number.isFinite(score) && (action === 'mouth' ? score < 0.17 : score > 0.21)
}

export function performedFaceAction(score, baseline, action) {
  return Number.isFinite(score) &&
    (action === 'mouth'
      ? score > Math.max(0.22, baseline + 0.12)
      : score < Math.min(0.19, baseline * 0.72))
}
