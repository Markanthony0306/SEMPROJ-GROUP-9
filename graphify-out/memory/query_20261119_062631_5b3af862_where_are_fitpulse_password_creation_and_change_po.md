---
type: "query"
date: "2026-11-19T06:26:31.056872+00:00"
question: "Where are FitPulse password creation and change policies enforced?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["PasswordChangeForm()", "ResetPassword()", "Register()"]
---

# Q: Where are FitPulse password creation and change policies enforced?

## Answer

Expanded from graph vocabulary: password policy change register reset recovery admin auth. Graphify identified PasswordChangeForm, ResetPassword, Register and the original server policy. Verified current source uses shared/passwordPolicy.js through createDependencies for ChangePasswordService, PasswordRecoveryService and MemberUpdateService. Registration generates temporary passwords using the shared maximum. Updated the shared policy and inline field messages; HTTP bypass tests and form interaction checks cover these entry points. The admin password was updated through the existing Supabase Auth script without adding credentials to source.

## Outcome

- Signal: useful

## Source Nodes

- PasswordChangeForm()
- ResetPassword()
- Register()