# FitPulse admin analytics

The admin dashboard now has four stat cards and four Chart.js charts. The existing staff view, member view, navigation, actions, reminders, and activity sections keep their behavior. No dependencies were installed and no database records or schema were changed.

## Files and data flow

- `index.html`: loads Chart.js **4.4.7** from jsDelivr before the React module. FitPulse uses Vite's root `index.html`; adding `public/index.html` would not initialize this app.
- `server/bootstrap/registerApiRoutes.js`: mounts the new analytics router alongside the existing routers.
- `server/routes/analytics.js`: exposes the four JSON endpoints, runs authentication and the existing admin role middleware first, disables caching, and returns a safe 503 error when a query fails.
- `server/repositories/AnalyticsRepository.js`: contains all Supabase queries. It selects only the needed fields and pages through results in a stable order.
- `server/services/AnalyticsService.js`: turns those records into day counts, membership buckets, monthly revenue, and payment percentages.
- `src/components/admin/analytics/AdminAnalytics.jsx`: fetches each endpoint independently using the existing authenticated API helper. One failed request leaves the other charts available. Requests abort on unmount or refresh, and malformed responses become errors.
- `src/components/admin/analytics/ChartCard.jsx`: provides consistent headings, skeletons, empty messages, errors, and retry controls.
- `AttendanceChart.jsx`, `MembershipStatusChart.jsx`, `RevenueChart.jsx`, and `PaymentMethodsChart.jsx` in that folder: each owns its chart configuration and an accessible canvas.
- `useAnalyticsChart.js`: shares currency formatting, chart options, and the `useRef` / `useEffect` lifecycle. Each effect destroys its Chart instance during cleanup. Theme changes rebuild charts after the theme provider updates the CSS variables.
- `analytics.css`: reuses the clay surfaces and theme tokens, sets a fixed canvas container height, and uses two chart columns above 1024px and one at 1024px and below.
- `src/components/admin/AdminDashboardSection.jsx`: replaces the admin's previous summary/chart block with the new analytics. The staff branch keeps the previous block.
- `src/pages/AdminStaffPage.jsx` and `src/components/mobile/MobileScreens.jsx`: supply the same analytics through an optional mobile summary slot. Mobile member screens retain their default summary. The existing `data` object triggers a fresh analytics request after the parent reloads records, including after gym events and successful actions.
- `server/routes/analytics.test.js`: verifies date boundaries, membership renewals, money totals, empty data, pagination, signed sessions, role restrictions, and safe failures.

The connection is: **React → authenticated Node.js endpoint → server Supabase client → existing tables → aggregate JSON → Chart.js**.

RBAC means **role-based access control**. Hiding charts in React is only a display rule; the server role check enforces access. The server's privileged Supabase client can bypass Row Level Security (RLS, database rules controlling which rows a client may access), so its key must remain on the server. No new browser database access or RLS policies are needed.

## Endpoints and queries

All four endpoints require the existing `Authorization: Bearer <session-token>` header and the `admin` role. Missing sessions return 401; staff/member sessions return 403. Query failures return 503 without database details. Successful private responses have `Cache-Control: no-store`.

| Endpoint | Existing database queries | Rules |
| --- | --- | --- |
| `GET /api/analytics/attendance` | `attendance_logs`: select `check_in_time`, filter scanner entry types, non-null `qr_token_id`, and current week/time bounds | Counts valid QR scans from `ESP32-CAM` and `Staff` webcam scanning. Demo/non-QR rows are excluded. Monday through Sunday, zero-filled days, no future records. |
| `GET /api/analytics/membership-status` | `roles`: member role IDs; `users`: member IDs/status; `subscriptions`: member subscription dates/status ordered newest first, with an inner users relationship | Each member contributes at most one latest subscription. Returns `totalMembers`, `active`, `expiringSoon`, `expired`, `unclassified`, and `expiringDays`. |
| `GET /api/analytics/revenue` | `payments`: amount/status/date/method ID from the first of the earliest displayed month through now | Current month plus the previous five months; zero-filled months; returns `revenueThisMonth` and `paymentCount` too. Sums integer centavos before converting back to pesos. |
| `GET /api/analytics/payments` | `payments`: successful records through now; `payment_methods`: method ID/name | All-time Cash vs GCash share **by payment count**. Both raw counts and percentages are returned. Other methods are outside this chart's denominator. |

**Where to place the queries:** they are already implemented in `server/repositories/AnalyticsRepository.js`; aggregation is in `server/services/AnalyticsService.js`. Do not paste them into React or the Supabase SQL editor. No SQL migration is required.

Every paged query includes a stable unique ID as its final sort field. This avoids silently stopping at Supabase's usual 1,000-row response limit. At a much larger scale, move these aggregations into PostgreSQL functions or aggregate views and index the date fields after measuring query performance; repeated full subscription/payment-history scans will eventually become expensive. Offset pagination is not a transaction snapshot if records are inserted/deleted between pages.

