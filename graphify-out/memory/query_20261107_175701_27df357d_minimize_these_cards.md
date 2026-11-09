---
type: "query"
date: "2026-11-07T17:57:01.401064+00:00"
question: "minimize these cards"
contributor: "graphify"
outcome: "useful"
source_nodes: ["AdminStaffPage()", "DashboardShell()"]
---

# Q: minimize these cards

## Answer

Expanded from graph vocabulary: admin staff dashboard shell. The graph locates AdminStaffPage() at src/pages/AdminStaffPage.jsx:L156 (graph location; current source verified separately). The four stat articles use .admin-stats .stat with a .bub icon and label/value div. Made a focused CSS change in src/pages/AdminStaffPage.css: horizontal centered layout, 14px padding, 12px internal gap, 90px minimum height, 36px icons, 4px label/value gap, clamp(20px, 1.6vw, 24px) value font, and 16px grid gap. Colors, shadows, markup, JavaScript, and data were not changed. Build and 10 existing render checks passed. Live browser verification was unavailable.

## Outcome

- Signal: useful

## Source Nodes

- AdminStaffPage()
- DashboardShell()