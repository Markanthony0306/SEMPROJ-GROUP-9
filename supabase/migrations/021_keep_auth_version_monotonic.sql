-- An older profile snapshot must never lower auth_version and restore access.
create function public.keep_fitpulse_auth_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.auth_version := greatest(old.auth_version, new.auth_version);
  return new;
end;
$$;

create trigger fitpulse_keep_auth_version
before update of auth_version on public.users
for each row execute function public.keep_fitpulse_auth_version();

revoke all on function public.keep_fitpulse_auth_version() from public, anon, authenticated;
grant execute on function public.keep_fitpulse_auth_version() to service_role;
