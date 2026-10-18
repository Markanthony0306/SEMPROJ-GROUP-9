// Render the real React components with Vite's JSX loader. This checks rendering
// without a browser, a live database, a camera, or sending any email.
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const storage = new Map([['fitpulse-theme', 'light']])
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key)
}
globalThis.window = { matchMedia: () => ({ matches: false }) }

const vite = await createServer({
  configFile: false,
  envDir: false,
  cacheDir: 'node_modules/.vite-ui-tests',
  optimizeDeps: { noDiscovery: true, include: [] },
  esbuild: { jsx: 'automatic' },
  server: { middlewareMode: true, hmr: false, watch: null },
  logLevel: 'error'
})
try {
  const { AuthProvider } = await vite.ssrLoadModule('/src/auth/AuthContext.jsx')
  const { ThemeProvider } = await vite.ssrLoadModule('/src/components/brand/useTheme.jsx')
  const render = (Component, props = {}, role = 'admin') => {
    storage.set(
      'fitpulse-session',
      JSON.stringify({ token: 'isolated-fixture', user: { role, name: 'Test Member' } })
    )
    return renderToStaticMarkup(
      React.createElement(
        AuthProvider,
        null,
        React.createElement(ThemeProvider, null, React.createElement(Component, props))
      )
    )
  }
  const load = async (path) => (await vite.ssrLoadModule(`/src/${path}.jsx`)).default
  const Login = await load('pages/Login')
  const login = render(Login)
  assert.ok(login.includes('Welcome back'))
  assert.ok(!login.includes('Development accounts'))
  assert.ok(!login.includes('admin123'))
  assert.ok(!login.includes('member123'))
  console.log('PASS: Login renders without development credentials.')

  for (const [path, role, heading] of [
    ['pages/AdminStaffPage', 'admin', 'Gym activity'],
    ['pages/UserPage', 'member', 'Your activity']
  ]) {
    const Component = await load(path)
    const html = render(Component, { user: { role, name: 'Test Member' } }, role)
    assert.ok(html.includes(heading))
    assert.ok(html.includes('7 days') && html.includes('6 months'))
    assert.ok(html.includes('aria-pressed='))
    assert.ok(html.includes('activity-plot'))
    console.log(`PASS: ${role} dashboard renders its interactive chart and controls.`)
  }
  const AdminReports = await load('components/AdminReports')
  const member = {
    id: 'test-id',
    memberCode: 'FP-001',
    name: 'Test Member',
    role: 'user',
    status: 'active',
    plan: 'Monthly',
    membershipStart: '2020-01-01',
    membershipEnd: '2099-01-01'
  }
  const reports = render(AdminReports, {
    data: { members: [member], attendance: [], payments: [], equipment: [], maintenance: [] }
  })
  for (const label of [
    'Payment',
    'Renewal',
    'Attendance',
    'Maintenance',
    'View Test Member record',
    'Edit Test Member record',
    'FP-001'
  ])
    assert.ok(reports.includes(label), `Missing: ${label}`)
  console.log('PASS: Reports render category filters, source records, and accessible actions.')

  const FaceCapture = await load('components/FaceCapture')
  const face = render(FaceCapture, { onCaptured: () => {} })
  for (const label of [
    'Face camera preview',
    'Position face',
    'Start camera',
    'How your face data is used'
  ])
    assert.ok(face.includes(label))
  console.log('PASS: Face verification renders the camera guide, steps, and privacy details.')

  const Loader = await load('components/HeartRateLoader')
  const loader = render(Loader, { message: 'Opening your dashboard' })
  assert.ok(loader.includes('--loader-duration:1000ms') && loader.includes('loading-pulse'))
  console.log('PASS: The heartbeat loader renders with the shared one-second duration.')
} finally {
  await vite.close()
}
