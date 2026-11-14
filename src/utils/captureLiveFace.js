import {
  FACE_BLINK_COUNT, FACE_FRAME_BYTES, FACE_FRAME_HEIGHT, FACE_FRAME_WIDTH, FACE_MIN_CAMERA_FACE_SIZE,
  FACE_CLOSE_MIN_SIZE, FACE_CLOSE_SCALE, FACE_STEP_MS, createFaceGestureSequence, validFaceActions
} from '../../shared/faceLiveness.js'

export const FACE_SCAN_INTERVAL_MS = 120
const FACE_LIVE_INTERVAL_MS = 60
const PREVIEW_DETECTION_SCORE = 0.35
const DARK_LUMA = 48
const BACKLIT_FACE_LUMA = 88
const BRIGHT_BACKGROUND_LUMA = 185
const BRIGHT_BACKGROUND_FRACTION = 0.15
const POSITION_TOLERANCE = 0.16

export function canReadFaceFrame(video) {
  return Boolean(video?.videoWidth && video.videoHeight && video.readyState >= 2 &&
    video.srcObject?.getVideoTracks().some((track) => track.readyState === 'live' && !track.muted))
}

function captureSurface() {
  const canvas = document.createElement('canvas')
  canvas.width = FACE_FRAME_WIDTH
  canvas.height = FACE_FRAME_HEIGHT
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Could not read camera frames. Try a supported browser.')
  return { canvas, context }
}

function drawCameraFrame(video, context) {
  if (!canReadFaceFrame(video)) {
    throw new Error('The camera stopped sending frames. Restart your camera and try again.')
  }
  const scale = Math.min(FACE_FRAME_WIDTH / video.videoWidth, FACE_FRAME_HEIGHT / video.videoHeight)
  const width = video.videoWidth * scale
  const height = video.videoHeight * scale
  const x = (FACE_FRAME_WIDTH - width) / 2
  const y = (FACE_FRAME_HEIGHT - height) / 2
  context.clearRect(0, 0, FACE_FRAME_WIDTH, FACE_FRAME_HEIGHT)
  context.drawImage(video, x, y, width, height)
  return { x, y, width, height }
}

