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
    if (role === 'admin') assert.ok(!html.includes('<span>Memberships</span>'))
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
  assert.ok(!reports.includes('Create account'))
  assert.ok(
    !reports.includes('Clear All'),
    'Member account reports must not offer bulk history clearing.'
  )
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

  const EquipmentCategorySelect = await load('components/EquipmentCategorySelect')
  const newEquipmentCategory = render(EquipmentCategorySelect)
  assert.ok(
    newEquipmentCategory.includes('name="category"') && newEquipmentCategory.includes('required=""')
  )
  assert.ok(
    newEquipmentCategory.includes(
      '<option value="" disabled="" selected="">Choose category</option>'
    )
  )
  assert.equal((newEquipmentCategory.match(/<option /g) || []).length, 9)
  const selectedCategory = render(EquipmentCategorySelect, {
    value: 'Free Weights Section',
    onChange: () => {},
    'aria-label': 'Category for dumbbells'
  })
  assert.ok(selectedCategory.includes('<option value="Free Weights Section" selected="">'))
  assert.ok(selectedCategory.includes('aria-label="Category for dumbbells"'))
  const previousCategory = render(EquipmentCategorySelect, {
    value: 'Treadmill',
    onChange: () => {}
  })
  assert.ok(previousCategory.includes('<option value="Treadmill" disabled="" selected="">'))
  assert.ok(previousCategory.includes('Treadmill (current category)'))
  console.log(
    'PASS: Equipment categories require selection, retain saved choices, and preserve legacy values.'
  )

  const { default: RecordDeleteDialog, RecordDeleteButton } = await vite.ssrLoadModule(
    '/src/components/RecordDeleteControls.jsx'
  )
  const clearButton = render(RecordDeleteButton, {
    all: true,
    label: 'Clear all attendance records',
    disabled: true
  })
  assert.ok(clearButton.includes('aria-label="Clear all attendance records"'))
  assert.ok(clearButton.includes('aria-haspopup="dialog"') && clearButton.includes('disabled=""'))
  assert.ok(clearButton.includes('Clear all data') && clearButton.includes('fill-rule="evenodd"'))
  const deleteButton = render(RecordDeleteButton, {
    label: 'Delete attendance record for Test Member'
  })
  assert.ok(deleteButton.includes('aria-label="Delete attendance record for Test Member"'))
  assert.ok(!deleteButton.includes('Clear all data'))

  for (const category of ['attendance', 'payments', 'renewals', 'maintenance']) {
    const dialog = render(RecordDeleteDialog, {
      target: { all: true, category, count: 12 },
      onClose: () => {},
      onChanged: async () => true,
      onNotice: () => {}
    })
    assert.ok(dialog.includes('role="dialog"') && dialog.includes('aria-modal="true"'))
    assert.ok(dialog.includes('pattern="CLEAR"') && dialog.includes('name="confirmation"'))
    assert.ok(dialog.includes('every page and records hidden by search'))
    if (category === 'renewals') assert.ok(dialog.includes('Only renewal payments are included.'))
    if (category === 'maintenance')
      assert.ok(dialog.includes('Equipment and its current condition stay unchanged.'))
  }
  const singleDelete = render(RecordDeleteDialog, {
    target: { category: 'payments', id: 'fixture-id', label: 'Test <Member>' }
  })
  assert.ok(singleDelete.includes('Test &lt;Member&gt;'))
  assert.ok(!singleDelete.includes('name="confirmation"'))
  const missingId = render(RecordDeleteDialog, {
    target: { category: 'payments', label: 'Missing ID' }
  })
  assert.ok(
    !missingId.includes('Clear all data'),
    'A missing row ID must never select bulk deletion.'
  )
  console.log(
    'PASS: Delete controls have accessible labels, disabled states, and explicit bulk confirmation.'
  )

  const AdminNotifications = await load('components/AdminNotifications')
  const notificationState = {
    canDismiss: true,
    email: { configured: true, enabled: true, trackingReady: true },
    notifications: [
      {
        id: 'member-alert',
        kind: 'membership',
        name: 'Test Member',
        email: 'member@fixture.test',
        membershipEnd: '2026-10-22T00:00:00Z',
        type: 'expired',
        delivery: { state: 'sent', sentAt: '2026-10-22T01:00:00Z' }
      },
      {
        id: 'equipment-alert',
        kind: 'equipment',
        name: 'Treadmill',
        condition: 'Good',
        lastInspected: null
      }
    ]
  }
  const notificationPanel = render(AdminNotifications, {
    state: notificationState,
    canManage: true
  })
  for (const text of [
    'Clear all membership reminders',
    'Clear all equipment reminders',
    'Delete notification for Test Member',
    'Delete notification for Treadmill',
    'Email sent to mail server',
    'Sent:',
    'Check SMTP',
    'Run reminders now'
  ])
    assert.ok(
      notificationPanel.includes(text),
      `Missing notification control or delivery detail: ${text}`
    )
  const staffNotifications = render(
    AdminNotifications,
    { state: notificationState, canManage: false },
    'staff'
  )
  assert.ok(
    !staffNotifications.includes('Clear all data') &&
      !staffNotifications.includes('Delete notification')
  )
  assert.ok(staffNotifications.includes('Email sent to mail server'))
  const notificationDialog = render(RecordDeleteDialog, {
    target: {
      all: true,
      category: 'notifications',
      group: 'membership',
      scopeLabel: 'membership reminders',
      count: 1
    }
  })
  assert.ok(notificationDialog.includes('Clear all membership reminders?'))
  assert.ok(notificationDialog.includes('email delivery records are preserved'))
  assert.ok(!notificationDialog.includes('export a CSV'))
  console.log('PASS: Notifications expose delivery receipts and scoped admin-only clearing.')

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

  const AccountDeleteDialog = await load('components/AccountDeleteDialog')
  const accountDeletion = render(AccountDeleteDialog, {
    account: { id: 'member-id', name: 'Test <Member>', email: 'member@fixture.test' },
    self: true,
    onClose: () => {},
    onDeleted: () => {}
  }, 'member')
  assert.ok(accountDeletion.includes('role="dialog"'))
  assert.ok(accountDeletion.includes('Test &lt;Member&gt;'))
  assert.ok(accountDeletion.includes('type="password"'))
  assert.ok(accountDeletion.includes('pattern="DELETE"'))
  assert.ok(accountDeletion.includes('payments, and attendance history'))
  console.log('PASS: Account deletion explains permanent data loss and requires password and confirmation.')

  const Loader = await load('components/HeartRateLoader')
  const loader = render(Loader, { message: 'Opening your dashboard' })
  assert.ok(loader.includes('--loader-duration:1000ms') && loader.includes('loading-pulse'))
  console.log('PASS: The heartbeat loader renders with the shared one-second duration.')
} finally {
  await vite.close()
}
