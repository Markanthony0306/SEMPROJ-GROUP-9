---
type: "query"
date: "2026-10-21T13:22:42.090789+00:00"
question: "fix the layout, spacing of this section"
contributor: "graphify"
outcome: "useful"
source_nodes: ["AdminReports()", "DataTable()"]
---

# Q: fix the layout, spacing of this section

## Answer

Expanded from the graph vocabulary: admin reports table layout styles experience. The graph located AdminReports() at src/components/AdminReports.jsx source_location L139 and DataTable() at src/components/DataTable.jsx L12. Live source inspection found the Reports actions occupied a separate header row, tabs had 26px vertical margins, search and sort controls used space-between, and three 38px row actions wrapped inside the 160px action column. Moved report tabs into the existing report header before the actions. Updated src/styles/experience.css to align the report toolbar with CSS Grid, give row actions a nonwrapping intrinsic width, reserve a 176px desktop action column, reduce desktop cell padding, and stack controls and action labels on mobile. Changes affect the Reports component and scoped report table styles. Existing UI rendering checks and formatting passed; production build passed before removing an unnecessary fixed table minimum, and the final build is being rerun. Browser visual review is unavailable because CUA reports no browsers or apps. Earlier reminder work was preserved.

## Outcome

- Signal: useful

## Source Nodes

- AdminReports()
- DataTable()