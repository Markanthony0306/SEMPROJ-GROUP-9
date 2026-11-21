begin;

-- Migration 001 checked the constraint name, so a pre-existing RESTRICT or
-- NO ACTION rule could survive even though 006 requires an Auth cascade.
do $$
declare
  profile_column smallint;
  auth_column smallint;
  old_constraint record;
begin
  select attnum into strict profile_column from pg_catalog.pg_attribute
    where attrelid = 'public.users'::regclass and attname = 'auth_user_id' and not attisdropped;
  select attnum into strict auth_column from pg_catalog.pg_attribute
    where attrelid = 'auth.users'::regclass and attname = 'id' and not attisdropped;

  for old_constraint in
    select conname from pg_catalog.pg_constraint
    where conrelid = 'public.users'::regclass and confrelid = 'auth.users'::regclass
      and contype = 'f' and conkey = array[profile_column] and confkey = array[auth_column]
      and confdeltype <> 'c'
  loop
    execute format('alter table public.users drop constraint %I', old_constraint.conname);
  end loop;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.users'::regclass and confrelid = 'auth.users'::regclass
      and contype = 'f' and conkey = array[profile_column] and confkey = array[auth_column]
      and confdeltype = 'c'
  ) then
    alter table public.users add constraint fitpulse_users_auth_cascade_fkey
      foreign key (auth_user_id) references auth.users(id) on delete cascade not valid;
    -- The new rule applies to new writes and Auth deletion. Existing orphaned
    -- links are reported below rather than being reassigned to another person.
  end if;
end
$$;

-- Reattach the existing 006 trigger with the expected event and function.
drop trigger if exists fitpulse_delete_member_records on public.users;
create trigger fitpulse_delete_member_records before delete on public.users
for each row execute function public.delete_fitpulse_member_records();

create function public.fitpulse_member_deletion_readiness(p_user_id uuid, p_auth_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not exists (
      select 1 from public.users account
      join public.roles role on role.role_id = account.role_id
      where account.id = p_user_id and account.auth_user_id = p_auth_user_id
        and lower(role.role_name) in ('member', 'user')
    ) then 'profile_link_changed'
    when not exists (select 1 from auth.users where id = p_auth_user_id) then 'login_missing'
    when not exists (
      select 1 from pg_catalog.pg_constraint c
      join pg_catalog.pg_attribute a on a.attrelid = c.conrelid and a.attname = 'auth_user_id'
      join pg_catalog.pg_attribute b on b.attrelid = c.confrelid and b.attname = 'id'
      where c.conrelid = 'public.users'::regclass and c.confrelid = 'auth.users'::regclass
        and c.contype = 'f' and c.conkey = array[a.attnum] and c.confkey = array[b.attnum]
        and c.confdeltype = 'c'
    ) then 'cascade_missing'
    when not exists (
      select 1 from pg_catalog.pg_trigger where tgrelid = 'public.users'::regclass
        and tgname = 'fitpulse_delete_member_records' and tgenabled in ('O', 'A')
        and tgfoid = 'public.delete_fitpulse_member_records()'::regprocedure and tgtype = 11
    ) then 'cleanup_missing'
    else 'ready'
  end;
$$;

revoke all on function public.fitpulse_member_deletion_readiness(uuid, uuid) from public, anon, authenticated;
grant execute on function public.fitpulse_member_deletion_readiness(uuid, uuid) to service_role;

-- Keep the legacy role name working in 006's cleanup. Migrations 002, 019 and
-- 020 cascade the face template, attached ID documents and their review data.
create or replace function public.delete_fitpulse_member_records()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.roles where role_id = old.role_id and lower(role_name) in ('member', 'user')) then
    delete from public.payments payment using public.subscriptions subscription
      where payment.subscription_id = subscription.subscription_id and subscription.user_id = old.id;
    delete from public.subscriptions where user_id = old.id;
    delete from public.attendance_logs where user_id = old.id;
    update public.payments set processed_by_user_id = null where processed_by_user_id = old.id;
    if to_regclass('public.maintenance_logs') is not null then
      update public.maintenance_logs set staff_id = null where staff_id = old.id;
    end if;
    if to_regclass('public.notifications') is not null then
      delete from public.notifications where user_id = old.id;
    end if;
    if to_regclass('public.qr_credentials') is not null then
      delete from public.qr_credentials where user_id = old.id;
    end if;
  end if;
  return old;
end
$$;

notify pgrst, 'reload schema';
commit;
