import { createServer } from 'vite'
import config from '../vite.config.js'

// Native import avoids Windows config-bundling permission issues. Keep the same fs policy.
const server = await createServer({
  ...config,
  configFile: false,
  cacheDir: 'node_modules/.vite-privacy-tests',
  server: { ...config.server, host: '127.0.0.1', port: 0 },
  optimizeDeps: { noDiscovery: true, include: [] },
  logLevel: 'silent'
})
let failures = 0
try {
  await server.listen()
  const base = `http://127.0.0.1:${server.httpServer.address().port}`
  const cases = [
    ['/', 200],
    ['/shared/membershipPlans.js', 200],
    ['/src/components/FaceCapture.jsx', 200],
    ['/models/face-api/tiny_face_detector_model-weights_manifest.json', 200],
    ['/server/data.json', 403],
    ['/server/data.json?raw', 403],
    ['/server/server.js', 403],
    ['/server/lib/supabase.js', 403],
    ['/server/services/adminIdentity.js', 403],
    ['/scripts/check-private-files.mjs', 403],
    ['/graphify-out/graph.json', 403],
    ['/vendor/face-api.js/.git/config', 403],
    ['/.env', 403],
    ['/.env.example', 403],
    [`/@fs/${process.cwd().replaceAll('\\', '/')}/server/data.json`, 403]
  ]
  for (const [url, expected] of cases) {
    const response = await fetch(`${base}${url}`)
    await response.body?.cancel()
    const passed = response.status === expected
    if (!passed) failures += 1
    console.log(`${passed ? 'PASS' : 'FAIL'} - ${url}: HTTP ${response.status}`)
  }
} finally {
  await server.close()
}
process.exitCode = failures ? 1 : 0
