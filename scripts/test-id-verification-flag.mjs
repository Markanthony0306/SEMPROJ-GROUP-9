// Render the real dialogs in both desktop and mobile layouts, using synthetic data.
// No API server, Supabase writes, camera access or emails are involved.
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

globalThis.localStorage = { getItem: () => null }
globalThis.window = { matchMedia: () => ({ matches: false }) }

const member = {
  id: 'fixture-member', name: 'Test Member', email: 'member@example.test',
  role: 'user', status: 'active', plan: 'Monthly', memberCode: 'FP-TEST1234',
  membershipStart: '2026-01-01', membershipEnd: '2099-01-01', verificationStatus: 'skipped'
}
const commonProps = {
  currentUser: { role: 'admin' }, modal: { kind: 'create' },
  data: { membershipPlans: [{ plan_id: 2, plan_name: 'Monthly' }] },
  planOptionLabel: (plan) => plan.plan_name, members: [member], renewals: [],
  date: () => 'Jan 1, 2099', money: String, setModal: () => {}
}

for (const [flag, production, skipped] of [
  ['false', false, true], ['true', false, false], [undefined, false, false],
  ['FALSE', false, false], ['0', false, false], [' false ', false, false],
  ['false', true, false]
]) {
  const vite = await createServer({
    configFile: false, envDir: false,
    cacheDir: 'node_modules/.vite-verification-tests',
    optimizeDeps: { noDiscovery: true, include: [] },
    esbuild: { jsx: 'automatic' },
    define: {
      'import.meta.env.VITE_ID_VERIFICATION_ENABLED': flag === undefined ? 'undefined' : JSON.stringify(flag),
      'import.meta.env.PROD': JSON.stringify(production)
    },
    server: { middlewareMode: true, hmr: false, watch: null }, logLevel: 'error'
  })
  try {
    const { AuthProvider } = await vite.ssrLoadModule('/src/auth/AuthContext.jsx')
    const { DashboardSheetContext } = await vite.ssrLoadModule('/src/components/Dialog.jsx')
    const { default: Dialogs } = await vite.ssrLoadModule('/src/components/admin/AdminStaffDialogs.jsx')
    const render = (Component, props, mobile = false) => renderToStaticMarkup(
      React.createElement(AuthProvider, null,
        React.createElement(DashboardSheetContext.Provider, { value: mobile },
          React.createElement(Component, props)))
    )

    for (const mobile of [false, true]) {
      const html = render(Dialogs, commonProps, mobile)
      assert.equal(html.includes('Testing mode: ID and face verification disabled'), skipped)
      assert.equal(html.includes('Choose ID type'), !skipped)
      assert.equal(html.includes('id-check-wizard'), !skipped)
      for (const field of ['name', 'phone', 'email', 'plan']) {
        assert.ok(html.includes(`name="${field}"`), `Missing member field: ${field}`)
      }
      if (skipped) {
        assert.match(html, /type="submit">Create/)
        assert.doesNotMatch(html, /<video|ID verification consent|Start normal scan/)
      }
    }

    if (skipped) {
      const { default: MemberDialogs } = await vite.ssrLoadModule('/src/components/admin/AdminMemberDialogs.jsx')
      for (const mobile of [false, true]) {
        const html = render(MemberDialogs, {
          ...commonProps, modal: { kind: 'credentials', member, temporaryPassword: 'fixture-password' }
        }, mobile)
        assert.match(html, /Successful creation of a new member/)
        assert.match(html, /fixture-password/)
        assert.match(html, />Done<\/button>/)
        assert.doesNotMatch(html, />Face setup<\/button>/)
      }

      const { default: MembersSection } = await vite.ssrLoadModule('/src/components/admin/AdminMembersSection.jsx')
      const { default: MemberRow } = await vite.ssrLoadModule('/src/components/mobile/MemberRow.jsx')
      for (const verificationStatus of ['skipped', 'verified', 'unverified']) {
        const item = { ...member, verificationStatus }
        const desktop = render(MembersSection, { ...commonProps, query: '', members: [item] })
        const mobile = render(MemberRow, { member: item, date: commonProps.date })
        for (const html of [desktop, mobile]) {
          assert.equal(html.includes('Verification skipped'), verificationStatus === 'skipped')
        }
      }
    }
    console.log(`PASS: frontend flag=${String(flag)}, production=${production}; desktop and mobile.`)
  } finally {
    await vite.close()
  }
}
