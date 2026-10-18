---
type: "query"
date: "2026-10-17T17:20:13.763355+00:00"
question: "use these pics for dashboard overview bg. Keep the heartbeat-style loader at exactly 1 second, prevent duplicate loaders, and fix admin/member fade-in without changing other features or styles."
contributor: "graphify"
outcome: "useful"
source_nodes: ["App()", "HeartRateLoader()", "DashboardShell()", "ThemeProvider()"]
---

# Q: use these pics for dashboard overview bg. Keep the heartbeat-style loader at exactly 1 second, prevent duplicate loaders, and fix admin/member fade-in without changing other features or styles.

## Answer

Expanded from graph vocabulary: app heart loader dashboard shell ready theme welcome. Graph located App(), HeartRateLoader(), DashboardShell(), and ThemeProvider(); verified their current files directly. Removed the competing Suspense/login loaders in App and placed a single timed loader in DashboardShell. LOADER_DURATION_MS in src/utils/loaderTiming.js is shared by the real timer and CSS custom property. Timer keeps its original deadline across StrictMode effect cleanup. Initial data and both theme images are prepared before the one-second transition; the persistent shell remains visible. Content enters with one 360 ms opacity/translateY animation and 60 ms stagger, respecting reduced motion and leaving clay shadows intact. Supplied day/night JPEGs were copied unchanged into src/assets and used on both dashboard overview banners. Three timer tests, six UI render checks, formatting, and production build passed. Browser visual checks are unavailable in this session.

## Outcome

- Signal: useful

## Source Nodes

- App()
- HeartRateLoader()
- DashboardShell()
- ThemeProvider()