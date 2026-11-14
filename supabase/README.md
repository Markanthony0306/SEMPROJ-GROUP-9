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
the setup from migration 006. Apply [migration 015](migrations/015_audit_member_account_deletion.sql)
for the admin-only deletion transaction and private audit log. Restart the API.
Photo files are removed through Supabase Storage after the database commits.
The API retries any pending photo cleanup while it is running.

## Face sign-in and membership plans

Apply the migrations through 012 in order. Configure a stable server-only
`FACE_ENCRYPTION_KEY` and provision the administrator's ID portrait before face enrollment.
Follow the [face sign-in setup guide](../docs/FACE_SIGN_IN.md) for provisioning,
role-specific sign-in, and the checks to run before rollout.

Migration 009 retires Unlimited Monthly for new memberships. Historical
subscriptions and payments keep their original plan.

## Member ID checks

1. Apply the migrations through [014](migrations/014_member_enrollment.sql) before restarting the updated API. Migration 014 adds the new ID types and allows a fresh enrollment to use the same email as an abandoned draft.
2. Keep the existing server-only `ID_VERIFICATION_KEY` and `FACE_ENCRYPTION_KEY` (each 32 bytes encoded as hex). If the ID key is empty, the API uses the face key for ID files. Keep those keys backed up securely.
3. As an administrator, open **Members → Create Account**. Enter the member details, choose the ID type, and record consent. Hold the front of the ID in the camera guide and flip it when prompted. Check the extracted details against the original ID.
4. Run the normal-distance live face check and move closer when prompted. FitPulse compares the live face to the ID portrait before creating the account. When the member signs in, the API compares the live face to both the enrollment and the stored ID portrait.

FitPulse uses a private [PaddleOCR General OCR service](https://www.paddleocr.ai/main/en/version3.x/inference_deployment/serving/serving.html) for server-side verification. Install PaddlePaddle for your platform, then install PaddleX with the OCR and serving extras in a separate Python environment. Start the General OCR pipeline on the same host for local development:

```powershell
python -m pip install 'paddlex[ocr,serving]'
paddlex --serve --pipeline OCR --host 127.0.0.1 --port 8080 --device cpu
```

Set `ID_PADDLE_OCR_URL` in the API environment to the full private `/ocr` endpoint. The default is `http://127.0.0.1:8080/ocr`. For deployments on separate hosts, use a private network and keep the endpoint inaccessible from the public internet. The API sends an ID image to this service, so keep request bodies out of logs. Browser OCR fills the review fields, and the API checks the images independently before saving the ID proof. Inspect the original document in person to check its authenticity.

The browser downloads the two PP-OCRv5 model archives on first use and reads the captures locally. To serve the models with FitPulse, host `PP-OCRv5_mobile_det_onnx_infer.tar` and `PP-OCRv5_mobile_rec_onnx_infer.tar` in a public directory and set `VITE_ID_OCR_MODEL_DIRECTORY` to its URL before building the frontend.

For an existing member whose enrollment predates encrypted ID storage, recover the ID from a trusted operator terminal with the private server key. Check the original ID and get the member's consent first. Keep the input files outside Git.

```powershell
node scripts/recover-member-id.mjs admin@fitpulse.com member@example.com drivers_license 'C:\private\front.jpg' 'C:\private\back.jpg'
```

Pass one PDF, DOC, or DOCX path for a combined document. The command updates the existing member's proof. If the member also needs a face enrollment, use **Members → View → Face setup** with the member present. See [Strict face sign-in](../docs/FACE_SIGN_IN.md) for administrator setup.

## Webcam QR check-in

In **Attendance**, use **Scan QR with webcam**. The browser must support QR detection through the Barcode Detection API. The authenticated API verifies the same membership QR and uses the same check-in storage as the ESP32-CAM. A member or unauthenticated caller cannot use the staff scanner route.
