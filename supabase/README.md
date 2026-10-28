# Supabase setup

1. Open your Supabase project and run `migrations/001_fitpulse_database.sql` in the SQL Editor. This migration extends the existing `users` and `roles` tables and uses the existing `subscriptions`, `membership_plans`, `payment_methods`, `payments`, and `attendance_logs` tables.
2. In the project root, copy `.env.example` to `.env` and set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, the server-only `SUPABASE_SECRET_KEY`, and a random `JWT_SECRET`. Keep `JWT_SECRET` unchanged between API restarts so existing sessions and member QR codes remain valid.
3. Run `npm install`, then start the API with `npm run server` and the web app with `npm run dev`.

The API reads and writes member profiles in `users`, membership periods in `subscriptions`, attendance in `attendance_logs`, and payment records through `payments.subscription_id`. Plan names and payment method IDs come from `membership_plans` and `payment_methods`. Equipment, maintenance history, gym settings, and profile photos are also stored in Supabase. The running app does not read or write `data.json` or local avatar files.

Equipment categories use the eight gym areas defined in `shared/equipmentCategories.js`. The Add Equipment form and Equipment Monitoring category dropdown share this list, and the API validates category selections before saving to `gym_equipment.category`. Older category names remain visible until staff select a new area; no database migration is needed for this change.

If you need to keep data from an older `server/data.json`, run `npm run migrate:json-data` once after applying the SQL migration and configuring `.env`. The importer links account records to existing Supabase Auth users by email, copies related records and local photos, and does not import password hashes. Keep the old file private until you have confirmed the imported records.

The `migrate:demo-auth` command is an older one-time helper for provisioning the two demo logins. New development demo accounts are provisioned directly in Supabase when the API starts.

## Automatic membership expiry reminders

1. Run `migrations/005_admin_notifications.sql` in the Supabase SQL Editor after migration 001. It also includes the reminder table and claim function from migration 003, so it repairs projects that skipped 003. It preserves existing receipts, adds delivery-attempt tracking, and copies the older `gym_settings.email_notifications` preference into `email_enabled`. RLS (Row Level Security, which controls access to table rows) blocks browser access; only the API's server key can use these tables and functions.
2. Set the existing `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` values in the API's private environment. Set `CLIENT_URL` to the member website. SMTP is the service the API uses to send email; Supabase Auth email settings do not configure this sender.
3. Restart `npm run server`. In **Settings → Gym Preferences**, enable **Send automatic email reminders** and choose the reminder period (3, 5, or 7 days).
4. Open **Notifications**. **Check SMTP** verifies the connection and login without sending an email. **Run reminders now** processes currently due reminders using the same duplicate-prevention claims as the worker. The notification list refreshes every 15 seconds while this page is open.

The API checks on startup, after saving enabled email preferences, and hourly after each check finishes. Members receive one upcoming-expiry email within the configured period and one expired email at the first check after expiry. Expiry dates display in Asia/Manila time. Staff, suspended/inactive members, future memberships, cancelled subscriptions, invalid dates, and invalid email addresses are skipped. Only the latest subscription is considered. A renewal with a new expiry date is a new reminder period.

The `membership_reminders` table remembers SMTP-accepted emails across restarts. Atomic database claims prevent overlapping API instances from sending the same reminder. Known SMTP failures release the claim and retry on the next check; one failure does not stop other members. An abandoned claim becomes available after 10 minutes. If SMTP accepts an email but the API crashes before saving its receipt, a retry can still duplicate it: SMTP and PostgreSQL cannot share one transaction. Check server logs and the delivery table when an acknowledgement fails. SMTP acceptance also does not guarantee inbox delivery; monitor the mail provider for bounces.

Keep the API running on a host that supports a persistent Node process. Closing the admin page does not stop reminders, but stopping or sleeping the API does. GitHub Pages hosts only the frontend; it cannot run this worker. For serverless deployment or a much larger membership list, move the same service to a scheduled worker with a durable queue. When the API resumes after downtime, it checks the latest membership state and sends the reminder currently due rather than old pre-expiry emails.

Each membership alert displays **not sent**, **failed**, **sending**, or **sent to mail server**, with available attempt and acceptance timestamps. A sent receipt means SMTP accepted the message, not proof of inbox delivery. Safe failure codes help diagnose SMTP problems without exposing private credentials. The existing protected expiry-email endpoint uses the same claims, so it cannot routinely duplicate an automatic reminder.

Administrators can delete one notification or use **Clear all data** separately for Membership reminders and Equipment inspection reminders. These actions dismiss current alerts only for the signed-in administrator. They preserve members, subscriptions, equipment, and email receipts, so clearing notifications never resets duplicate-email protection. A new membership expiry period, an upcoming-to-expired transition, or a new overdue inspection can produce a new alert. Migration 005 stores dismissals privately in `admin_notification_dismissals`; staff can view notifications and delivery status but cannot clear them or run manual mail checks.

