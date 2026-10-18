# Administrator identity verification

FitPulse uses Stripe Identity's hosted document and selfie flow before issuing an
administrator session. The `stripe` Node.js SDK is installed in this project.
ID images and selfies go directly to Stripe; FitPulse does not receive an upload
or keep copies of those images. No face-api.js repository or browser face matcher
is required for this integration.
The originally requested repository was downloaded to `vendor/face-api.js` for
reference and is ignored by Git; its packages are not part of the login runtime.

## Setup

1. Enable Identity in your [Stripe Dashboard](https://dashboard.stripe.com/identity/application).
   Confirm your business can activate Identity before planning a live rollout.
   Stripe's current [business eligibility list](https://docs.stripe.com/identity/use-cases)
   does not include a Philippines business location. Supported countries for the
   **business** and supported countries for an administrator's **ID document** are
   separate questions. A local test integration does not establish live eligibility.
2. Set the following in the local, Git-ignored `.env`, or your server deployment's
   private environment settings. Never paste real keys into a chat or commit them.

   ```dotenv
   ADMIN_IDENTITY_VERIFICATION=true
   STRIPE_SECRET_KEY=your_private_Stripe_secret_key
   ADMIN_IDENTITY_NAMES={"admin@fitpulse.com":{"first_name":"Legal given names","last_name":"Legal surname"}}
   CLIENT_URL=http://localhost:5173
   ```

   Use a sandbox/test secret key during development. Production requires a live
   secret key and `NODE_ENV=production`. This feature defaults to enabled. Missing
   Stripe credentials or the administrator's expected legal name blocks admin
   sign-in. An explicit `ADMIN_IDENTITY_VERIFICATION=false` is allowed only outside
   production for isolated legacy tests; it removes the extra check.

3. Replace the example name with the administrator's legal given name(s) and
   surname as Stripe extracts them from the ID. Add entries for each admin email.
   These are trusted server settings: an admin cannot set the expected match by
   editing their display name or entering a name in the login form. Name matching
   normalizes case, spacing, and Unicode; substantial differences fail closed
   (access stays blocked). Review a legitimate mismatch before changing this list.
   FitPulse matches only legal first/last names because it has no trusted stored
   date of birth or ID number to compare. It does not claim to match every field
   on the ID against an account record.
4. Set `CLIENT_URL` to the real frontend root, including a deployment subdirectory
   if used, such as `https://example.com/fitpulse`. Stripe returns to that root with
   `?identity=return`. Production must use HTTPS. Set `CORS_ORIGINS` to the browser
   origin and `VITE_API_URL` to the API URL; the frontend never needs the Stripe
   secret key or a `VITE_STRIPE_SECRET_KEY`.
5. Restart `npm run server` after environment changes, and run `npm run dev` for
   the frontend. Use Stripe's sandbox scenarios to test success, failure, and
   processing; sandbox verification does not prove a real person's identity.

## Login flow

1. The admin submits their existing email and password. The API validates the
   account and password, then creates a short-lived identity challenge instead
   of a FitPulse access token. Staff and member login retain their existing flow.
2. The browser offers to open Stripe's verification page. The admin photographs
   their ID using the camera, which uploads it to Stripe, then captures a selfie.
   The server requires live capture and a matching selfie, so selecting an old
   saved ID image is not supported. Stripe performs the verification checks.
3. On return, the browser sends its challenge token to
   `POST /api/auth/admin-identity/complete`. Returning from Stripe alone grants
   nothing. The API retrieves the session using the private Stripe SDK, checks
   the account/session binding and expected legal name, and grants a session only
   for a verified result. Processing or another required upload grants no access.
4. A verified challenge can be consumed once. It expires after 20 minutes; password
   or account changes invalidate it. The challenge is not a protected-resource
   credential. Legacy admin access tokens without verification are also blocked.
   Each subsequent admin login requires a new verification.

The browser keeps the pending challenge in its tab's session storage so it can
resume after Stripe redirects back. Closing the tab or clearing browser storage
loses it; sign in again. Do not log challenge tokens or hosted verification URLs.

## Verification and operation

Run the isolated API integration checks:

```powershell
node scripts/smoke-admin-identity.mjs
```

The test imports the real Express server and Stripe service, replaces only the
Stripe resource methods with synthetic responses, and uses a new temporary data
file. It does not read the real `.env`, contact Stripe/Supabase, or send emails.
Use the existing server and Supabase regression scripts for the unaffected flows.

This implementation retrieves Stripe's authoritative result when the browser
checks completion; it does not accept a browser-provided `verified` flag or use
webhooks to grant login access. If the browser leaves, no login is issued. Consider
signed Stripe webhooks later for background audit/retention workflows.

The remaining JSON storage and account locks support one API process. Move
challenge consumption and sessions into database transactions before running
multiple API processes, serverless instances, or replicas. RLS (Row Level
Security, database rules controlling which records a caller can read/write)
should deny browser access to challenge records when moving them to Supabase.
This gate protects FitPulse API sessions. Direct Supabase Auth or database access
does not automatically inherit Stripe verification; keep it behind the API until
the database policies also enforce the intended access requirements.

Keep a documented retention/deletion policy for verification data held by Stripe
and restrict Dashboard access. Stripe supports redacting verification sessions;
this integration does not automatically redact them. Identity proofing is also
different from a reusable second factor: consider passkeys or TOTP for routine
admin sign-in after an approved one-time identity enrollment.

References: [Hosted redirect integration](https://docs.stripe.com/identity/verify-identity-documents?platform=web&type=redirect),
[verification checks](https://docs.stripe.com/identity/verification-checks),
[session lifecycle and redaction](https://docs.stripe.com/identity/verification-sessions),
and [Stripe API key safety](https://docs.stripe.com/keys-best-practices).
