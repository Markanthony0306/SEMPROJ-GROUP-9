---
type: "query"
date: "2026-11-18T23:46:37.779705+00:00"
question: "show how to allow and public it so others can access the system"
contributor: "graphify"
outcome: "useful"
source_nodes: ["vite.config.js", "apiRequest()", "corsOrigins"]
---

# Q: show how to allow and public it so others can access the system

## Answer

Expanded from original query via graph vocab: [vite, config, server, api, cors, origins, port, url]. The existing graph identified vite.config.js (L1), apiRequest() in src/utils/api.js (L33), and the historical corsOrigins in server/server.js (L87). The server graph is older than the current bootstrap refactor, so current source was verified directly. Configured the exact assigned ngrok hostname in server.allowedHosts, fixed Vite on port 5173 with strictPort, and forwarded /api to Node at 127.0.0.1:3001. Set the frontend API fallback and local VITE_API_URL to /api so remote browsers never call their own localhost. Updated local CLIENT_URL and CORS_ORIGINS for the active tunnel, plus .env.example and docs/SHARING_WITH_NGROK.md. Restarted only the identified FitPulse Vite process after discovering it still served the old environment. Verified the public page and frontend API URL, protected /api/me returns 401, private .env and server source return 403, and an untrusted Host returns 403. npm run build passed with bundle-size warnings. The existing API must be restarted to load its updated CLIENT_URL for recovery links; Supabase must allow the exact public /reset-password redirect. Temporary sharing requires Vite, Node, ngrok, and the computer to remain online. Production requires a built frontend plus managed API hosting and explicit routing or VITE_API_URL for a separate API.

## Outcome

- Signal: useful

## Source Nodes

- vite.config.js
- apiRequest()
- corsOrigins