The admin interface keeps its desktop sidebar, columns, and tables at a minimum width of 1280px. Smaller screens scroll horizontally. Member pages retain their responsive layout. Delete buttons use brighter dark-mode colors; Clear all data buttons have a shine on hover, disabled for reduced-motion preferences.

Run `npm run test:reminders` for isolated SDK and mailer tests. These tests use no real credentials and send no real email. Applying the SQL migration and verifying delivery to a test inbox are separate deployment steps.

If startup reports `Unable to claim a membership reminder`, check the deployed
database before changing SMTP. Run `npm.cmd run check:reminders`. It verifies the
required columns and permissions, then makes an ineligible claim-function probe;
it sends no emails and reserves no real reminder. `PGRST205` means a required
table is missing, `PGRST202` means the claim function is unavailable in the Data
API, `42703` means a required column is missing, and `42501` means access is denied.

Apply the complete migration 005 to the same project as the API's `SUPABASE_URL`,
then rerun the diagnostic until it prints `PASS`. Migration 005 preserves existing
reminder receipts and email preferences and refreshes the API schema cache.
Restart the API to use updated worker code. The worker checks setup once before
each batch; an unavailable setup now produces one actionable error, shown in
Notifications, instead of repeating a claim failure for each due member. It keeps
the hourly retry and automatically resumes after the database repair.

Supabase documents the schema-cache refresh command in its
[PostgREST troubleshooting guide](https://supabase.com/kb/troubleshooting/refresh-postgrest-schema).

## Clear a report category

Run `migrations/004_clear_report_records.sql` after migration 001 to enable the administrator-only **Clear all data** controls. They sit on the right of Attendance, Payment, Renewal, and Maintenance in Reports, and on the main Attendance, Payments, and Maintenance & Repair Log headings. The list-and-X icon clears the entire selected history category, including other pages and search-hidden records, after the administrator types `CLEAR` and confirms. The bin-and-X icon in each Actions column deletes only that record after confirmation. Export a CSV copy from Reports first if you need the history.

The API checks the authenticated administrator role and calls a server-only database function. Each clear is one transactional delete: a database failure rolls it back. Payment clears affect all payments; Renewal clears affect only payments linked to subscriptions after a member's first subscription. Revenue and activity totals refresh after clearing. Member accounts, membership dates, equipment, and reminder receipts are preserved. Active and Expired are membership views, so they do not offer this history-clearing action.

Report clearing is for historical entries. Members use account editing and status changes; equipment inventory keeps its condition, inspection, and repair actions. Notification clearing dismisses calculated alerts for the current administrator instead of deleting their source records. Settings contains configuration and offers no history clearing. Member-facing pages remain read-only for payment and attendance history.

The duplicate Memberships sidebar page was removed. Use **Members → View member → Renew membership**, or the renewal actions in Reports. Membership fields and the shared renewal dialog remain available.

## Member account deletion

Expired memberships remain in the admin/staff pages for review and renewal. Accounts
are not automatically deleted after 15 days; deletion requires administrator
confirmation. Restart the API after updating the code to stop the previous cleanup
worker. No database migration is required for this change.

For manual member account deletion and the current email setup/retry flow, see
[Account deletion and email delivery](../docs/ACCOUNT_AND_EMAIL_FIXES.md).

## Optional face matching prototype

Face enrollment uses face-api.js in the browser to produce a 128-number descriptor; it does not send or retain a camera image. The API encrypts the descriptor with AES-256-GCM before saving it in `face_enrollments`.

1. Run `migrations/002_face_enrollment.sql` after migration 001.
2. Generate a 32-byte key with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and set it as `FACE_ENCRYPTION_KEY` in the API's private `.env`. Back it up securely; changing or losing it makes existing descriptors unusable.
3. Keep `FACE_LOGIN_ENABLED=false` while trying enrollment. In the admin Members table, select **Face setup**, confirm the physical ID check and the member's consent, then capture one face. Set `FACE_LOGIN_ENABLED=true` only when you want enrolled members to need face matching after their password.
4. Member face sign-in can be withdrawn in **Settings**; withdrawing removes the active encrypted template.

This is a prototype, not identity proof: face-api.js does not validate government IDs or detect liveness, so a photo replay may fool the match. The ID checkbox records that staff checked the physical document; it is not an automated ID validation API. Use a dedicated identity-verification provider with liveness and document checks before relying on this for production account security. Camera access needs HTTPS or localhost. The default match threshold is configurable with `FACE_MATCH_THRESHOLD` and needs real-device evaluation before deployment.
