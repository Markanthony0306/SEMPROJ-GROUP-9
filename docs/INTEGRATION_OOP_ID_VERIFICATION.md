# FitPulse OOP + ID verification integration (review build)

This integration preserves the OOP application bootstrap, workflows, and deactivation
behavior. Teammate ID and face enhancements are integrated as **opt-in**, because
member creation and sign-in depend on a new Supabase schema.

## Rollout flags

Backend: `ID_VERIFICATION_ENABLED=true` (only on FitPulse-Test after migrations).
Frontend Vite: `VITE_ID_VERIFICATION_ENABLED=true`.
Both must be enabled together. Until then, existing member registration/login remains
available. Do not commit `.env.fitpulse-test` or other secret env files.

## Schema review

The teammate branch's SQL migrations 010, 011, 012, 014 have been renamed to
019, 020, 021, 022 respectively. Versions 010 through 016 belong to OOP.
Teammate migrations 013 and 015 enabling permanent member deletion were deliberately
excluded because this project's agreed behavior is deactivation with preserved records.

**DO NOT execute migrations yet.** Review SQL function dependencies, grants,
existing FitPulse-Test migration history, and ID/face data privacy before applying.
Do not run against the original/production Supabase project.

## Validation after merging

- `npm ci` (new sharp/OCR/camera packages from teammate)
- `node --test (Get-ChildItem .\server -Recurse -Filter *.test.js | Select-Object -ExpandProperty FullName)`
- `npm run build`
- Run against FitPulse-Test only; validate login (admin/member), ID enrollment,
  deactivation, QR scanner, payments, password changes, and visual regressions.
- Never commit the integration merge until both old and new features pass.
