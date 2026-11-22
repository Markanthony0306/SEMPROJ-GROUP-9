---
type: "query"
date: "2026-10-23T06:28:10.999481+00:00"
question: "test all the emails"
contributor: "graphify"
outcome: "useful"
source_nodes: ["welcomeEmail()", "expiryEmail()", "recoveryEmail()", "smtpConfigured"]
---

# Q: test all the emails

## Answer

Expanded from original query via graph vocabulary: [email, smtp, welcome, recovery, expiry, reminder, templates]. Graph sources: welcomeEmail() server/services/emailTemplates.js L61, expiryEmail() L83, recoveryEmail() L108. Inspected current templates and all callers. Added explicit --send-all-tests to scripts/check-email.mjs. Sent exactly five labeled live samples to the previously confirmed SMTP_USER inbox: welcome credentials, password reset, resent sign-in link, upcoming expiry, expired membership. All five were accepted by SMTP and the user confirmed all five arrived in Inbox. Samples used dummy credentials and example URLs; no real account or membership changed. Added expired MIME coverage and corrected a stale recovery test double that returned no acceptance receipt; production assertEmailAccepted remains strict. All 58 isolated tests pass across email-delivery, account-deletion, login-reset, membership-reminders and report-experience suites. Read-only live checks still return 404 PGRST205 for membership_reminders and admin_notification_dismissals; legacy email_notifications is enabled. Automatic reminders remain blocked pending migration 005. Documented results and repeat command in docs/ACCOUNT_AND_EMAIL_FIXES.md.

## Outcome

- Signal: useful

## Source Nodes

- welcomeEmail()
- expiryEmail()
- recoveryEmail()
- smtpConfigured