import {
  FACE_FRAME_BYTES, FACE_FRAME_HEIGHT, FACE_FRAME_WIDTH,
  faceActionScore, neutralFace, performedFaceAction
} from '../../shared/faceLiveness'

function encodeFrame(context) {
  const rgba = context.getImageData(0, 0, FACE_FRAME_WIDTH, FACE_FRAME_HEIGHT).data
  const rgb = new Uint8Array(FACE_FRAME_BYTES)
  for (let source = 0, target = 0; source < rgba.length; source += 4) {
    rgb[target++] = rgba[source]
    rgb[target++] = rgba[source + 1]
    rgb[target++] = rgba[source + 2]
  }
  const chunks = []
  for (let i = 0; i < rgb.length; i += 8192) {
    chunks.push(String.fromCharCode(...rgb.subarray(i, i + 8192)))
  }
  return btoa(chunks.join(''))
}

export async function captureLiveFace({ video, faceapi, action, isCurrent, onPrompt }) {
  const canvas = document.createElement('canvas')
  canvas.width = FACE_FRAME_WIDTH
  canvas.height = FACE_FRAME_HEIGHT
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const detector = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.55 })
  const prompts = [
    action === 'mouth' ? 'Face forward with your mouth closed.' : 'Face forward with both eyes open.',
    action === 'mouth' ? 'Open your mouth and hold briefly.' : 'Close both eyes and hold briefly.',
    action === 'mouth' ? 'Close your mouth again.' : 'Open your eyes again.'
  ]
  const frames = []
  let baseline
  const expiresAt = performance.now() + 20_000
  onPrompt(prompts[0])

  while (isCurrent() && performance.now() < expiresAt) {
    const scale = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight)
    const width = video.videoWidth * scale
    const height = video.videoHeight * scale
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(video, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
    const faces = await faceapi.detectAllFaces(canvas, detector).withFaceLandmarks(true)
    if (!isCurrent()) return null
    if (faces.length !== 1) {
      frames.length = 0
      onPrompt(prompts[0])
    } else {
      const score = faceActionScore(faces[0].landmarks, action)
      const ready = frames.length === 1
        ? performedFaceAction(score, baseline, action)
        : neutralFace(score, action)
      if (ready) {
        if (!frames.length) baseline = score
        frames.push(encodeFrame(context))
        if (frames.length === 3) return frames
        onPrompt(prompts[frames.length])
      }
    }
    await new Promise((resolve) => window.setTimeout(resolve, 85))
  }
  if (!isCurrent()) return null
  throw new Error('The live check timed out. Keep one face in the frame and try again.')
}
