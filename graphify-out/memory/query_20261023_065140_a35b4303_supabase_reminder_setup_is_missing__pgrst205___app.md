---
type: "query"
date: "2026-10-23T06:51:40.317991+00:00"
question: "Supabase reminder setup is missing (PGRST205). Apply supabase/migrations/005_admin_notifications.sql to the project in SUPABASE_URL, then run npm run check:reminders."
contributor: "graphify"
outcome: "useful"
source_nodes: ["server.js", "smtpConfigured"]
---

# Q: Supabase reminder setup is missing (PGRST205). Apply supabase/migrations/005_admin_notifications.sql to the project in SUPABASE_URL, then run npm run check:reminders.

## Answer

Expanded via graph vocabulary: [membership, reminder, migration, supabase, error]. Re-read migration 005 and scripts/check-reminders.mjs. Confirmed SUPABASE_URL selects project rgemzbwalpppyonyegoh. Ran the live no-email diagnostic: it still fails PGRST205. Current tool inventory exposes no Supabase tools; local configuration has no Supabase MCP server, CLI, database URL/password or management access token. User previously confirmed connecting Supabase, but that has not exposed SQL access in this execution session. Tried opening the exact project SQL Editor through the browser tool; it returned Browser is not available: iab. Migration was not executed and no source files or member data changed. Concrete remaining action is to open the Supabase SQL Editor for rgemzbwalpppyonyegoh, run the entire prepared 005_admin_notifications.sql, then run npm.cmd run check:reminders; expected result is PASS. Avoid repeating the unverified suggestion that a fresh message alone will expose the missing SQL tools.

## Outcome

- Signal: useful

## Source Nodes

- server.js
- smtpConfigured