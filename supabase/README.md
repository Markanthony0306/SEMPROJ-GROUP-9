# Supabase setup

1. Open your Supabase project and run `migrations/001_fitpulse_database.sql` in the SQL Editor. This migration extends the existing `users` and `roles` tables and uses the existing `subscriptions`, `membership_plans`, `payment_methods`, `payments`, and `attendance_logs` tables.
2. In the project root, copy `.env.example` to `.env` and set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, the server-only `SUPABASE_SECRET_KEY`, and a random `JWT_SECRET`. Keep `JWT_SECRET` unchanged between API restarts so existing sessions and member QR codes remain valid.
3. Run `npm install`, then start the API with `npm run server` and the web app with `npm run dev`.

The API reads and writes member profiles in `users`, membership periods in `subscriptions`, attendance in `attendance_logs`, and payment records through `payments.subscription_id`. Plan names and payment method IDs come from `membership_plans` and `payment_methods`. Equipment, maintenance history, gym settings, and profile photos are also stored in Supabase. The running app does not read or write `data.json` or local avatar files.

If you need to keep data from an older `server/data.json`, run `npm run migrate:json-data` once after applying the SQL migration and configuring `.env`. The importer links account records to existing Supabase Auth users by email, copies related records and local photos, and does not import password hashes. Keep the old file private until you have confirmed the imported records.

The `migrate:demo-auth` command is an older one-time helper for provisioning the two demo logins. New development demo accounts are provisioned directly in Supabase when the API starts.

## Optional face matching prototype

Face enrollment uses face-api.js in the browser to produce a 128-number descriptor; it does not send or retain a camera image. The API encrypts the descriptor with AES-256-GCM before saving it in `face_enrollments`.

1. Run `migrations/002_face_enrollment.sql` after migration 001.
2. Generate a 32-byte key with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and set it as `FACE_ENCRYPTION_KEY` in the API's private `.env`. Back it up securely; changing or losing it makes existing descriptors unusable.
3. Keep `FACE_LOGIN_ENABLED=false` while trying enrollment. In the admin Members table, select **Face setup**, confirm the physical ID check and the member's consent, then capture one face. Set `FACE_LOGIN_ENABLED=true` only when you want enrolled members to need face matching after their password.
4. Member face sign-in can be withdrawn in **Settings**; withdrawing removes the active encrypted template.

This is a prototype, not identity proof: face-api.js does not validate government IDs or detect liveness, so a photo replay may fool the match. The ID checkbox records that staff checked the physical document; it is not an automated ID validation API. Use a dedicated identity-verification provider with liveness and document checks before relying on this for production account security. Camera access needs HTTPS or localhost. The default match threshold is configurable with `FACE_MATCH_THRESHOLD` and needs real-device evaluation before deployment.
