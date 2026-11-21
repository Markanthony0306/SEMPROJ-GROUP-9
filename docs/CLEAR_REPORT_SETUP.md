# Fix report clearing setup

The message "Report clearing is unavailable" comes from the API's `PGRST202`
error branch. The Supabase Data API could not find
`public.clear_fitpulse_report_records(p_category text)` in its schema cache.
The function may not have been installed, or the cache may need refreshing.
This message does not distinguish those causes by itself.

## Apply the setup without clearing records

1. Open the Supabase project used by the FitPulse API. Confirm it is the project
   configured by the private server's `SUPABASE_URL`; do not share secret keys.
2. Open **SQL Editor** and create a new query.
3. Copy the complete contents of
   [004_clear_report_records.sql](../supabase/migrations/004_clear_report_records.sql)
   into the query, then run it. Migration 001 must already be applied.
4. Reload FitPulse after the query succeeds.

Applying migration 004 creates or replaces the clearing function, restricts its
execution to the server's `service_role`, and requests a Data API schema refresh.
It does **not** call the clearing function or delete any records. The `DELETE`
statements in the function body run only when an authorized administrator later
confirms an actual clear operation.

If the migration fails, read the SQL error and correct that prerequisite before
retrying; do not bypass the function with a separate bulk delete.

## Verify setup without deleting anything

Run this read-only SQL query in the same project's SQL Editor:

```sql
select
  routine.oid::regprocedure as report_clear_function,
  pg_catalog.has_function_privilege('service_role', routine.oid, 'EXECUTE')
    as server_can_execute,
  pg_catalog.has_function_privilege('anon', routine.oid, 'EXECUTE')
    as anonymous_can_execute,
  pg_catalog.has_function_privilege('authenticated', routine.oid, 'EXECUTE')
    as signed_in_client_can_execute
from pg_catalog.pg_proc routine
where routine.oid = pg_catalog.to_regprocedure(
  'public.clear_fitpulse_report_records(text)'
);
```

Expected: one row showing the function, `server_can_execute = true`, and both
client permissions `false`. No rows means the function is missing from that
database. This verifies database setup, not an actual clear operation.

If the function exists but the Data API still returns `PGRST202`, request a cache
refresh and wait briefly before reloading FitPulse:

```sql
notify pgrst, 'reload schema';
```

Do not call `clear_fitpulse_report_records` with a real category as a setup test:
that would delete the selected history. The local regression checks use isolated
fixtures instead:

```powershell
node --test scripts/test-report-experience.mjs
node scripts/test-record-clearing.mjs
```

The browser check requires an existing Playwright runtime. It supports
`PLAYWRIGHT_MODULE_PATH` and `PLAYWRIGHT_EXECUTABLE_PATH` for an existing local
installation; no dependencies are installed by these checks.
