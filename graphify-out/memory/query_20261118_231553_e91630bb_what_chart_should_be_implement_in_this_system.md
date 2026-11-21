---
type: "query"
date: "2026-11-18T23:15:53.180621+00:00"
question: "what chart should be implement in this system"
contributor: "graphify"
outcome: "useful"
source_nodes: ["ActivityChart()", "activityBuckets()", "buildReport()"]
---

# Q: what chart should be implement in this system

## Answer

Expanded graph vocabulary: activity, chart, attendance, payments, membership, renewal, dashboard, reports. The graph maps ActivityChart() at src/components/ActivityChart.jsx L6 to activityBuckets() at src/utils/activityChart.js L18, and AdminReports() to buildReport() at src/utils/reports.js L21. Current source verification confirms existing attendance/revenue column charts with 7-day and 6-month ranges, current membership status and expiry dates, renewal payment types, and check-in timestamps. Recommendations (proposed, not implemented): add a horizontal membership-status bar chart first; keep attendance and monthly recorded-payment columns; add grouped new-membership versus renewal payment counts in Reports; later add a weekday/hour check-in heatmap (arrivals, not occupancy). Expiring soon must be disjoint from other active members. Payment totals should use confirmed paid records and handle refunds if supported. Use Asia/Manila for grouping. Existing member dashboard already reuses personal attendance chart. General chart selection was cross-checked against the ONS service manual for bar and column charts.

## Outcome

- Signal: useful

## Source Nodes

- ActivityChart()
- activityBuckets()
- buildReport()