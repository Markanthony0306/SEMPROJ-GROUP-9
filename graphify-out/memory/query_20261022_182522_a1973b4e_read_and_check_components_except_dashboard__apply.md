---
type: "query"
date: "2026-10-22T18:25:22.364907+00:00"
question: "Read and check components except Dashboard; apply Clear all and clear/delete where needed, fix positioning and spacing, use the reference for clear data and create a delete data icon."
contributor: "graphify"
outcome: "useful"
source_nodes: ["AdminReports()", "AdminStaffPage()", "Icon()", "reportRoutes"]
---

# Q: Read and check components except Dashboard; apply Clear all and clear/delete where needed, fix positioning and spacing, use the reference for clear data and create a delete data icon.

## Answer

Expanded query from existing graph vocabulary: [clear, delete, equipment, records, reports, attendance, payment, icon]. The graph located AdminReports(), AdminStaffPage(), UserPage(), reportRoutes and Icon(); current source and the existing protected API were read before editing. Reviewed non-Dashboard sections and applied single-record deletion plus Clear all data to administrator Attendance, Payments, Maintenance & Repair Log, and corresponding Reports categories including Renewals. Member profiles, equipment inventory, calculated Notifications, Settings, and member-facing histories retain their existing management/read-only behavior. New src/components/RecordDeleteControls.jsx centralizes accessible icon buttons and confirmation dialogs, reuses existing DELETE /admin/reports/:kind/:id and DELETE /admin/reports/:kind routes, requires target.all === true and typed CLEAR for bulk requests, prevents duplicate submissions and distinguishes refresh failures from successful deletion. DashboardShell.jsx adds native SVG list-and-X clear-data artwork based on the supplied image and a custom bin-and-X delete-data icon. AdminStaffPage.jsx and AdminReports.jsx wire the shared controls. AdminStaffPage.css and experience.css align heading actions right, add responsive wrapping and consistent 44px delete/action targets, and space equipment actions. supabase/README.md documents placement, scope and migration 004. scripts/test-ui-render.mjs adds rendering checks for labels, disabled buttons, confirmation, renewal/maintenance scope and missing IDs not selecting bulk mode. Verification: 12 existing isolated API tests passed, 7 rendering check groups passed, scoped Prettier and diff checks passed, npm.cmd run build passed with the large-chunk advisory. CUA reported no browser surfaces and iab unavailable, so interactive/visual browser verification was unavailable. No live records were deleted, no dependencies installed, no migration applied. Existing migration 004 must already be applied for bulk clear.

## Outcome

- Signal: useful

## Source Nodes

- AdminReports()
- AdminStaffPage()
- Icon()
- reportRoutes