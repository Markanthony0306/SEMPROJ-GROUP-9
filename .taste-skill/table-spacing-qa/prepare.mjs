import fs from 'node:fs/promises'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const storage = new Map([
  ['fitpulse-theme', 'light'],
  ['fitpulse-session', JSON.stringify({ token: 'isolated-fixture', user: { role: 'admin' } })]
])
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null }
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
  const h = React.createElement
  const load = async (name) => (await vite.ssrLoadModule(`/src/${name}.jsx`)).default
  const { AuthProvider } = await vite.ssrLoadModule('/src/auth/AuthContext.jsx')
  const { ThemeProvider } = await vite.ssrLoadModule('/src/components/brand/useTheme.jsx')
  const DataTable = await load('components/DataTable')
  const members = [
    { id: 'fixture-1', memberCode: 'FP-001', name: 'Alexandra Dela Cruz', email: 'alexandra.delacruz@fixture.test', phone: 'Fixture contact', role: 'user', plan: 'Monthly', status: 'active', membershipStart: '2026-11-01', membershipEnd: '2099-12-01' },
    { id: 'fixture-2', memberCode: 'FP-002', name: 'Christopher Alexander Santos', email: 'christopher.alexander.santos@fixture.test', role: 'user', plan: 'Annual', status: 'active', membershipStart: '2026-11-01', membershipEnd: '2099-12-01' }
  ]
  const data = {
    members,
    equipment: [{ id: 'equipment-1', name: 'Adjustable Cable Crossover', category: 'Free Weights Section', condition: 'Needs Maintenance', lastInspected: '2026-11-24' }],
    maintenance: [{ id: 'repair-1', equipmentId: 'equipment-1', item: 'Adjustable Cable Crossover', note: 'Inspected the cable assembly and replaced the worn protective sleeve. Follow-up inspection scheduled.', date: '2026-11-24' }],
    attendance: [{ id: 'attendance-1', memberId: members[0].id, memberName: members[0].name, source: 'QR check-in', date: '2026-11-24T09:30:00Z' }],
    payments: [{ id: 'payment-1', memberId: members[0].id, memberName: members[0].name, plan: 'Monthly', type: 'Renewal', amount: 1500, method: 'GCash', date: '2026-11-24' }]
  }
  const noop = () => {}
  const props = { data, members, currentUser: { role: 'admin' }, query: '', setQuery: noop, setModal: noop, setDeletion: noop, act: noop, canDeleteHistory: true, date: () => '11/24/2026', dateTime: () => '11/24/2026, 5:30 PM', money: () => 'PHP 1,500.00' }
  const table = (headings, values, searchable = true) => h(DataTable, { headings, searchable }, h('tr', null, ...values.map((value, index) => h('td', { key: index }, value))))
  const article = (title, children, className = '') => h('article', { className: `card clay ${className}` }, h('h2', null, title), children)
  const cases = [
    h(await load('components/admin/AdminMembersSection'), props),
    h(await load('components/admin/AdminPaymentsSection'), props),
    h(await load('components/admin/AdminAttendanceSection'), { ...props, section: 'History' }),
    h(await load('components/admin/AdminEquipmentSection'), props),
    h(await load('components/AdminReports'), { data }),
    article('Member attendance', table(['Date & Time', 'Recorded by'], ['11/24/2026, 5:30 PM', 'QR check-in'])),
    article('Member payments', table(['Payment', 'Plan', 'Amount', 'Method', 'Date'], ['Renewal', 'Monthly', 'PHP 1,500.00', 'GCash', '11/24/2026'])),
    article('Renewal history in a narrow dialog', table(['Plan', 'Amount', 'Method', 'Date'], ['Monthly', 'PHP 1,500.00', 'GCash', '11/24/2026'], false), 'qa-dialog'),
    article('Empty table', h(DataTable, { headings: ['Date & Time', 'Recorded by'], empty: true }))
  ]
  const markup = renderToStaticMarkup(h(AuthProvider, null, h(ThemeProvider, null,
    h('div', { className: 'app admin-app' }, h('aside', { className: 'clay' }, 'FitPulse table spacing preview'), h('main', null, ...cases))
  )))
  const memberMarkup = renderToStaticMarkup(h(AuthProvider, null, h(ThemeProvider, null,
    h('div', { className: 'app member-app' }, h('aside', { className: 'clay' }, 'FitPulse member table preview'), h('main', null, ...cases.slice(5, 7), cases.at(-1)))
  )))
  const files = ['src/styles/fitpulse-v3.css', 'src/styles/experience.css', 'src/styles/dashboard-features.css', 'src/components/DashboardShell.css', 'src/pages/AdminStaffPage.css', 'src/pages/UserPage.css']
  const css = (await Promise.all(files.map((file) => fs.readFile(file, 'utf8')))).join('\n')
  const probe = `
    const failures = [];
    const checks = [];
    for (const root of document.querySelectorAll('.data-table')) {
      const toolbar = root.querySelector('.table-toolbar');
      const controls = [...toolbar.querySelectorAll('input, select, .table-record-count')];
      const bounds = root.getBoundingClientRect();
      const frame = root.querySelector('.table-wrap');
      if (root.closest('.member-app') && innerWidth <= 560 && frame.scrollWidth > frame.clientWidth + 1) failures.push('Member card table scrolls sideways');
      for (const control of controls) {
        const rect = control.getBoundingClientRect();
        if (rect.left < bounds.left - 1 || rect.right > bounds.right + 1) failures.push('Toolbar spills: ' + control.outerHTML.slice(0, 80));
        if (rect.height < 43) failures.push('Control shorter than 44px');
      }
      for (let i = 0; i < controls.length; i++) for (let j = i + 1; j < controls.length; j++) {
        const a = controls[i].getBoundingClientRect(), b = controls[j].getBoundingClientRect();
        if (Math.min(a.right,b.right) - Math.max(a.left,b.left) > 1 && Math.min(a.bottom,b.bottom) - Math.max(a.top,b.top) > 1) failures.push('Overlapping toolbar controls');
      }
      const heading = root.querySelector('th'), cell = root.querySelector('tbody td:not(.table-empty)');
      if (cell && getComputedStyle(heading).paddingLeft !== getComputedStyle(cell).paddingLeft) failures.push('Header and body padding differ');
      for (const person of root.querySelectorAll('.member-table-person')) {
        if (person.getBoundingClientRect().width < 159) failures.push('Member name column is cramped');
      }
      const note = root.closest('.maintenance-log')?.querySelector('tbody td:nth-child(2)');
      if (note && note.getBoundingClientRect().width < 120) failures.push('Maintenance note column is cramped');
      for (const actions of root.querySelectorAll('.table-cell-actions')) {
        const cellBounds = actions.parentElement.getBoundingClientRect(), rect = actions.getBoundingClientRect();
        if (rect.width > cellBounds.width - 30) failures.push('Actions lack cell padding');
      }
      checks.push({ columns: root.querySelectorAll('th').length, width: Math.round(bounds.width) });
    }
    if (document.documentElement.scrollWidth > innerWidth + 1) failures.push('Page scrolls sideways');
    const result = { width: innerWidth, tables: checks.length, failures };
    document.querySelector('#qa-result').textContent = (failures.length ? 'FAIL' : 'PASS') + ': ' + JSON.stringify(result);
    document.documentElement.dataset.ready = 'true';
    if (failures.length) throw new Error(JSON.stringify(result));
  `
  const html = `<!doctype html><html lang="en" data-type="software"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="page-type" content="software"><meta name="site-kind" content="software"><title>FitPulse table spacing review</title><style>${css}\n#qa-result{padding:16px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px}.qa-dialog{max-width:550px}body>.app{padding-top:0}</style></head><body><pre id="qa-result">Checking table geometry…</pre>${markup}<script>${probe}</script></body></html>`
  await fs.writeFile('.taste-skill/table-spacing-qa/preview.html', html)
  await fs.writeFile('.taste-skill/table-spacing-qa/member.html', html.replace(markup, memberMarkup))
  console.log('Rendered 10 table variants from the real React components without API requests.')
} finally {
  await vite.close()
}
