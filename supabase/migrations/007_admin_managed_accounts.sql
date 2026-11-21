-- Requires 001. FitPulse account and membership writes go through the API.
-- Enabling RLS alone preserves any policies inherited from an older schema.
-- Remove browser write permissions even when one of those policies allows it.
begin;

revoke insert, update, delete on table
  public.users,
  public.roles,
  public.subscriptions
from public, anon, authenticated;

-- The server verifies the FitPulse role before using its private service key.
grant insert, update, delete on table
  public.users,
  public.roles,
  public.subscriptions
to service_role;

commit;
