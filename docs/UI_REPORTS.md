# Dashboard and reports experience

The admin and member pages share the reference screens’ pale blue clay surfaces,
rounded rows, orange actions, and soft shadows. The existing theme tokens also
support dark mode. No new dependencies or database migrations are required.

## What changed

- `src/components/ActivityChart.jsx` and `src/utils/activityChart.js`: reusable,
  keyboard-accessible charts with selectable bars and 7-day/6-month periods.
  Admins can switch between check-ins and revenue. Members see their own visits.
  Values come from API records and are grouped by Asia/Manila calendar dates.
- `src/styles/experience.css`: shared dashboard, record-table, report-tab, and
  dialog styles. Small screens retain the existing stacked record layout.
- `src/components/AdminReports.jsx`: category filters, view/edit dialogs,
  confirmation before deletion, source-record updates, totals, and CSV export.
- `src/pages/AdminStaffPage.jsx` and `src/pages/UserPage.jsx`: welcome cards,
  quick actions, charts, clearer member records, and retry controls.
- `src/pages/Login.jsx`: removes development-account shortcuts, credential
  constants, and their background request. Existing accounts are not deleted.
- `src/App.jsx`, `src/auth/AuthContext.jsx`, and
  `src/components/HeartRateLoader.jsx`: stable authentication callbacks, lazy
  dashboard imports, and a pulse loader that fades when dashboard requests finish
  or fail. There is no fixed 1.5-second login delay.
- `src/components/FaceCapture.jsx`: camera preparation, permission, scanning,
  verification, and success states; retry guidance; optional help/privacy details;
  and cleanup when leaving the camera. Reduced-motion preferences are respected.
- `server/services/emailTemplates.js`: escaped, responsive HTML with an embedded
  PNG logo, helpful copy, clear actions, and a plain-text alternative.

## Reports: frontend → API → Supabase

The report view is derived from existing records. It does not store a second,
potentially inconsistent copy of the same data.

| Category         | Actions                                                 | Source                     |
| ---------------- | ------------------------------------------------------- | -------------------------- |
| Active / expired | View, edit member details, renew                        | Users and subscriptions    |
| Attendance       | View, correct existing entries, delete                 | `attendance_logs`          |
| Payment          | Create, view, edit, delete                              | `payments`                 |
| Renewal          | Renew membership; view, edit, delete its payment record | Subscriptions and payments |
| Maintenance      | Create, view, edit, delete maintenance notes            | `gym_maintenance`          |

Membership reports use the existing member and renewal workflows. They do not
delete member accounts. Deleting a payment does not cancel its subscription;
deleting a maintenance note does not delete the equipment.

New attendance is recorded through the authenticated entrance scanner. The manual
member selector and staff check-in button have been removed from Attendance, and
Reports has no attendance creation action. The legacy manual check-in endpoints
and POST `/api/admin/reports/attendance` return 403, including for admins and staff.
Existing attendance history is preserved.

`server/routes/reports.js` accepts GET on
`/api/admin/reports/{payments|attendance|maintenance}`, POST for payments and
maintenance, and PATCH/DELETE on `/api/admin/reports/{kind}/{uuid}`. It uses the
existing authentication and role middleware. Admins and staff can read/update;
only admins can delete. Payment and maintenance creation remain available.
`server/services/reportRecords.js` validates amounts, dates, members, methods, and
equipment. The browser cannot choose arbitrary database tables or reassign the
member/subscription of an existing payment. Editing a scanner entry preserves its
original scanner metadata; responses omit scanner request and QR token IDs.

After a successful write, the parent reloads its API data so reports and charts
use the latest source records. A refresh failure is shown separately from a
successful save, to avoid encouraging duplicate submissions.

Renewal labels are inferred from subscription chronology because the existing
schema has no payment-type column. They survive reloading while subscription
history is present. Imported data with missing or equal subscription timestamps
cannot always distinguish a renewal; an explicit type column is the appropriate
future schema improvement.

## Email delivery

Welcome and membership reminders use the existing Nodemailer transport. Recovery
emails use a Supabase-generated one-time recovery link and the same branded SMTP
template when SMTP is configured. The provider still creates and verifies the
recovery token. Without SMTP, password recovery retains Supabase’s email delivery
and its configured provider-side template.

Keep `SMTP_*`, `SUPABASE_SECRET_KEY`, and other secrets on the server. Set
`CLIENT_URL` to the actual frontend URL, and allow its `/reset-password` URL in
Supabase Auth’s redirect configuration. The logo is attached inline by content ID,
so these emails do not rely on publicly accessible localhost images. Some email
clients block images; the brand name and plain-text version remain readable.

Reference: [Supabase admin generateLink documentation](https://supabase.com/docs/reference/javascript/auth-admin-generatelink).

## Verification

```powershell
node --test scripts/test-report-experience.mjs
node scripts/test-ui-render.mjs
npm.cmd run build
```

The integration checks run the real report router and Supabase SDK against an
in-memory REST fixture. They verify role restrictions, CRUD persistence, invalid
input, missing records, scanner metadata, renewal classification, chart date
boundaries, email escaping/attachments, recovery delivery, and error handling.
The render checks exercise the actual React components without a browser.
These tests never load the real `.env`, send email, or modify cloud data.

Browser tools were unavailable during implementation. Visual layout, animations,
real camera permissions/matching, and inbox rendering still need a live browser
and device check. The build’s remaining large-chunk warning comes from the
existing face-api.js library, which is already loaded on demand.

Graphify was used for a local code-only map. Generated files stay in the ignored
`graphify-out/` directory. SQL files were not parsed because the optional SQL
parser is not installed; no packages were added.

## Professional next steps

For production financial records, prefer voiding with an audit trail and a reason
over permanent deletion. The current delete action explicitly confirms removal
and is administrator-only. Database-side audit logging, optimistic concurrency
checks, and server-side pagination are the next steps as data volume grows.
Existing local face matching does not prove liveness; the loading animation is
presentation, not an additional identity or anti-spoofing control.

Suggested commit: `feat: add clay dashboards and protected report CRUD`

Practice: add a “This month” chart period using the existing Manila date buckets.
