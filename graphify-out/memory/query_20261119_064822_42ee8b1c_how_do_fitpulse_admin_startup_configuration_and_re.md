---
type: "query"
date: "2026-11-19T06:48:22.810541+00:00"
question: "How do FitPulse admin startup configuration and recovery page layout work?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["ResetPassword()", "ensureSeedAccount()"]
---

# Q: How do FitPulse admin startup configuration and recovery page layout work?

## Answer

The admin seed workflow reads private ADMIN_EMAIL and ADMIN_PASSWORD, and a linked admin keeps its identity across restarts. ResetPassword and ForgotPassword use the dedicated password-recovery layout in Login.css. Credentials belong only in the ignored server environment.

## Outcome

- Signal: useful

## Source Nodes

- ResetPassword()
- ensureSeedAccount()