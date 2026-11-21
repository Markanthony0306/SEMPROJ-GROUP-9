begin;

create table public.password_recovery_tokens (
  user_id uuid primary key references public.users(id) on delete cascade,
  token_hash text unique not null,
  auth_user_id uuid not null,
  auth_version integer not null,
  email text not null,
  expires_at timestamptz not null
);

alter table public.password_recovery_tokens enable row level security;
revoke all on table public.password_recovery_tokens from public, anon, authenticated;
grant select, insert, update, delete on table public.password_recovery_tokens to service_role;

create function public.check_password_recovery_token(p_hash text)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.password_recovery_tokens token
    join public.users profile on profile.id = token.user_id
    where token.token_hash = p_hash and token.expires_at > now()
      and profile.auth_version = token.auth_version
      and profile.auth_user_id = token.auth_user_id
      and profile.email = token.email and profile.status in ('active', 'expired')
  );
$$;

-- DELETE ... RETURNING gives one caller ownership, including across API instances.
create function public.consume_password_recovery_token(p_hash text)
returns table (id uuid, auth_user_id uuid, auth_version integer)
language sql
security invoker
set search_path = ''
as $$
  delete from public.password_recovery_tokens token
  using public.users profile
  where token.token_hash = p_hash and token.expires_at > now()
    and profile.id = token.user_id and profile.auth_version = token.auth_version
    and profile.auth_user_id = token.auth_user_id
    and profile.email = token.email and profile.status in ('active', 'expired')
  returning token.user_id, token.auth_user_id, token.auth_version;
$$;

revoke all on function public.check_password_recovery_token(text),
  public.consume_password_recovery_token(text) from public, anon, authenticated;
grant execute on function public.check_password_recovery_token(text),
  public.consume_password_recovery_token(text) to service_role;

notify pgrst, 'reload schema';

commit;
