# FitPulse-Test — Full End-to-End Verification

This is a **manual testing guide**, not a claim that the live database has been tested. No production database operations are required.

## Before any writes

1. In PowerShell, run:
   `node --env-file=.env.fitpulse-test -e "console.log(new URL(process.env.SUPABASE_URL).hostname)"`
2. Independently check that hostname against **FitPulse-Test** in Supabase (not the original project).
3. Open the **FitPulse-Test** SQL Editor and execute `fitpulse-test-readonly-audit.sql`. Save the baseline results.
4. Keep at least one working administrator account untouched. Use disposable **test member accounts** for password resets and deactivation. Deactivation currently has no reactivation UI.
5. The current startup workflow can ensure the administrator account exists. It does not create the demo member Mia Cruz (`member@fitpulse.com`).

## Automated code checks

In PowerShell from your project root:

```powershell
node --test (Get-ChildItem .\server -Recurse -Filter *.test.js | Select-Object -ExpandProperty FullName)
npm run build
```

Use this to see source changes (if Git is initialized):

```powershell
git diff --stat
git diff -- server/server.js server/repositories/MembershipRepository.js
```

## Database-backed manual test matrix

Perform each check in the existing UI with a disposable FitPulse-Test member. Compare results with SQL baseline counts/records, then repeat the read-only audit SQL.

| Feature | Action | Expected result in UI | Verify in FitPulse-Test |
|---|---|---|---|
| Authentication | Admin and member logins | Correct dashboard permissions | `users`, `roles`, Supabase Auth |
| Member management | Create a test member | Member appears; temporary password flow retained | `users`, `auth.users` |
| Profile | Change member name/phone, refresh | Changes persist | `users` and Auth metadata for name |
| Member details | Edit member information | Values remain after refresh | `users`, `subscriptions` if plan changed |
| Membership | Renew a member with configured plan/method | New dates and payment returned | `subscriptions`, `payments` |
| Payments | Record a manual payment | Row appears in payment history | `payments`, `payment_methods` |
| Equipment | Add/edit equipment, add maintenance note | Values persist | `gym_equipment`, `gym_maintenance` |
| Attendance | Scan valid membership QR using GOOJPRT MP2300 | Successful scan | One new row in `attendance_logs` |
| Duplicate scan | Scan again within cooldown | Existing cooldown behavior | No extra attendance row |
| Deactivation | Deactivate **disposable** member only | Inactive; login blocked | `users.status`, old history retained |
| Inactive member QR | Scan old QR after deactivation | Rejected | No additional attendance row |
| Change Password | Update password for disposable member | New session issued; old password rejected | Supabase Auth; `users.auth_version` increases |
| Forgot/reset Password | Only with usable test email/recovery setup | Link, reset, and login work | Supabase Auth; `users.auth_version` increases |
| Reports | Generate/view existing reports | Counts match tables | Compare `attendance_logs`, `payments`, memberships |
| RBAC | Member tries admin-only action | Denied | No unauthorized writes |

**Do not use the original Supabase project for these tests.**

## Important constraints

- No UI, CSS, React component, migrations, or database schemas are changed by the patch.
- The auth-password and recovery endpoints retain their existing order of updates. If the Auth write succeeds but the public profile write fails, the older workflow is **not atomic**; this patch intentionally does not introduce new database behavior.
- The membership-renewal repository had a proven success-path return bug; the patch now returns the existing RPC data so its workflow receives the saved result.
- Legacy disabled/deprecated routes remain unchanged, and member reactivation is not added.
- The zip supplied for audit omitted `/scripts`, `.env` and `node_modules`, so auxiliary `npm run test:server`, reminder/email scripts and live connections are not verifiable from that archive alone.
