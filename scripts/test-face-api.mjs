import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createFaceApiLoader } from '../src/utils/faceApi.js'
import { canReadFaceFrame, createCameraFaceScanner } from '../src/utils/captureLiveFace.js'
import { FACE_FRAME_BYTES, FACE_FRAME_HEIGHT, FACE_FRAME_WIDTH } from '../shared/faceLiveness.js'

// No camera, face data, or network is used. These exercise failed-load recovery.
const modelNames = ['tinyFaceDetector', 'faceLandmark68TinyNet', 'faceRecognitionNet']

function fixture(loadModel = async () => {}) {
  const calls = []
  const library = {
    nets: Object.fromEntries(
      modelNames.map((name) => [
        name,
        {
          async loadFromUri(url) {
            calls.push({ name, url })
            await loadModel(name)
          }
        }
      ])
    )
  }
  return { library, calls }
}

test('concurrent camera requests share one library import and model load', async () => {
  const { library, calls } = fixture()
  let imports = 0
  const load = createFaceApiLoader({
    importLibrary: async () => {
      imports += 1
      return library
    },
    modelsUrl: '/fitpulse/models/face-api'
  })
  const results = await Promise.all([load(), load(), load()])
  assert.ok(results.every((result) => result === library))
  assert.equal(imports, 1)
  assert.equal(calls.length, 3)
  assert.ok(calls.every(({ url }) => url === '/fitpulse/models/face-api'))
  await load()
  assert.equal(imports, 1)
  assert.equal(calls.length, 3)
})

test('a failed library import gives a reload message and allows a new attempt', async () => {
  const { library, calls } = fixture()
  const cause = new TypeError('Failed to fetch dynamically imported module: /internal-library-url')
  let imports = 0
  const load = createFaceApiLoader({
    importLibrary: async () => {
      imports += 1
      if (imports === 1) throw cause
      return library
    },
    modelsUrl: '/models/face-api'
  })
  await assert.rejects(load(), (error) => {
    assert.equal(error.code, 'FACE_LIBRARY_LOAD_FAILED')
    assert.equal(error.cause, cause)
    assert.match(error.message, /reload/i)
    assert.ok(!error.message.includes('/internal-library-url'))
    return true
  })
  assert.equal(calls.length, 0)
  assert.equal(await load(), library)
  assert.equal(imports, 2)
})

test('a model download failure can be retried without re-importing the library', async () => {
  let fail = true
  const { library, calls } = fixture(async (name) => {
    if (fail && name === 'tinyFaceDetector') throw new Error('Synthetic model download failure')
  })
  let imports = 0
  const load = createFaceApiLoader({
    importLibrary: async () => {
      imports += 1
      return library
    },
    modelsUrl: '/models/face-api'
  })
  await assert.rejects(load(), { code: 'FACE_MODELS_LOAD_FAILED' })
  fail = false
  assert.equal(await load(), library)
  assert.equal(imports, 1)
  assert.equal(calls.length, 6)
})

test('a failed model batch settles before another attempt starts', async () => {
  let finishPendingModel
  let attempts = 0
  const { library } = fixture(async (name) => {
    if (name === 'tinyFaceDetector') {
      attempts += 1
      throw new Error('Synthetic failed file')
    }
    if (name === 'faceRecognitionNet')
      await new Promise((resolve) => {
        finishPendingModel = resolve
      })
  })
  const load = createFaceApiLoader({ importLibrary: async () => library, modelsUrl: '/models' })
  const first = assert.rejects(load(), { code: 'FACE_MODELS_LOAD_FAILED' })
  // Allow the import and model tasks to begin, without waiting on real timers.
  await new Promise((resolve) => setImmediate(resolve))
  const second = assert.rejects(load(), { code: 'FACE_MODELS_LOAD_FAILED' })
  assert.equal(attempts, 1)
  finishPendingModel()
  await Promise.all([first, second])
})

test('camera feedback distinguishes lighting, placement, and face count on a mirrored preview', async (t) => {
  let faces = []
  let exposure = 'even'
  let content
  const context = {
    clearRect() {},
    drawImage(_video, x, y, width, height) {
      content = { x, y, width, height }
    },
    getImageData() {
      const data = new Uint8ClampedArray(FACE_FRAME_WIDTH * FACE_FRAME_HEIGHT * 4)
      for (let y = 0; y < FACE_FRAME_HEIGHT; y += 1) {
        for (let x = 0; x < FACE_FRAME_WIDTH; x += 1) {
          if (y < content.y || y >= content.y + content.height) continue
          const centered = x >= 60 && x < 164 && y >= 48 && y < 120
          const luma = exposure === 'even' ? 132 : exposure === 'dark' || centered ? 35 : 230
          const index = (y * FACE_FRAME_WIDTH + x) * 4
          data.fill(luma, index, index + 3)
          data[index + 3] = 255
        }
      }
      return { data }
    }
  }
  const previousDocument = globalThis.document
  globalThis.document = { createElement: () => ({ getContext: () => context }) }
  t.after(() => {
    if (previousDocument === undefined) delete globalThis.document
    else globalThis.document = previousDocument
  })
  const scan = createCameraFaceScanner({
    TinyFaceDetectorOptions: class {
      constructor(options) {
        assert.equal(options.inputSize, FACE_FRAME_WIDTH)
        assert.equal(options.scoreThreshold, 0.35)
      }
    },
    nets: {
      tinyFaceDetector: {
        locateFaces: async (canvas) => {
          assert.equal(canvas.width, FACE_FRAME_WIDTH)
          assert.equal(canvas.height, FACE_FRAME_HEIGHT)
          return faces
        }
      }
    }
  })
  const video = {
    readyState: 1,
    videoWidth: 640,
    videoHeight: 360,
    clientWidth: 320,
    clientHeight: 120,
    srcObject: { getVideoTracks: () => [{ readyState: 'live', muted: false }] }
  }
  assert.equal(canReadFaceFrame(video), false)
  video.readyState = 2
  assert.equal(canReadFaceFrame(video), true)
  assert.equal((await scan(video)).message, 'No face detected')
  exposure = 'dark'
  assert.equal((await scan(video)).message, 'Too dark')
  exposure = 'backlit'
  assert.equal((await scan(video)).message, 'Too much backlight, face the light')
  exposure = 'even'
  const positioned = { box: { x: 85, y: 48, width: 72, height: 72 } }
  faces = [positioned, positioned]
  assert.equal((await scan(video)).message, 'Multiple faces detected')
  faces = [{ box: { x: 92, y: 64, width: 40, height: 40 } }]
  assert.equal((await scan(video)).message, 'Move closer')
  faces = [{ box: { x: 4, y: 48, width: 72, height: 72 } }]
  assert.equal((await scan(video)).message, 'Center your face')
  faces = [positioned]
  const result = await scan(video)
  assert.equal(result.guide, 'ready')
  // The camera image fits to 213.33×120 inside 320×120. Its right-shifted
  // detected center appears to the left of center in the mirrored preview.
  assert.ok(Math.abs(result.box.top - 25.714) < 0.01)
  assert.ok(Math.abs(result.box.left + result.box.width / 2 - 151.429) < 0.01)
  assert.equal(Buffer.from(result.encode(), 'base64').length, FACE_FRAME_BYTES)
})
