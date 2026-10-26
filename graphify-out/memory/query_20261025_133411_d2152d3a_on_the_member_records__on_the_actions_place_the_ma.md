---
type: "query"
date: "2026-10-25T13:34:11.675610+00:00"
question: "on the member records, on the actions place the mail button to the bottom of edit buttton. Also minimize the size of the table that fits perfect to the buttons. Apply the minimization of the table of the entire action table on the adminstaff_page"
contributor: "graphify"
outcome: "useful"
source_nodes: ["AdminStaffPage()", "DataTable()"]
---

# Q: on the member records, on the actions place the mail button to the bottom of edit buttton. Also minimize the size of the table that fits perfect to the buttons. Apply the minimization of the table of the entire action table on the adminstaff_page

## Answer

Expanded from original query via graph vocab: [admin, staff, member, record, table, cell, width, layout]. The graph located AdminStaffPage() at src/pages/AdminStaffPage.jsx:L156 and DataTable() at src/components/DataTable.jsx:L12. Verified current source, then added member-record-actions to the member Actions cell and member-mail-button to Mail. AdminStaffPage.css uses a two-column 44px grid with Mail in column 2 row 2. Shared admin-only Actions styling uses a 1 percent requested column width with intrinsic button widths, centered content, compact padding, and no wrapping. Removed the obsolete 184px Reports Actions width from experience.css and kept report row padding off action cells. Browser checks of the real built application with isolated read-only fixture API responses passed for admin and staff at 1280, 1488, and 1920 pixel viewports, covering Members, Equipment, Maintenance, Attendance, Payments, and all six report categories. Member Actions measured 121px, single delete columns about 77px, maintenance 88px, three report icons 173px. Verified button alignment, containment, role-specific control counts, and no client runtime errors; visually reviewed Member Records screenshot. Existing React rendering checks and npm.cmd run build -- --configLoader runner passed.

## Outcome

- Signal: useful

## Source Nodes

- AdminStaffPage()
- DataTable()