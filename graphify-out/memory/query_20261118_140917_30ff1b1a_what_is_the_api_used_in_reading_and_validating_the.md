---
type: "query"
date: "2026-11-18T14:09:17.263011+00:00"
question: "what is the api used in reading and validating the document of id"
contributor: "graphify"
outcome: "useful"
source_nodes: ["createAdminIdentityService()", "start()", "complete()", "checkSession()", "AdminIdentityVerification()"]
---

# Q: what is the api used in reading and validating the document of id

## Answer

Expanded from original query via graph vocab: [identity, stripe, verification, session, validate]. FitPulse uses Stripe Identity for administrator ID document verification. The graph connects AdminIdentityVerification() with apiRequest() and isStripeVerificationUrl(), and createAdminIdentityService() with start(), complete(), and checkSession(). Source verification: server/services/adminIdentity.js L192 creates stripe.identity.verificationSessions with type document and require_matching_selfie plus require_live_capture enabled. L243 retrieves the verification session with verified_outputs expanded. L268 requires verified status and L274-L278 compare the verified first and last name with configured administrator names. The React component calls /auth/admin-identity/complete at src/components/AdminIdentityVerification.jsx L68. This identifies the configured integration; no live Stripe verification was performed and no application source was changed.

## Outcome

- Signal: useful

## Source Nodes

- createAdminIdentityService()
- start()
- complete()
- checkSession()
- AdminIdentityVerification()