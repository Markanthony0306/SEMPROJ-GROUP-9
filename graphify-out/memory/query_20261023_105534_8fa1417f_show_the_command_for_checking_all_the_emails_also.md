---
type: "query"
date: "2026-10-23T10:55:34.849881+00:00"
question: "show the command for checking all the emails also the bash for checking the system"
contributor: "graphify"
outcome: "useful"
source_nodes: ["smtpConfigured", "server.js", "Login()"]
---

# Q: show the command for checking all the emails also the bash for checking the system

## Answer

Expanded from original query via graph vocabulary: [email, smtp, test, server, build]. Verified package.json, scripts/check-email.mjs, scripts/inspect-auth-users.mjs and current test scripts. npm run check:email verifies SMTP only. npm run check:email -- --send-all-tests sends five dummy messages (welcome, reset, resent access, upcoming expiry, expired membership) to the configured SMTP_USER inbox and reports SMTP acceptance; inbox delivery needs human confirmation. inspect-auth-users.mjs prints Auth/profile counts only, not email addresses. Safe system-check bash uses set -e, node scripts/test-login-reset.mjs, npm run test:accounts, npm run test:reminders, node --test scripts/test-report-experience.mjs, node scripts/test-ui-render.mjs, node scripts/check-private-files.mjs, and npm run build. Do not recommend the old npm run test:server for an isolated full-system check: its smoke-server.mjs assumes DATA_FILE/AVATAR_DIR JSON storage while current server startup uses real Supabase, so it is obsolete and can target live records. No commands sending email or running system tests were executed for this command-only request.

## Outcome

- Signal: useful

## Source Nodes

- smtpConfigured
- server.js
- Login()