Supabase documents the need for stable ordering with ranged queries in its [range reference](https://supabase.com/docs/reference/javascript/range).

## Date and payment definitions

- All calendar grouping uses `Asia/Manila`, independent of the server or browser timezone.
- A subscription is **expired** when its stored end timestamp is at or before the current instant. A membership ending later today remains valid until that time.
- **Expiring soon** means a currently valid membership whose Manila end date is today through seven calendar days from today, inclusive. Active means valid beyond that window. The buckets do not overlap.
- Missing/invalid dates, future starts, cancelled subscriptions, and inactive or unsupported account/subscription statuses are counted as `unclassified`; they are not falsely labelled active or expired. They remain included in Total members. The subtitle shows the excluded count when nonzero.
- Newest subscription is determined by `created_at` descending, then `subscription_id` descending to resolve ties. Older expired subscriptions do not double-count renewed members.
- Revenue and payment share accept explicit successful statuses `paid`, `completed`, `success`, and `successful`, ignoring capitalization and surrounding spaces. Pending, failed, refunded, null, and unknown statuses are excluded. If the database introduces another successful status, update `SUCCESSFUL_PAYMENTS` after confirming its meaning.
- Attendance peak ties are all orange. A completely empty series displays “No data yet” instead of a fabricated dataset.
- A zero revenue value with successful zero-value payments is still valid chart data. Stat cards show real zeros; an unavailable API shows “Unavailable”.

## Verification

Run the focused tests and production build from the project root:

```powershell
node --test server/routes/analytics.test.js server/bootstrap/createFitPulseApp.test.js
npm.cmd run build
```

The tests use isolated records and signed test sessions. Read-only live checks also verified all four repository/service queries against the existing Supabase tables; they returned real aggregates, including empty attendance/payment results. No sample records were inserted.

The focused test run passed 13 checks, and the production build passed with the existing Vite large-chunk warnings. Browser checks passed for the real dashboard components at 320, 390, 768, 820, 1024, and 1440 pixels, including theme rebuilds, unmount cleanup, empty data, loading, partial failure, invalid responses, retry, and unavailable Chart.js.

The general design skill gate reports `GATE: FAIL 38 (round 1 of 3)`. Its marketing-page requirements (full-screen hero, creative moments, varied card layouts) conflict with this task's preserved app shell and consistent chart wrapper. It also flags existing shell contrast/focus styles and mobile navigation over scrolling content. These findings remain open; no waivers or unrelated redesign were applied. Its separate layout script could not locate Chrome, although the skill's screenshot/consistency scripts ran with installed Edge. See `ADMIN_ANALYTICS_QA.md` for the complete findings. Performance and the marketing-page gate are not claimed as passed.

The `.taste-skill/analytics-preview.*` helpers are a separate local visual test harness, outside the production import graph. Their labelled fixtures exercise populated charts without becoming fallback application data. The preview server records its browser assertions in `.taste-skill/analytics-qa-results.jsonl`.

Restart the existing API process after changing server code so it registers the new routes. Use the project's normal frontend and backend launch commands (`npm run dev`, `npm run server`).

## How the React code works

`useRef` keeps a reference to a canvas between renders. `useEffect` creates its chart only after real data arrives; its cleanup destroys the previous chart before data, theme, or screen changes create another. The theme rebuild waits one animation frame so it reads the updated CSS colors.

This follows Chart.js's documented [destroy lifecycle](https://www.chartjs.org/docs/latest/developers/api.html) and [responsive container sizing](https://www.chartjs.org/docs/latest/configuration/responsive.html).

Each request has an AbortController, which cancels work when the dashboard leaves or a newer refresh starts. Each chart has its own loading/error/empty state and retry control. Charts use real counts for their proportions and show percentages or peso values in labels/tooltips.

The main failure points are CDN availability, an API process that has not restarted, changed database statuses/relationships, and increasing history volume. The professional approach is to keep the privileged queries on the server, document the metric definitions, test date boundaries and role restrictions, and move aggregation closer to the database as volume grows.

Suggested commit message: `feat(analytics): add admin dashboard charts and protected aggregate endpoints`

## Common mistakes to avoid

1. Loading Chart.js after React, using an ES-module build as a global, or changing the pinned CDN URL to `latest`.
2. Adding `public/index.html` in this Vite app instead of editing its actual root entry file.
3. Giving only the canvas a height. Its dedicated parent needs a fixed height, `position: relative`, and `maintainAspectRatio: false`.
4. Creating a chart during render or skipping `chart.destroy()` in effect cleanup. React StrictMode and theme toggles expose this quickly.
5. Hardcoding theme text/background colors in the JavaScript configuration or reading them before the theme DOM update.
6. Fetching protected data without the session token or relying only on a React role check.
7. Putting a Supabase privileged key in frontend code or committing `.env` files.
8. Counting every subscription row, including old renewals, as a separate member.
9. Grouping dates in UTC/browser local time, counting failed payments as revenue, or returning only the first 1,000 database records.
10. Treating a failed API/CDN load as a real zero or adding sample numbers to the production dashboard.

Optional practice: add a “Last updated” time to the analytics using Manila formatting, then make it refresh after a successful retry.
