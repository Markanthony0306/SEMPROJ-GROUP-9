---
type: "query"
date: "2026-11-19T02:55:48.719096+00:00"
question: "fix the positioning of the login page on mobile version"
contributor: "graphify"
outcome: "useful"
source_nodes: ["Login()", "ThemeProvider()"]
---

# Q: fix the positioning of the login page on mobile version

## Answer

Expanded from graph vocabulary: login, theme, form. The graph located Login() at src/pages/Login.jsx L152 and ThemeProvider() at src/components/brand/useTheme.jsx L14. The current source styles the login cards and fixed theme toggle in src/pages/Login.css. The mobile style reserved 54px above the brand while the theme button extended to 60px, and stable scrollbar gutter made the page asymmetric. Scoped the login-wrapper layout at up to 900px to reserve 70px plus safe-area space, use safe vertical centering and symmetric side padding, place the theme button inside the page flow as an absolutely positioned 44px control, and remove stable gutter on mobile. The production build passed. The design gate returned GATE: ERROR because Chrome was not found, but Edge screenshots at 390x844 and 360x640 were inspected and show separated controls and centered cards, with scrolling at short height.

## Outcome

- Signal: useful

## Source Nodes

- Login()
- ThemeProvider()