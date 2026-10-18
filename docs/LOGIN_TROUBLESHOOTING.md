# Login and password-reset regression fix

## Confirmed problems

The old login handler returned HTTP 401, “Invalid email or password,” for every
Supabase Auth error. That included invalid API keys, service outages, rate limits,
unconfirmed emails, and malformed provider responses. The login page then
replaced every 401 message with a hard-coded password error. A password reset
cannot repair those service/configuration failures.

The old role allowlist also omitted `staff`, despite the application supporting
staff accounts. The new handler accepts the existing admin, member, and staff
roles after validating the linked application profile.

## Changes

- `server/services/passwordAuthentication.js` maps provider error codes into
  application errors. Only `invalid_credentials` becomes `INVALID_CREDENTIALS`
  (401). Rate limits return 429; unavailable authentication returns 503; email
  confirmation and blocked-account errors return 403. Raw provider messages,
  passwords, keys, and tokens are not sent to the browser or diagnostic logs.
- `server/routes/passwordLogin.js` contains the real login handler. Profile
  binding, account status, role validation, and optional face challenges remain
  mandatory; no failed password falls back to a local or default password.
- `server/lib/authClient.js` creates a fresh publishable-key Auth client for each
  login, recovery, and current-password request. Disabling persistence alone does
  not prevent a shared SDK client from retaining an in-memory session.
- `src/pages/Login.jsx` submits the actual named form input values. This also
  handles autofill/password managers that update inputs before React state
  catches up. Passwords are preserved exactly; only the email is normalized.
  The remembered email comes from the authenticated account response.
- `src/utils/api.js` preserves the API error code. The login page displays the
  server's useful message instead of replacing every 401 with a password claim.
- `server/server.js` wires the handler and per-request clients into the existing
  routes. Exporting `serverReady` lets regression tests await and close their
  isolated API instance cleanly.

## What was checked

A read-only inspection found valid Auth/profile links, active statuses, confirmed
emails, and supported roles for the affected account and all 10 existing
accounts. Both configured Supabase keys were accepted. No real password was
changed during the investigation, and the other accounts' unknown passwords
were not used or guessed. Structural account checks do not prove that a specific
password will authenticate. After the API restart, the affected user confirmed
that retrying with their reset password opens the dashboard or face-verification
flow successfully.

The running development API was restarted, and a nonexistent diagnostic account
correctly returned `401 / INVALID_CREDENTIALS` from the new handler.

## Regression tests

```powershell
node scripts/test-login-reset.mjs
node --test scripts/test-report-experience.mjs
node scripts/test-ui-render.mjs
npm.cmd run build
```

The login regression suite runs the actual Express API and Supabase SDK against
an isolated HTTP fixture. It blocks real `.env` reads, external requests, and
email delivery. It verifies:

1. Separate admin, member, staff, and additional member logins.
2. Rejection of incorrect passwords.
3. Distinct errors for provider outages, invalid keys, and rate limits.
4. Actionable email-confirmation errors.
5. Email recovery → link verification → password change → new-password login.
6. Rejection of the old password and invalidation of older app sessions.
7. Settings password changes and concurrent sign-ins.
8. Face-enrolled members receiving a challenge before any application token.

## How to diagnose a repeat

In browser developer tools, open **Network**, submit the login form once, and
inspect `POST /api/auth/login`. Its response code distinguishes invalid
credentials from a service or profile problem. Do not share the request body,
password, access token, recovery link, or private keys.

For a genuine `INVALID_CREDENTIALS` response, enter the newest password manually
and check whether the password manager is filling an older value. A successful
email reset must update **Supabase Auth**, rather than a password-looking field
in `public.users` or the legacy JSON data. Do not change another account's
password simply to test it.

Suggested commit: `fix: isolate auth requests and preserve login error causes`
