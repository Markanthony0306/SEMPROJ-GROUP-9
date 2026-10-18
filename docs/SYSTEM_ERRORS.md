# FitPulse error review

Reviewed on October 15, 2026. The main cause was an unfinished Git merge:
two versions of the application had been combined without reconciling their
imports, data fields, and API contracts. An API contract is the request and
response format shared by the frontend and backend.

## Errors repaired

| Error and effect | Files changed | Repair |
| --- | --- | --- |
| Git conflict markers made source files invalid. | `server/lib/supabase.js`, `server/routes/scanner.js`, `src/components/MemberQr.jsx`, `src/pages/{Login,Register,ResetPassword,AdminStaffPage,UserPage}.jsx` | Reconciled the conflicting implementations and removed the markers. |
| Server startup and requests failed because of missing imports, a duplicate `plan` declaration, an undefined verification value, and `await` in a synchronous handler. | `server/server.js` | Restored the required helpers and connected authentication, member creation, renewal, payments, and identity routes. |
| Frontend forms and backend routes expected different membership fields and account-creation responses. | Auth/dashboard pages and `server/server.js` | Used the shared membership plans, preserved payment/contact fields, and returned the generated credentials for the one-time credentials screen. |
| Password reset combined incompatible local and Supabase recovery code; the confirmation field was duplicated. | `src/pages/ResetPassword.jsx`, `server/server.js` | Matched local tokens and verified cloud recovery requests to the backend, validated confirmation, and cleaned up pending requests. |
| QR generation and scanning combined obsolete JWT code with stored membership credentials and referenced undefined result values. | `server/routes/scanner.js`, `src/components/MemberQr.jsx`, `src/pages/UserPage.jsx` | Matched the stored QR contract, retained expiry/status checks and duplicate-scan protection, and repaired QR polling/download behavior. |
| Photo routes required a Supabase client that the server did not pass. | `server/routes/avatar.js` | Restored authenticated local photo storage for the documented hybrid architecture while retaining the existing explicit Supabase storage branch. |
| The administrator password script used undefined database, client, and account variables. Three other scripts imported a removed Supabase export. | `scripts/admin-password.mjs`, `scripts/{inspect-auth-users,migrate-json-data,test-supabase}.mjs` | Repaired local/cloud password updates with backups and session invalidation; updated scripts to create their server client after loading configuration. |
| A role value without a token could render a protected shell; remembered sessions in a new tab started at login. | `src/components/ProtectedRoute.jsx`, `src/App.jsx` | Required a token and account ID for protected rendering, and selected the remembered account's dashboard on startup. Server authorization remains mandatory. |
| Installed dependencies did not match the manifests; the build could not find `face-api.js`. | `package.json`, `package-lock.json` | Restored the existing Supabase dependency declaration and matching lock metadata; restored declared packages with user approval. |
| Private migration backups were not ignored, example Supabase settings were duplicated, and the favicon URL returned HTML. | `.gitignore`, `.env.example`, `public/fitpulse-logo.svg` | Ignored private backups, removed duplicate example settings, and supplied the missing icon using the existing brand mark. |
| Corrupt database JSON could be treated as an empty database and later overwrite saved records. | `server/server.js` | Stop with a clear error instead of silently replacing account data. |

## Verification

| Check | Result |
| --- | --- |
| Production build (`npm.cmd run build`) | Passed; bundle-size advisory remains. |
| Local API regression suite (`npm.cmd run test:server`) | 112/112 passed. |
| Supabase account service (`npm.cmd run test:supabase`) | 23/23 passed. |
| Supabase API fixtures (`npm.cmd run test:supabase:api`) | 35/35 passed, including optional face enrollment/login/replay/revocation. |
| Administrator identity service (`npm.cmd run test:identity`) | 56/56 passed. |
| Administrator identity API fixtures (`npm.cmd run test:identity:api`) | 18/18 passed. |
| Vite private-file protection (`node scripts/check-private-files.mjs`) | 11/11 passed. |
| Administrator password script | Eight isolated local/cloud/error fixtures passed. |
| Source syntax | 65 JavaScript/JSX files passed. |
| Git conflict-marker and whitespace scans | Passed. |
| Built page, scripts, styles, and favicon HTTP checks | Passed. |

API tests used temporary records and synthetic provider responses, with external
requests blocked. The real `.env`, saved records, and cloud accounts were not
modified. Test harnesses isolate configuration and verify temporary cleanup paths.
No live migration or production deployment was run.

## Configuration and remaining limits

- The local configuration enables administrator identity verification but does
  not configure `STRIPE_SECRET_KEY` or trusted names in `ADMIN_IDENTITY_NAMES`.
  Administrator sign-in remains blocked until these are set privately. See
  [administrator identity setup](ADMIN_IDENTITY.md). Verification was left enabled.
- `JWT_SECRET` is empty locally. Set a stable random secret privately so sessions
  survive development server restarts; production requires one.
- Live Supabase credentials, SMTP delivery, physical camera capture, and the
  ESP32-CAM hardware were not exercised. Browser automation was unavailable, so
  visual interaction checks remain unverified.
- The production build warns about large JavaScript chunks. This is a performance
  improvement to address separately, not a build failure.
- Operational JSON storage and in-memory locks support a single API process.
  Move membership, attendance, payments, and other operational writes to database
  transactions before scaling across multiple server processes. See
  [the current storage boundary](SUPABASE.md).
- Git's index still records the earlier unresolved merge. Working files are
  repaired, but review and stage the resolved files before completing the merge.
  Existing staged work was preserved; no commit was created.

## How to catch this next time

Run `npm.cmd run build` and the relevant API tests before committing. Search for
`<<<<<<<`, `=======`, and `>>>>>>>` after resolving a merge. Compare both sides'
request/response fields instead of keeping whichever side happens to compile.

Suggested commit after review: `Fix FitPulse merge conflicts and restore account flows`.
