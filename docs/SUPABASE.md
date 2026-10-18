# Supabase setup

FitPulse has `@supabase/supabase-js` installed and a server client factory in
`server/lib/supabase.js`. The local `.env` holds the existing SEMPROJ project's
Supabase settings. `.env` is ignored by Git and blocked by the Vite development server.

Run `npm run check:supabase` from this project to check Supabase Auth admin access
and read access to the existing `roles` table. The command does not change remote
accounts or records and does not print keys or account details. It requires Node
22 or later, as required by the installed Supabase package; this machine uses Node 24.
The package runtime requirement and GitHub Pages build both specify Node 22 or later.

The server client reads `SUPABASE_URL` and `SUPABASE_SECRET_KEY` after the environment
has loaded. Session persistence and refresh are disabled. Sign-in can still change
the client's session in memory, so keep this administrator client separate from
member sign-in operations. Sign-in and recovery use a fresh publishable-key client
for every request; the administrator client never signs in as a member.

Secret keys bypass Row Level Security (RLS), the database rules that control which
rows a user can access. Keep the secret in server code and never in a `VITE_*`
variable or Git. The API must still enforce admin, staff, and member permissions.
Future direct browser access requires a publishable key and appropriate RLS policies.

## Account integration

Administrator login now also requires a Stripe Identity ID/selfie verification.
Supabase continues to validate the password; FitPulse issues its administrator
session only after confirming Stripe's result. Set the server-only Stripe key and
trusted legal names as described in [Admin identity setup](ADMIN_IDENTITY.md).

`ACCOUNT_PROVIDER=supabase` enables Supabase Auth and cloud profile/role reads and
writes. `ACCOUNT_PROVIDER=local` retains the local account provider for isolated
development and tests. Run `npm run migrate:supabase` to see the migration summary;
add `-- --apply` to import missing identities with their existing bcrypt hashes.
Every saved migration keeps a private database backup.

Account UUIDs remain the keys for attendance, payments, photos, and membership QR.
The shorter `memberCode` is a display/search code, not an authentication credential.
Cloud Auth and profile IDs are mapped separately, so an existing cloud profile
with a different UUID never changes historical record ownership.

Existing cloud identities are not overwritten merely because their email matches.
They remain pending until the owner verifies both accounts. Pending legacy users
can keep their current FitPulse login; their Profile page provides a cloud-account
link form. Linking explicitly chooses the existing cloud password for future
sign-in and leaves the remote password unchanged. Once linked, failed cloud login
never falls back to a local hash. Unrelated cloud accounts and retired demo accounts
cannot sign in without a real local account mapping.

New members receive a cloud login, linked profile, unique display code, automatic
membership QR, and a temporary password shown once to the administrator. The API
enforces the first-password-change flag. Welcome emails are optional when SMTP is
configured; email failure does not delete a successfully created member.

Profile updates synchronize cloud Auth email and the profile email. Password changes
clear the forced-change flag and invalidate older FitPulse sessions. Recovery uses
one-use Supabase recovery hashes, or a verified recovery session whose ID is consumed
to prevent refreshed-token replay. Ordinary login tokens cannot reset passwords.
When using Supabase's built-in recovery email delivery, add the frontend reset URL
(for example `http://localhost:5173/reset-password`) to the project's Auth redirect
allowlist. FitPulse does not use the reference's incomplete PKCE code exchange.

Membership dates/QR, attendance, payment ledgers, equipment, settings, and photos
remain in local storage during this account migration. Weekly costs ₱200 and lasts
exactly 7 days; all expiry timestamps use elapsed plan days and display Asia/Manila.
An active cloud identity never reactivates an inactive local membership.

Run `npm run test:server`, `npm run test:supabase`, and `npm run test:supabase:api`
for isolated local, provider service, and API integration checks. The API integration
check runs the real Supabase client against a simulated project. These tests do not
contact the team's cloud database or send emails. `npm run check:email` checks SMTP
connection and authentication without sending a message.
The hybrid storage is intended for one API process. Production deployment should
move remaining records to transactional database operations; cloud Auth, profile
writes, and JSON commits cannot be one atomic transaction. Supabase Storage for
photos remains a separate integration.

References: [JavaScript client initialization](https://supabase.com/docs/reference/javascript/initializing)
and [API key security](https://supabase.com/docs/guides/getting-started/api-keys).