function encodeFrame(rgba) {
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

function lightingMessage(pixels, source, face) {
  const area = face ?? {
    x: source.x + source.width * 0.27,
    y: source.y + source.height * 0.20,
    width: source.width * 0.46,
    height: source.height * 0.60
  }
  let faceTotal = 0
  let faceSamples = 0
  let brightSamples = 0
  let backgroundSamples = 0
  // Sample the middle of the face and the surrounding image, excluding padding.
  for (let y = Math.ceil(source.y); y < Math.floor(source.y + source.height); y += 4) {
    for (let x = Math.ceil(source.x); x < Math.floor(source.x + source.width); x += 4) {
      const index = (y * FACE_FRAME_WIDTH + x) * 4
      const luma = 0.299 * pixels[index] + 0.587 * pixels[index + 1] + 0.114 * pixels[index + 2]
      if (x >= area.x + area.width * 0.2 && x < area.x + area.width * 0.8 &&
          y >= area.y + area.height * 0.2 && y < area.y + area.height * 0.8) {
        faceTotal += luma
        faceSamples += 1
      } else if (x < area.x || x >= area.x + area.width || y < area.y || y >= area.y + area.height) {
        backgroundSamples += 1
        if (luma >= BRIGHT_BACKGROUND_LUMA) brightSamples += 1
      }
    }
  }
  const faceLuma = faceTotal / faceSamples
  if (faceLuma < BACKLIT_FACE_LUMA && brightSamples / backgroundSamples >= BRIGHT_BACKGROUND_FRACTION)
    return 'Too much backlight, face the light'
  return faceLuma < DARK_LUMA ? 'Too dark' : ''
}

function previewBox(box, source, video) {
  // The video uses object-fit: contain and is mirrored in CSS. The input
  // canvas is unmirrored, so project through the camera image before flipping.
  const scale = Math.min(video.clientWidth / source.width, video.clientHeight / source.height)
  return {
    left: (video.clientWidth - source.width * scale) / 2 +
      (source.x + source.width - box.x - box.width) * scale,
    top: (video.clientHeight - source.height * scale) / 2 + (box.y - source.y) * scale,
    width: box.width * scale,
    height: box.height * scale
  }
}

export function createCameraFaceScanner(faceapi) {
  const { canvas, context } = captureSurface()
  const detector = new faceapi.TinyFaceDetectorOptions({
    inputSize: FACE_FRAME_WIDTH, scoreThreshold: PREVIEW_DETECTION_SCORE
  })

  return async function scan(video, includeLandmarks = false) {
    const source = drawCameraFrame(video, context)
    const faces = await faceapi.nets.tinyFaceDetector.locateFaces(canvas, detector)
    if (faces.length > 1) return { guide: 'neutral', message: 'Multiple faces detected', multiple: true }

    const detection = faces[0]
    const box = detection?.box
    const pixels = context.getImageData(0, 0, FACE_FRAME_WIDTH, FACE_FRAME_HEIGHT).data
    const lighting = lightingMessage(pixels, source, box)
    if (!box) return { guide: 'neutral', message: lighting || 'No face detected' }

    let message = lighting
    if (!message && Math.min(box.width, box.height) < FACE_MIN_CAMERA_FACE_SIZE) {
      message = 'Move closer'
    }
    if (!message && (
      Math.abs((box.x + box.width / 2 - source.x) / source.width - 0.5) > POSITION_TOLERANCE ||
      Math.abs((box.y + box.height / 2 - source.y) / source.height - 0.5) > POSITION_TOLERANCE ||
      box.x < source.x + 2 || box.y < source.y + 2 ||
      box.x + box.width > source.x + source.width - 2 ||
      box.y + box.height > source.y + source.height - 2
    )) {
      message = 'Center your face'
    }
    let landmarks
    let points
    if (includeLandmarks && Math.min(box.width, box.height) >= FACE_MIN_CAMERA_FACE_SIZE / 2) {
      const [face] = await faceapi.extractFaces(canvas, [detection])
      landmarks = await faceapi.nets.faceLandmark68TinyNet.detectLandmarks(face)
      const originX = Math.max(0, Math.floor(box.x))
      const originY = Math.max(0, Math.floor(box.y))
      points = [36, 39, 42, 45, 30, 48, 54].map((index) => {
        const point = landmarks.positions[index]
        return previewBox({
          x: originX + point.x, y: originY + point.y, width: 0, height: 0
        }, source, video)
      })
    }
    return {
      guide: message ? 'adjust' : 'ready',
      message: message || 'Face in position',
      box: previewBox(box, source, video),
      landmarks,
      points,
      size: Math.min(box.width, box.height),
      encode: () => encodeFrame(pixels)
    }
  }
}

export const faceStepLabels = {
  align: 'Face forward', blink: `Blink ${FACE_BLINK_COUNT} times`, left: 'Turn left', right: 'Turn right'
}

export async function captureLiveFace({ video, scan, actions, closeShot, isCurrent, onPrompt, onPosition, onProgress }) {
  if (!validFaceActions(actions)) throw new Error('The live check is unavailable. Start a new check.')
  const sequence = createFaceGestureSequence(actions)
  let step = sequence.step
  let expiresAt = performance.now() + FACE_STEP_MS[step]
  let lastVideoTime
  let normalSize
  const steps = closeShot ? [...actions, 'close'] : actions
  const reportProgress = () => {
    const { step, blinks, returning, complete } = sequence
    onProgress({ actions: steps, step, blinks, complete: complete && !closeShot })
    if (complete) return
    if (step === 'align') onPrompt('Face forward with both eyes open.')
    else if (step === 'blink') onPrompt(`Blink ${blinks}/${FACE_BLINK_COUNT}. Close both eyes briefly, then reopen them.`)
    else onPrompt(returning ? 'Face forward again.' : `${faceStepLabels[step]}. Keep both eyes visible.`)
  }
  reportProgress()

  while (isCurrent() && performance.now() < expiresAt) {
    const started = performance.now()
    if (video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime
      const position = await scan(video, true)
      if (!isCurrent()) return null
      if (performance.now() >= expiresAt) break
      onPosition(position)
      if (position.multiple) throw new Error(position.message)
      if (step === 'close' && position.guide === 'ready' &&
          position.size >= Math.max(FACE_CLOSE_MIN_SIZE, normalSize * FACE_CLOSE_SCALE)) {
        onProgress({ actions: steps, step: null, blinks: sequence.blinks, complete: true })
        return [...sequence.evidence.map(({ frame }) => frame), position.encode()]
      }
      if (step !== 'close' && position.guide !== 'ready') {
        const wasReturning = sequence.returning
        sequence.resetPending()
        if (wasReturning) reportProgress()
      } else if (step !== 'close') {
        const { blinks, returning } = sequence
        sequence.observe(position.landmarks, position.encode)
        if (step === 'align' && sequence.step !== step) normalSize = position.size
        if (sequence.step !== step || sequence.blinks !== blinks || sequence.returning !== returning) {
          if (sequence.step !== step) {
            step = sequence.step
            if (!sequence.complete) expiresAt = performance.now() + FACE_STEP_MS[step]
          }
          reportProgress()
        }
        if (sequence.complete) {
          if (!closeShot) return sequence.evidence.map(({ frame }) => frame)
          step = 'close'
          expiresAt = performance.now() + FACE_STEP_MS.align
          onProgress({ actions: steps, step, blinks: sequence.blinks, complete: false })
          onPrompt('Normal scan complete. Move closer and keep your full face in frame.')
        }
      }
    }
    const delay = Math.max(0, FACE_LIVE_INTERVAL_MS - (performance.now() - started))
    await new Promise((resolve) => window.setTimeout(resolve, delay))
  }
  if (!isCurrent()) return null
  throw new Error(`${step === 'close' ? 'Closer shot' : faceStepLabels[step]} timed out. Start a new live check and follow each prompt.`)
}
