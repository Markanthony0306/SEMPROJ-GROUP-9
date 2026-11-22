---
type: "query"
date: "2026-10-28T06:29:17.476973+00:00"
question: "remove the automatic delete account within 15 days feature on admin/staff_page"
contributor: "graphify"
outcome: "useful"
source_nodes: ["AdminStaffPage.jsx", "UserPage.jsx", "server.js"]
---

# Q: remove the automatic delete account within 15 days feature on admin/staff_page

## Answer

Expanded from original query via graph vocabulary: account cleanup expiry membership delete admin staff lock. The existing graph identifies AdminStaffPage.jsx at L1, UserPage.jsx at L1 and server.js at L1, but does not include the expired-account cleanup service added later. Direct source inspection found the cleanup worker was constructed and started only by server/server.js. Removed its import, construction, startup and close handler. Removed the deletion deadline warning from UserPage and reused the existing membership renewal message. Updated setup docs. Manual administrator-confirmed account deletion, expiry status, renewal and reminder emails remain available. The retired service and its isolated tests were preserved as files, with no application entry point importing or starting it. Verified 33 isolated route/reminder/lock tests, UI rendering and production build. API restart is required to stop a worker in an already running process.

## Outcome

- Signal: useful

## Source Nodes

- AdminStaffPage.jsx
- UserPage.jsx
- server.js