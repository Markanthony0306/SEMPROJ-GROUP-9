import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createFaceApiLoader } from '../src/utils/faceApi.js'

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
