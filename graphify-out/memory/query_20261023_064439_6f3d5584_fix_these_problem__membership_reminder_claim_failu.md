---
type: "query"
date: "2026-10-23T06:44:39.433914+00:00"
question: "Fix these problem: membership reminder claim failures; 0 sent, 3 failed; apply migration 005_admin_notifications.sql and check Supabase"
contributor: "graphify"
outcome: "useful"
source_nodes: ["server.js", "smtpConfigured", "expiryEmail()"]
---

# Q: Fix these problem: membership reminder claim failures; 0 sent, 3 failed; apply migration 005_admin_notifications.sql and check Supabase

## Answer

Expanded from original request via graph vocabulary: [membership, reminder, migration, supabase, error]. Read current server/services/membershipReminders.js, migration 005, and reminder tests. Live zero-row REST checks confirmed membership_reminders and admin_notification_dismissals missing (404 PGRST205), email_enabled column missing (400 42703), and claim_membership_reminder absent from API metadata. SMTP is not the cause. Added checkMembershipReminderSetup to validate schema, grants, and a deliberately ineligible claim probe once per batch. Shared setup errors now stop the batch with one sanitized specific diagnostic, clear stale counts, appear in Notifications, and retry hourly; member SMTP retries and duplicate protection stay intact. Added scripts/check-reminders.mjs and npm check:reminders; live check reproduces PGRST205 without emails or changes. Added schema-cache reload notification to migration 005. Expanded regression tests: 60 isolated checks passed; focused changed-fixture tests also passed. User chose and later confirmed connecting Supabase, but the active tool inventory still exposes no Supabase SQL capabilities, so migration has not been applied and live reminders remain blocked pending SQL-tool availability. Supabase plugin was discovered and suggested with explicit user connection intent; no dependency installed and no member records changed.

## Outcome

- Signal: useful

## Source Nodes

- server.js
- smtpConfigured
- expiryEmail()