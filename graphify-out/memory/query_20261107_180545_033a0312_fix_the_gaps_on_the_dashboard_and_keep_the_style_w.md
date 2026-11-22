---
type: "query"
date: "2026-11-07T18:05:45.878737+00:00"
question: "fix the gaps on the dashboard and keep the style when stretched to fullscreen"
contributor: "graphify"
outcome: "useful"
source_nodes: ["AdminStaffPage()", "DashboardShell()"]
---

# Q: fix the gaps on the dashboard and keep the style when stretched to fullscreen

## Answer

Used graph vocabulary admin dashboard shell and located DashboardShell() and AdminStaffPage(); then verified current source and compiled CSS directly. The main was capped at 1440px with auto side margins, and shared .app rules loaded after admin CSS and overrode equal-specificity root, main, sidebar and header spacing. Updated only src/pages/AdminStaffPage.css: use stronger .app.admin-app selectors; 16px gap and padding variables (12px mobile padding); remove 1280px minimum and main width cap; align content at start; remove extra hero bottom margin and bottom-card stretching. Preserve compact stat minimum height 90px, 36px icons and 14px padding. Set fixed 24px values and use CSS container queries to put values on the right inside wide cards while narrow cards retain stacked text. Add 4/2/1-column responsive stat layout and reuse existing sidebar menu state below 1000px. No application JS, data, colors or shadows changed. Build, formatting and 10 existing UI render checks passed. Audited compiled CSS cascade at 320, 390, 768, 1024, 1440, 1920 and 2560px: correct gap, padding, unbounded main and stat column counts. Live browser visual verification was unavailable.

## Outcome

- Signal: useful

## Source Nodes

- AdminStaffPage()
- DashboardShell()