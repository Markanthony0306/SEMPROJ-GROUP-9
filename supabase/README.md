# Supabase setup

1. Run `migrations/001_fitpulse_database.sql` in the SQL Editor. It extends the existing `users` and `roles` tables and uses the existing membership, payment, and attendance tables.
2. Run `migrations/008_reusable_qr_token.sql` after migration 001. Reusable unexpired member QR tokens are allowed; request IDs prevent duplicate scans.
3. Copy the project settings into `.env`: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, the server-only `SUPABASE_SECRET_KEY`, and a stable random `JWT_SECRET`.
4. Run `npm install`, then start the API with `npm run server` and the web app with `npm run dev`.

The API stores profiles in `users`, memberships in `subscriptions`, attendance in `attendance_logs`, payments through `payments.subscription_id`, equipment and repair history in their Supabase tables, and photos in Supabase Storage.

Equipment categories use the list in `shared/equipmentCategories.js`. The Add Equipment form and Equipment Monitoring dropdown use the same values; older categories remain visible until edited.

To import records from an older `server/data.json`, run `npm run migrate:json-data` after configuring `.env`. The importer links accounts to existing Supabase Auth users by email, copies related records and local photos, and does not import password hashes. Keep the source file private until you verify the imported records.

## In-app notifications

Apply `migrations/005_admin_notifications.sql` after migration 001 to enable private notification dismissals. Set the expiry window in **Settings → Gym Preferences**.

FitPulse hands the one-time password to the administrator when a member is created. **Forgot password** uses Supabase Auth recovery and requires the frontend reset URL in the project's redirect allow list.

Migration 009 retires Unlimited Monthly for new memberships. Historical subscriptions and payments keep their original plan.

Apply `migrations/026_configure_gcash_payment_method.sql` if GCash is missing from `payment_methods`. The migration adds it once and leaves an existing case-insensitive match intact.

## Clear a report category

Run `migrations/004_clear_report_records.sql` after migration 001 to enable the administrator-only **Clear all data** controls. These controls clear the selected report history after the administrator types `CLEAR` and confirms. Export a CSV copy first if you need the history.

Each clear is transactional. Payment clears affect all payments; Renewal clears affect payments linked to subscriptions after a member's first subscription. Member accounts, membership dates, equipment, and reminder receipts are preserved.

## Permanent member account deletion

Migrations 001 and 006 provide the Auth-to-profile cascade, linked-record cleanup, and a private readiness check. Migration 024 extends this cleanup to legacy accounts whose role is named `user`. Account deletion removes the member's payments, subscriptions, attendance, notifications, and QR credentials while retaining unrelated payment and maintenance history.

## Existing schema cleanup

Apply `migrations/025_remove_identity_verification.sql` after the existing migrations to remove the retired face and ID verification schema. It permanently deletes stored face templates, ID captures, and verification review history. This migration does not change member profiles, login, memberships, payments, or check-ins.

## Webcam QR check-in

In **Attendance**, use **Scan QR with webcam**. The browser needs QR support through the Barcode Detection API. The authenticated API verifies the membership QR and records the check-in. Members and unauthenticated callers cannot use the staff scanner route.
