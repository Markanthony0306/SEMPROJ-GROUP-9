// Exercise the real React confirmation handler against intercepted API responses.
// No .env, live API, database, or email service is used.
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'vite'

const runtimePlaywright = join(
  homedir(),
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
)
const playwrightModule = process.env.PLAYWRIGHT_MODULE_PATH || runtimePlaywright
const { chromium } = await import(pathToFileURL(playwrightModule).href)
const edgePath = join(
  process.env['ProgramFiles(x86)'] || 'C:/Program Files (x86)',
  'Microsoft/Edge/Application/msedge.exe'
)
const executablePath =
  process.env.PLAYWRIGHT_EXECUTABLE_PATH || (existsSync(edgePath) ? edgePath : undefined)

const fixtureId = '/__record-clearing-fixture.jsx'
const fixtureSource = `
import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '/src/auth/AuthContext.jsx'
import RecordDeleteDialog from '/src/components/RecordDeleteControls.jsx'

localStorage.setItem('fitpulse-session', JSON.stringify({
  token: 'isolated-browser-fixture', user: { role: 'admin' }
}))
window.clearTest = { refreshed: 0, refreshFails: false }
function Fixture() {
  const [target, setTarget] = useState(null)
  const [notice, setNotice] = useState('')
  return <AuthProvider><main className="app admin-app">
    {['attendance', 'payments', 'renewals', 'maintenance', 'notifications'].map(category =>
      <button key={category} onClick={() => {
        setNotice('')
        setTarget({ category, all: true, count: 2,
          ...(category === 'notifications' ? {
            group: 'membership', scopeLabel: 'membership reminders'
          } : {}) })
      }}>Open {category}</button>
    )}
    <p role="status">{notice}</p>
    {target && <RecordDeleteDialog target={target}
      onClose={() => setTarget(null)}
      onNotice={setNotice}
      onChanged={async () => {
        window.clearTest.refreshed += 1
        if (window.clearTest.refreshFails) throw new Error('Fixture refresh outage')
        return true
      }} />}
  </main></AuthProvider>
}
createRoot(document.getElementById('root')).render(<Fixture />)
`

const bundle = await build({
  configFile: false,
  envDir: false,
  plugins: [
    {
      name: 'record-clearing-fixture',
      resolveId: (id) => (id === fixtureId ? fixtureId : null),
      load: (id) => (id === fixtureId ? fixtureSource : null)
    }
  ],
  esbuild: { jsx: 'automatic' },
  build: {
    write: false,
    minify: false,
    rollupOptions: { input: fixtureId, output: { inlineDynamicImports: true } }
  },
  logLevel: 'error'
})
const fixtureScript = bundle.output.find((output) => output.type === 'chunk').code
const server = createServer((req, res) => {
  if (req.url === '/fixture.js') {
    res.setHeader('Content-Type', 'text/javascript')
    return res.end(fixtureScript)
  }
  res.setHeader('Content-Type', 'text/html')
  res.end('<div id="root"></div><script type="module" src="/fixture.js"></script>')
})

let browser
try {
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const origin = `http://127.0.0.1:${server.address().port}`
  browser = await chromium.launch({ headless: true, executablePath })
  const page = await browser.newPage()
  const requests = []
  let failRequest = false
  let resolvePending
  let onPendingRequest
  const pendingRequestStarted = new Promise((resolve) => {
    onPendingRequest = resolve
  })
  let holdRequest = false
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.pathname.startsWith('/api/admin/')) {
      requests.push({ method: request.method(), path: url.pathname, body: request.postDataJSON() })
      if (holdRequest)
        await new Promise((resolve) => {
          resolvePending = resolve
          onPendingRequest()
        })
      await route.fulfill({
        status: failRequest ? 503 : 200,
        contentType: 'application/json',
        body: JSON.stringify(
          failRequest
            ? { message: 'Fixture clearing unavailable. Apply migration 004.' }
            : { deleted: 2 }
        )
      })
      return
    }
    // Only the local fixture server can receive non-API requests.
    if (url.origin === origin) return route.continue()
    await route.abort()
  })
  await page.goto(`${origin}/__record-clearing`)
  const dialog = page.getByRole('dialog')
  const confirmation = () => dialog.getByRole('textbox')
  const submit = () => dialog.getByRole('button', { name: 'Clear all data', exact: true })

  for (const category of ['attendance', 'payments', 'renewals', 'maintenance', 'notifications']) {
    await page.getByRole('button', { name: `Open ${category}`, exact: true }).click()
    assert.equal(await submit().isDisabled(), true)
    await confirmation().fill('clear')
    assert.equal(await submit().isDisabled(), true)
    await confirmation().fill('CLEAR ')
    assert.equal(await submit().isDisabled(), true)
    const before = requests.length
    await confirmation().press('Enter')
    assert.equal(requests.length, before, 'Invalid confirmation must not send a request.')
    await dialog.locator('form').evaluate((form) => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    assert.match(await dialog.getByRole('alert').textContent(), /Type CLEAR exactly/)
    assert.equal(requests.length, before, 'The handler must reject invalid confirmation too.')
    await confirmation().fill('CLEAR')
    assert.equal(await submit().isEnabled(), true)
    await submit().click()
    await dialog.waitFor({ state: 'detached' })
    assert.equal(requests.length, before + 1)
    assert.deepEqual(requests.at(-1), {
      method: 'DELETE',
      path:
        category === 'notifications'
          ? '/api/admin/notifications'
          : `/api/admin/reports/${category === 'renewals' ? 'payments' : category}`,
      body: {
        category,
        confirmation: 'CLEAR',
        ...(category === 'notifications' ? { group: 'membership' } : {})
      }
    })
    assert.match(
      await page.getByRole('status').textContent(),
      /2 records cleared.*totals refreshed/
    )
  }
  console.log(
    'PASS: Every Clear all category requires exact confirmation and sends its scoped request.'
  )

  failRequest = true
  await page.getByRole('button', { name: 'Open attendance', exact: true }).click()
  await confirmation().fill('CLEAR')
  await submit().click()
  await dialog.getByRole('alert').waitFor()
  assert.match(await dialog.getByRole('alert').textContent(), /migration 004/)
  assert.equal(await submit().isEnabled(), true)
  const refreshedBefore = await page.evaluate(() => window.clearTest.refreshed)
  failRequest = false
  holdRequest = true
  await submit().click()
  await pendingRequestStarted
  const busyButton = dialog.getByRole('button', { name: 'Deleting…', exact: true })
  await busyButton.waitFor()
  assert.equal(await busyButton.isDisabled(), true)
  assert.equal(await dialog.getByRole('button', { name: 'Cancel', exact: true }).isDisabled(), true)
  await page.waitForFunction(
    () => document.querySelector('[role="dialog"]').getAttribute('aria-busy') === 'true'
  )
  assert.equal(typeof resolvePending, 'function')
  await page.evaluate(() => {
    window.clearTest.refreshFails = true
  })
  resolvePending()
  await dialog.waitFor({ state: 'detached' })
  assert.match(await page.getByRole('status').textContent(), /2 records cleared.*Refresh failed/)
  assert.equal(await page.evaluate(() => window.clearTest.refreshed), refreshedBefore + 1)
  console.log(
    'PASS: API errors remain retryable; pending actions lock; refresh errors preserve deletion success.'
  )
} finally {
  await browser?.close()
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
}
