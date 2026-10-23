# Account deletion and email delivery

## Enable the database changes

Apply `supabase/migrations/005_admin_notifications.sql` to enable the automatic
reminder tables and delivery tracking if it has not been run yet. Then apply
`supabase/migrations/006_delete_member_accounts.sql` in the Supabase SQL Editor.
Migration 006 requires migration 001's Auth-to-profile cascade. These migrations
must be applied before testing live reminders and account deletion.

Migration 006 adds a private readiness check and a trigger (a function PostgreSQL
runs when a profile is deleted). Supabase Auth deletes the login and cascades to
the linked profile. The trigger removes that member's payments, subscriptions,
attendance, saved face template, legacy notifications, and QR credentials in the
same transaction. A database error rolls back those database changes. Existing
row-level security stays enabled; browser clients cannot call the readiness check.

No existing member is deleted by applying the migration. Do not test deletion on
a real member. Use a dedicated test account and verify that its login, QR pass,
and old session no longer work afterward.

## Use account deletion

- Members: **Settings → Delete my account**.
- Administrators: **Members → Delete account** in a member's Actions column.
- Both require the signed-in person's current password and typing `DELETE`.
- Staff cannot delete accounts. Administrator and staff accounts cannot be
  deleted through these member controls.

The frontend sends the confirmation to Express. The API rechecks the role,
verifies the current password with Supabase Auth, checks the linked account and
database setup, removes the private avatar folder, and calls the server-only Auth
Admin API. Secret keys and temporary passwords are never returned to the browser.
Old FitPulse sessions and downloaded QR passes fail because the API checks whether
the account still exists on every authenticated request.

Storage and Auth cannot share a database transaction. Photos are removed first
because owned Storage objects can prevent Auth deletion. If Auth deletion fails
after that step, the login and database records remain, but photos may need to be
uploaded again. The API reports failure and allows a retry.

Deleting a member removes their payment and attendance history, so the gym's
totals change. Export any records the gym needs to retain before confirming.
A larger production system should define a retention policy and use a durable
job for coordinating Storage cleanup and Auth deletion.

## Email behavior

The API and the SMTP diagnostic use the same sender, port, TLS (encrypted network
connection), and timeout settings. Port 465 uses `SMTP_SECURE=true`; port 587 uses
`false`. Set `SMTP_FROM` to a real address authorized by the provider. When empty,
it uses the `SMTP_USER` email address. A `.local` sender is rejected.

The API saves a new member and membership before sending the welcome email.
An SMTP outage preserves the account and returns `emailSent: false` with an
actionable message. Admin and staff can use **Members → Send sign-in link** to
send a new, one-use Supabase password setup link without viewing the password.
Rejected recipients are treated as failures, including on password recovery.
Membership reminders keep their existing persisted retry and duplicate protection.

Restart the API after changing its code or private `.env`. Keep it running for
automatic reminders, and enable **Settings → Send automatic email reminders**.
**Notifications → Check SMTP** checks the connection without emailing anyone.

```powershell
npm.cmd run check:email
npm.cmd run check:reminders
npm.cmd run test:accounts
node --test scripts/test-login-reset.mjs scripts/test-membership-reminders.mjs
node scripts/test-ui-render.mjs
npm.cmd run build
```

The default SMTP diagnostic sends no message. To explicitly send one test to the
configured `SMTP_USER` inbox, run `npm.cmd run check:email -- --send-test` and check
Inbox and Spam. SMTP acceptance proves that the provider accepted a message;
inbox delivery still needs recipient confirmation or provider delivery logs.
Tests use isolated accounts and generate email locally; they send no real email.

Verified on October 23, 2026: SMTP authenticated successfully, and the user
confirmed that the single approved test email reached Inbox. The production build,
46 isolated tests, and component render checks passed. Read-only checks found
the two reminder tables missing (`404 PGRST205`). No live SQL migrations or account
deletions were executed during this verification.

### All-email test results — October 23, 2026

Sent five clearly labeled samples using the real email templates, logo attachment,
and shared SMTP configuration. The user confirmed that all five arrived in Inbox:

| Test | Email flow | Result |
| --- | --- | --- |
| 1/5 | Welcome and temporary credentials | Inbox confirmed |
| 2/5 | Password reset | Inbox confirmed |
| 3/5 | Resent sign-in link | Inbox confirmed |
| 4/5 | Upcoming membership expiry | Inbox confirmed |
| 5/5 | Expired membership | Inbox confirmed |

The samples use dummy credentials and example links. Actual one-use recovery,
sign-in-link retries, scheduling, duplicate protection, and delivery failure paths
passed in the isolated integration tests. All 58 checks passed across the email,
account, login/reset, membership reminder, and report test suites. One older
recovery test double was corrected to return an SMTP acceptance receipt; the
production acceptance check remains strict. Expired-template MIME coverage was
also added.

The live reminder tables are still missing, and the legacy `email_notifications`
preference is enabled. Apply migration 005 before relying on automatic reminders;
these successful direct template sends do not verify the live scheduled worker.
No real account, password, payment, membership, or reminder receipt was changed.

To deliberately send another set of five samples to the configured `SMTP_USER`
inbox, run:

```powershell
npm.cmd run check:email -- --send-all-tests
```

Running `npm.cmd run check:email` without either send flag sends no email.

### Reminder claim failure diagnosis

The reported three-subscription failure was traced to the live database missing
`membership_reminders`, `admin_notification_dismissals`,
`gym_settings.email_enabled`, and `claim_membership_reminder`. The new
`npm.cmd run check:reminders` diagnostic reproduced the missing-table error
(`PGRST205`) without sending email or changing member records.

`server/services/membershipReminders.js` now validates the tracking schema and
claim function once per batch. A shared setup failure stops that batch with one
specific diagnostic, clears misleading counts, and is visible in Notifications.
The next check retries setup. SMTP delivery failures still retry per member, and
the existing duplicate-email protection remains in place.

The migration now requests an API schema refresh after committing the repair.
The no-email diagnostic is the final live check after migration 005 is applied;
local code changes alone cannot create the missing Supabase objects. The expanded
isolated test run passed 60 checks, including schema failures, permission errors,
one error for three due members, and recovery after the missing setup is fixed.

Suggested commit: `fix: validate reminder database setup before sending batches`.

## Verification layout

The active member face-verification step uses a centered, single-column form.
The FitPulse branding panel is shown only during password login. The older Stripe
ID component has no branding panel of its own and is currently disconnected from
the login flow; these changes do not reconnect it or change authentication checks.

Suggested commit: `fix: add member account deletion and recoverable email delivery`.

Provider references: [Supabase Auth account deletion](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser)
and [Nodemailer SMTP verification](https://nodemailer.com/smtp#verifying-the-connection).
