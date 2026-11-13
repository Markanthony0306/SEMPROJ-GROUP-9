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
confirmation. Apply [migration 013](migrations/013_member_id_account_deletion.sql)
after migration 011 to install the deletion checks and cleanup triggers, including
the setup from migration 006. Migration 013 also refreshes the Supabase Data API
schema cache. Restart the API to load the updated deletion check.

## Face sign-in and membership plans

Apply the migrations through 012 in order. Configure a stable server-only
`FACE_ENCRYPTION_KEY` and provision the administrator's ID portrait before face enrollment.
Follow the [face sign-in setup guide](../docs/FACE_SIGN_IN.md) for provisioning,
role-specific sign-in, and the checks to run before rollout.

Migration 009 retires Unlimited Monthly for new memberships. Historical
subscriptions and payments keep their original plan.

## Member ID checks

1. Apply `010_member_id_verification.sql` and `011_member_id_proof.sql` before restarting the updated API. Migration 011 adds private encrypted ID file rows, email rejection counts, and staged face enrollment. Profile creation and enrollment commit in one database transaction.
2. Keep the existing server-only `ID_VERIFICATION_KEY` and `FACE_ENCRYPTION_KEY` (each 32 bytes encoded as hex). If the ID key is empty, the API uses the face key for ID files. Keep those keys backed up securely.
3. Open **Members → Create Account**. Enter the member details, record consent, and upload both ID sides on step 1. Capture the member's face on step 2. FitPulse checks the files and captures a face template at creation. When the member signs in, the API compares the live face to the enrollment and the stored ID portrait.
4. Use **Members → ID Reviews** to make manual decisions. The fifth rejection blocks creation and resubmission for that email. An admin can reset the count by email. Deleting a review also deletes the stored ID files. For an existing member, deletion ends their current session and requires a replacement ID before they can sign in again.

Images require a separate JPG or PNG per side. A PDF can place the front and back on the first two pages or separate the images with a clear white gap on one page. The API runs Poppler's `pdftoppm` from its PATH for PDF files. Set `ID_PDF_RENDERER` to an absolute executable path if needed. For DOCX or Word 97–2003 DOC, insert the JPG or PNG scans in front-to-back order as embedded images. Keep each file at or below 5 MB. A readable upload and face match establish likeness. Authenticity requires inspecting the original ID.

Old reviews from migration 010 do not have stored images. Recover an existing member's ID from a trusted operator terminal with the private server key, after checking the original ID and getting the member's consent. Keep the input files outside Git.

```powershell
node scripts/recover-member-id.mjs admin@fitpulse.com member@example.com drivers_license 'C:\private\front.jpg' 'C:\private\back.jpg'
```

Pass one PDF, DOC, or DOCX path for a combined document. The command updates the existing member's proof. If the member also needs a face enrollment, use **Members → View → Face setup** with the member present. See [Strict face sign-in](../docs/FACE_SIGN_IN.md) for administrator setup.

## Webcam QR check-in

In **Attendance**, use **Scan QR with webcam**. The browser must support QR detection through the Barcode Detection API. The authenticated API verifies the same membership QR and uses the same check-in storage as the ESP32-CAM. A member or unauthenticated caller cannot use the staff scanner route.
