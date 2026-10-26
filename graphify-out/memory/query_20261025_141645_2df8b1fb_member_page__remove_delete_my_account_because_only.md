---
type: "query"
date: "2026-10-25T14:16:45.393255+00:00"
question: "Member_page: remove Delete my account because only the admin can create and delete accounts; show an expired membership notification explaining automatic deletion 15 days after expiry; Admin/staff_page: fix Clear all and show the problems and how they were fixed. User confirmed automatic deletion 15 days after expiry and reported the report-clearing integration unavailable error."
contributor: "graphify"
outcome: "useful"
source_nodes: ["membershipState()", "AdminStaffPage()"]
---

# Q: Member_page: remove Delete my account because only the admin can create and delete accounts; show an expired membership notification explaining automatic deletion 15 days after expiry; Admin/staff_page: fix Clear all and show the problems and how they were fixed. User confirmed automatic deletion 15 days after expiry and reported the report-clearing integration unavailable error.

## Answer

Expanded from original query via graph vocab: [account, delete, expiry, membership, member, admin, clear, record, reports]. Graph located membershipState(), AdminStaffPage(), and account deletion sources; current source inspection confirmed member self-deletion API, staff account creation, and unauthenticated legacy registration. Removed member delete UI and dialog self mode, deny DELETE /profile, require authenticated admin for both create APIs and frontend creation controls. Shared membershipExpiry.js computes a valid string expiry plus 15 elapsed days; UserPage expired notices show deadline in Manila time, renewal exception, and overdue variant. Internal expiredAccountCleanup service checks at API startup/hourly, skips ineligible/missing data and renewed accounts, rechecks current member state before photo removal/Auth delete, retries failures, and shares a per-member process lock with renewal. Multiple API instances require database-level coordination; Storage/Auth still have partial-photo failure limitation. Prepared migration007 to revoke browser account/membership write grants while preserving service_role. User Clear all error matches missing/unavailable RPC/signature PGRST202, not CSS; migration004 now notifies schema cache reload and docs/CLEAR_REPORT_SETUP.md explains non-deleting installation and read-only verification. Clear dialog requires exact CLEAR, shows guidance, locks pending action, and distinguishes successful deletion from failed refresh. 76 automated isolated checks, real component bulk browser checks, six real app member/admin/staff UI cases and production build passed. No real account or records were deleted. Live migrations NOT applied: Supabase plugin not installed; already suggested within 7 days so not suggested again. Read-only Brave inspection was rejected because Computer Use was not approved for Brave. Live setup remains pending user approval/access or user running prepared SQL.

## Outcome

- Signal: useful

## Source Nodes

- membershipState()
- AdminStaffPage()