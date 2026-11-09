# Supabase setup

1. Open your Supabase project and run `migrations/001_fitpulse_database.sql` in the SQL Editor. This migration extends the existing `users` and `roles` tables and uses the existing `subscriptions`, `membership_plans`, `payment_methods`, `payments`, and `attendance_logs` tables.
2. Run `migrations/008_reusable_qr_token.sql` in the SQL Editor after migration 001. This allows the same unexpired member QR token to be used again; request IDs still prevent a scan retry from creating duplicate attendance.
3. In the project root, copy `.env.example` to `.env` and set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, the server-only `SUPABASE_SECRET_KEY`, and a random `JWT_SECRET`. Keep `JWT_SECRET` unchanged between API restarts so existing sessions and member QR codes remain valid.
4. Run `npm install`, then start the API with `npm run server` and the web app with `npm run dev`.

The API reads and writes member profiles in `users`, membership periods in `subscriptions`, attendance in `attendance_logs`, and payment records through `payments.subscription_id`. Plan names and payment method IDs come from `membership_plans` and `payment_methods`. Equipment, maintenance history, gym settings, and profile photos are also stored in Supabase. The running app does not read or write `data.json` or local avatar files.

Equipment categories use the eight gym areas defined in `shared/equipmentCategories.js`. The Add Equipment form and Equipment Monitoring category dropdown share this list, and the API validates category selections before saving to `gym_equipment.category`. Older category names remain visible until staff select a new area; no database migration is needed for this change.

If you need to keep data from an older `server/data.json`, run `npm run migrate:json-data` once after applying the SQL migration and configuring `.env`. The importer links account records to existing Supabase Auth users by email, copies related records and local photos, and does not import password hashes. Keep the old file private until you have confirmed the imported records.

The `migrate:demo-auth` command is an older one-time helper for provisioning the two demo logins. New development demo accounts are provisioned directly in Supabase when the API starts.

## In-app notifications

Apply `migrations/005_admin_notifications.sql` after migration 001 to enable private notification dismissals. Staff can view membership and equipment alerts. Administrators can also dismiss alerts individually or by group. Set the expiry window in **Settings → Gym Preferences**.

FitPulse no longer sends welcome or expiry emails. Staff hand off the one-time password shown at member creation. **Forgot password** still uses Supabase Auth recovery and requires the frontend reset URL in the project's redirect allow list.

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

## Face verification and membership plan retirement

1. Apply `migrations/002_face_enrollment.sql` and then `migrations/009_face_enrollment_and_plan_retirement.sql`. Migration 009 serializes enrollment updates and retires Unlimited Monthly for new memberships. Historical subscriptions and payments retain their original plan.
2. Set `FACE_LOGIN_ENABLED=true` and configure a stable 32-byte hex `FACE_ENCRYPTION_KEY` in the API environment. Keep the key used for any existing enrollments.
3. For members, open **Members → View → Face setup**. Confirm consent and check their photo ID. Staff can enroll their own face in **Settings → Face verification** using their current password.
4. Sign out and sign back in. The API checks three camera frames against a single-use movement prompt and compares the face against enrolled accounts. It stores only an encrypted template, never the frames. Resolve any old duplicate enrollments before expecting those accounts to pass face sign-in.

Use HTTPS or localhost for camera access. Try the live prompt on your target cameras and test both printed and screen-displayed photos. This gesture check is a prototype and can be fooled by replayed or synthetic camera frames. Use independently evaluated presentation attack detection before relying on it for production authentication.

## Webcam QR check-in

In **Attendance**, use **Scan QR with webcam**. The browser must support QR detection through the Barcode Detection API. The authenticated API verifies the same membership QR and uses the same check-in storage as the ESP32-CAM. A member or unauthenticated caller cannot use the staff scanner route.
