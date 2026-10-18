import assert from 'node:assert/strict'
import { createServer } from 'vite'
import config from '../vite.config.js'

// Exercise the browser's real module URL and model files with an isolated Vite cache.
const server = await createServer({
  ...config,
  configFile: false,
  envDir: false,
  cacheDir: 'node_modules/.vite-face-tests',
  server: { ...config.server, host: '127.0.0.1', port: 0, watch: null },
  logLevel: 'error'
})
try {
  await server.listen()
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`
  const base = new URL(config.base, origin)
  const response = await fetch(new URL('src/components/FaceCapture.jsx', base))
  assert.equal(response.status, 200)
  const component = await response.text()
  const match = component.match(/import\(\s*["']([^"']*face-api[^"']*)["']\s*\)/)
  assert.ok(match, 'The camera component must resolve a face-api dynamic import')
  const libraryUrl = new URL(match[1], base)
  const library = await fetch(libraryUrl)
  assert.equal(library.status, 200, `Face library returned HTTP ${library.status}`)
  assert.match(library.headers.get('content-type'), /javascript/)
  const moduleSource = await library.text()
  for (const [, chunk] of moduleSource.matchAll(/from\s*["'](\.[^"']+)["']/g)) {
    const child = await fetch(new URL(chunk, libraryUrl))
    assert.equal(child.status, 200, `Dependency chunk failed: ${chunk}`)
    assert.match(child.headers.get('content-type'), /javascript/)
    await child.body?.cancel()
  }
  console.log(
    'PASS: The dynamically imported face library and its chunks return JavaScript with HTTP 200.'
  )

  for (const name of ['tiny_face_detector', 'face_landmark_68_tiny', 'face_recognition']) {
    const manifestUrl = new URL(`models/face-api/${name}_model-weights_manifest.json`, base)
    const manifest = await fetch(manifestUrl)
    assert.equal(manifest.status, 200)
    for (const group of await manifest.json()) {
      assert.ok(group.weights.length > 0)
      for (const path of group.paths) {
        const shard = await fetch(new URL(path, manifestUrl))
        assert.equal(shard.status, 200, `Missing model file: ${path}`)
        assert.ok(!shard.headers.get('content-type')?.includes('text/html'))
        assert.ok(Number(shard.headers.get('content-length')) > 0)
        await shard.body?.cancel()
      }
    }
  }
  console.log('PASS: All three face model manifests and every weight file are available.')
} finally {
  await server.close()
}
