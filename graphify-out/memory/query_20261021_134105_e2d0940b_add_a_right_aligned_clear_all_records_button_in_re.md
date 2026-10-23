---
type: "query"
date: "2026-10-21T13:41:05.835351+00:00"
question: "Add a right-aligned clear-all-records button in Reports; fix spacing of Email reminders are disabled in Gym Preferences; remove Create account from Reports; inspect and remove redundant Memberships component."
contributor: "graphify"
outcome: "useful"
source_nodes: ["AdminReports()", "DataTable()", "ADMIN_NAVIGATION", "membershipState()"]
---

# Q: Add a right-aligned clear-all-records button in Reports; fix spacing of Email reminders are disabled in Gym Preferences; remove Create account from Reports; inspect and remove redundant Memberships component.

## Answer

Expanded using exact graph vocabulary: reports records delete membership members navigation reminder. Graph nodes located AdminReports.jsx source_location L1, ADMIN_NAVIGATION in DashboardShell.jsx, reportRecords.js, and membershipState(). Live inspection confirmed the standalone Memberships page duplicated the Members profile details and the shared renewal dialog available from both Members and Reports. Removed its navigation entry and page branch while preserving memberships, plan fields, and renewal actions. Removed the Reports Create account button. Wrapped reminder delivery notices in a scoped spaced footer in AdminStaffPage.jsx and AdminStaffPage.css. User explicitly chose clearing the selected report category while retaining accounts and membership dates. Added a rightmost admin-only Clear records button in Attendance, Payment, Renewal and Maintenance, with typed CLEAR confirmation and effects explained. Added a protected collection DELETE route, category validation, and server-only transactional SQL RPC in 004_clear_report_records.sql. Renewal-only clearing uses the same earlier-subscription definition as buildReport and preserves initial payments. No live data was deleted and the new migration was not executed because no SQL-management session is available. Twelve isolated report integration tests and existing UI render checks passed, including role validation, category isolation and missing-migration failures. Production build and formatting passed; final build is being refreshed after confirmation-copy cleanup. Browser visual verification remains unavailable. Apply migration 004 and restart the API to activate clearing. Earlier reminder and layout work was preserved.

## Outcome

- Signal: useful

## Source Nodes

- AdminReports()
- DataTable()
- ADMIN_NAVIGATION
- membershipState()