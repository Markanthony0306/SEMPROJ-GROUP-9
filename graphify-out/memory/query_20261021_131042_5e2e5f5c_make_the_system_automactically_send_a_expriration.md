---
type: "query"
date: "2026-10-21T13:10:42.859735+00:00"
question: "make the system automactically send a expriration reminder to the member; check the admin page and remove the redundant button on the admin page"
contributor: "graphify"
outcome: "useful"
source_nodes: ["expiryEmail()", "reminderMembers()", "AdminStaffPage()", "loadDatabase()"]
---

# Q: make the system automactically send a expriration reminder to the member; check the admin page and remove the redundant button on the admin page

## Answer

Expanded from original query via graph vocabulary: membership expiry reminder email admin settings database send. The graph located expiryEmail() at server/services/emailTemplates.js source_location L83, reminderMembers() at src/utils/membership.js L19, and AdminStaffPage.jsx. Live file inspection confirmed reminders were only sent by the protected manual expiry-email endpoint. Added a server-side startup and hourly worker, private Supabase reminder claims and receipts in migration 003, and reused the existing email template and reminder-days preference. Removed per-member Send email buttons and clarified automatic delivery in Notifications and Gym Preferences. Thirteen isolated reminder tests, nine existing login tests, existing UI rendering checks, and production build passed. Read-only live schema inspection confirmed compatible timestamp and text columns but migration 003 has not been applied. SMTP credentials are configured. No real messages were sent; no browser or SQL-management session is available to apply the migration. Activate by applying migration 003 and restarting the persistent API. Tests simulate Supabase storage; PostgreSQL migration execution and real inbox delivery remain unverified.

## Outcome

- Signal: useful

## Source Nodes

- expiryEmail()
- reminderMembers()
- AdminStaffPage()
- loadDatabase()