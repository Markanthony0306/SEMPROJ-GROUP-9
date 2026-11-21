# FitPulse Structural Refactor — No UI or database changes

This package is based on the source snapshot provided in the conversation AFTER the previously verified final OOP patch. It moves existing code into separate files; it does **not** create new functionality, SQL migrations, or CSS.

## What changes

| Existing file | Before | After |
| --- | ---: | ---: |
| `server/server.js` | 1007 lines | 359 lines |
| `src/pages/AdminStaffPage.jsx` | 926 | 467 |
| `src/components/admin/AdminStaffDialogs.jsx` | 534 | 87 |

The removed lines live in ten focused server route modules, one session authentication module, six admin page section components, four dialog-related components, and a five-test middleware unit suite. No existing CSS, layout classes, or JSX branch contents were changed.

## Apply on Windows PowerShell

1. Save/commit your current work first or create a separate local backup. Confirm the frontend and backend are stopped.
2. Extract all ZIP contents **directly** into your project root (`C:\Users\Admin\SEMPROJ-GROUP-9`). The `payload` folder must be alongside `apply-structural-refactor.ps1`.
3. In your project root, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\apply-structural-refactor.ps1
node --test (Get-ChildItem .\server -Recurse -Filter *.test.js | Select-Object -ExpandProperty FullName)
npm run build
git diff --stat
git status --short
```

The PowerShell installer checks SHA-256 hashes of **all three existing files** and the complete payload before making any changes. It stops without writing if your local files differ from the reviewed snapshot or if any new destination already exists. **Do not remove these safety checks or force the patch**. If it refuses, share the output and your current `server/server.js`, `AdminStaffPage.jsx`, and `AdminStaffDialogs.jsx` instead.

It saves a backup of the three overwritten files under your Windows temporary folder before applying. If copying fails midway, it attempts to restore overwritten files and remove newly copied ones. It does **not** run the application or query the database.

## Verify the existing workflow

Once the automated checks pass, start the backend *only after independently verifying* `.env.fitpulse-test` points to FitPulse-Test:

```powershell
node --env-file=.env.fitpulse-test -e "console.log(new URL(process.env.SUPABASE_URL).hostname)"
node --env-file=.env.fitpulse-test server/server.js
```

In another terminal: `npm run dev`.

Smoke-test admin/member login, admin dashboard, Member Records and its original deactivate dialog, registration, existing renewal, Payments, Equipment, QR attendance (including GOOJPRT scanner), Reports, Settings/profile, password change, recovery, and logout. Avoid irreversible actions on real accounts. Startup may seed test accounts.

## Validation already performed in isolated source workspace

- 135/135 backend tests passed (130 existing and 5 new session middleware tests).
- 23 direct Express endpoints match the original path and registration order.
- All 6 extracted dashboard/section JSX trees are structurally identical to their originals.
- All 11 dialog conditional branches retain the original JSX expressions.
- All extracted JavaScript modules passed `node --check`.
- New JSX files passed Babel parser validation and no missing local dependency references were detected.
- A **local Vite build could not be completed in this environment** because the uploaded `node_modules` contains Windows-only Rollup binaries, whereas this environment is Linux. Run `npm run build` on your Windows computer. Do not treat the static/automated results as a successful frontend build.

## Scope boundaries

- No SQL files are included; no Supabase changes.
- No changes to appearance or CSS.
- No reactivation functionality added.
- Permanent deletion remains disabled as before.
- `server.js` still initializes the same services and starts with the same seeding workflow. Registered `app` routes are **not** remounted under a different prefix; this deliberately preserves `req.path` behavior for mandatory-password-change checks.

## Revert

Find the backup folder printed by the script. Restore its 3 original files to their same relative paths, then remove the 22 new files listed inside `payload` if needed. Or use your own Git checkpoint. Do not use `git reset --hard` when uncommitted unrelated work exists.
