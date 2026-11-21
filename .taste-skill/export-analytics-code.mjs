import fs from 'node:fs'

const files = [
  'index.html',
  'server/bootstrap/registerApiRoutes.js',
  'server/repositories/AnalyticsRepository.js',
  'server/services/AnalyticsService.js',
  'server/routes/analytics.js',
  'server/routes/analytics.test.js',
  'src/components/admin/AdminDashboardSection.jsx',
  'src/pages/AdminStaffPage.jsx',
  'src/components/mobile/MobileScreens.jsx',
  ...fs
    .readdirSync('src/components/admin/analytics')
    .filter((name) => /\.(jsx|js|css)$/.test(name))
    .map((name) => `src/components/admin/analytics/${name}`),
  '.taste-skill/analytics-preview.html',
  '.taste-skill/analytics-preview.jsx',
  '.taste-skill/analytics-preview-server.mjs',
  '.taste-skill/export-analytics-code.mjs',
  '.taste-skill/.gitignore'
]
const fence = '`'.repeat(3)
let content = `# FitPulse analytics: complete source

Complete current contents of every application, test, and preview source file added or edited for this feature. Existing user edits in the touched files are preserved. Local preview files contain test fixtures only and are outside the production application.

See ADMIN_ANALYTICS.md in this folder for data flow, endpoint contracts, metric definitions, and verification notes.

`
for (const file of files) {
  const language = file.endsWith('.html')
    ? 'html'
    : file.endsWith('.css')
      ? 'css'
      : file.endsWith('.jsx')
        ? 'jsx'
        : 'javascript'
  content += `## ${file}\n\n${fence}${language}\n${fs.readFileSync(file, 'utf8').trimEnd()}\n${fence}\n\n`
}
content += `## Database queries and placement

All queries are already in server/repositories/AnalyticsRepository.js:

- attendance(): attendance_logs, QR scan types and token IDs, bounded to the current Manila week and now.
- memberships(): member roles, users, and newest-first subscriptions; one latest subscription per member.
- payments(): amount/status/date/method fields, bounded to the relevant time window.
- paymentMethods(): method IDs and names from payment_methods.

AnalyticsService.js aggregates the rows and filters successful payments. No SQL migration is needed. Do not add privileged database queries to React.

## Common mistakes to avoid

1. Loading the CDN after React or using latest instead of pinned version 4.4.7.
2. Editing public/index.html instead of the actual Vite root index.html.
3. Omitting a fixed-height, relatively positioned canvas parent or maintainAspectRatio: false.
4. Skipping chart.destroy() during effect cleanup, especially on theme changes and React StrictMode remounts.
5. Reading theme variables before the theme DOM update.
6. Omitting API authentication or the server admin role check.
7. Exposing Supabase privileged keys in frontend code or committing .env files.
8. Counting historical renewals twice, including failed payments, grouping dates in UTC, or stopping at 1,000 rows.
9. Treating API/CDN failures as zero data or importing preview fixtures into production.
`
fs.writeFileSync('docs/ADMIN_ANALYTICS_CODE.md', content)
console.log(`Wrote complete source for ${files.length} files (${content.length} characters).`)

const gatePath = '.taste-skill/gate.json'
const resultsPath = '.taste-skill/analytics-qa-results.jsonl'
if (fs.existsSync(gatePath) && fs.existsSync(resultsPath)) {
  const gate = JSON.parse(fs.readFileSync(gatePath, 'utf8'))
  const results = fs
    .readFileSync(resultsPath, 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
  const consistency = JSON.parse(
    fs.readFileSync('.taste-skill/gate/consistency/report.json', 'utf8')
  )
  const open = gate.open || []
  let report = `GATE: FAIL ${open.length} (round ${gate.round} of ${gate.max})

# FitPulse analytics verification

The requested analytics implementation is complete. The broader design gate remains open: its marketing-page rules conflict with preserving an authenticated dashboard and using a consistent chart wrapper. Existing shell contrast/focus and fixed mobile navigation findings also remain open. No waivers or unrelated shell redesign were applied.

Kind: software, an existing gym admin portal. The requested navy/red/orange/gold palette and existing Fredoka/Nunito fonts, shell, hero, and clay surfaces were retained. No new photographs, assumed business facts, brand names, marketing effects, scenes, or creative moments were added. Preview numbers are isolated test fixtures, not production fallback data.

## Verification completed

- 13 focused API, aggregation, pagination, authentication, and route-regression tests passed.
- Production build passed; the existing camera/runtime chunk-size warnings remain.
- Read-only live Supabase checks verified all four aggregate queries; no records/schema were changed.
- Source formatting and focused Git whitespace checks passed.
- Browser checks used the actual dashboard components with a separate local fixture server and Chart.js 4.4.7 from the pinned CDN.
- Screenshots at 1440, 1024, 820, 768, 390, and 320 pixels were inspected. Mobile charts scroll within the existing app shell.
- Theme changes destroyed old chart instances and rebuilt them with updated CSS colors. Unmount/remount left no duplicate canvas ownership.
- Empty, loading, API failure/retry, malformed responses, partial failure, and unavailable CDN states passed.

## Browser assertion runs

| Width | State | Theme | Result | Assertions |
| --- | --- | --- | --- | --- |
`
  for (const result of results) {
    report += `| ${result.width} | ${result.mode} | ${result.theme || 'light'} | ${result.passed ? 'PASS' : 'FAIL'} | ${result.assertions?.length || 0} |\n`
  }
  report += `
## Checker limits and open findings

The skill's separate layout/check.mjs could not run: no Chrome found (set CHROME_PATH). Its screenshot and consistency scripts did run with installed Edge. No performance pass is claimed. The consistency quick run did not check: ${consistency.notChecked.join('; ')}.

No waivers were added. All ${open.length} open gate findings follow, including genuine existing shell findings; they are not silently treated as passes.

`
  for (const finding of open) {
    report += `### ${finding.check} (${finding.widths?.join(', ') || 'all'}px)\n\nLocation: ${finding.where}\n\n${finding.msg}\n\nSuggested checker fix: ${finding.fix}\n\n`
  }
  report += `## Reproducing the preview

Run node .taste-skill/analytics-preview-server.mjs, then open http://127.0.0.1:5174/.taste-skill/analytics-preview.html. Query options include state=empty, state=loading, state=error, state=invalid, state=partial, state=cdn-error, theme=dark, and checks=1. Test fixture numbers never enter the production app. Close the preview server when done.
`
  fs.writeFileSync('docs/ADMIN_ANALYTICS_QA.md', report)
  console.log(
    `Wrote QA report: ${open.length} open general-gate findings; ${results.length} browser assertion runs.`
  )
}
