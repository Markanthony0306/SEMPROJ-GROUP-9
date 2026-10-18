---
type: "query"
date: "2026-10-17T16:59:46.227074+00:00"
question: "use this as guide to make the stepper better(add a animation when you finish the 1st step) and fix the error. Check if system has errors, fix it."
contributor: "graphify"
outcome: "useful"
source_nodes: ["FaceCapture()", "loadFaceApi()", "vite"]
---

# Q: use this as guide to make the stepper better(add a animation when you finish the 1st step) and fix the error. Check if system has errors, fix it.

## Answer

Expanded from graph vocabulary: face capture load error vite login auth. Graph located FaceCapture() at src/components/FaceCapture.jsx L24 and loadFaceApi() at L7 (locations predate edits). Direct HTTP reproduction found the running Vite face-api import returned 504 while model manifests returned 200. Fixed explicit optimizeDeps inclusion, isolated test caches, retryable loader in src/utils/faceApi.js, and readable reload errors. Replaced step cards with connected circles and completion/checkmark animations respecting reduced motion. Private-file checks found server files publicly served by Vite; fs.deny now blocks them, verified 403. After edits the running app import returns 200. Isolated API suites, loader regression tests, UI render checks, HTTP import/model checks, and production build pass. Live camera and visual animation testing were unavailable because no browser surface is connected.

## Outcome

- Signal: useful

## Source Nodes

- FaceCapture()
- loadFaceApi()
- vite