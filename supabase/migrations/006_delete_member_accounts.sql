-- Requires 001. Run in the Supabase SQL Editor before enabling account deletion.
-- Auth deletion cascades to public.users; clean up the member's linked records
-- in that same transaction, rather than leaving a partially deleted account.
begin;

create or replace function public.delete_fitpulse_member_records()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.roles where role_id = old.role_id and lower(role_name) = 'member'
  ) then
    delete from public.payments payment
    using public.subscriptions subscription
    where payment.subscription_id = subscription.subscription_id
      and subscription.user_id = old.id;
    delete from public.subscriptions where user_id = old.id;
    delete from public.attendance_logs where user_id = old.id;
    -- Keep other members' financial and maintenance history intact if a
    -- legacy member profile was recorded as the processing staff account.
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
    if to_regclass('public.face_enrollments') is not null then
      delete from public.face_enrollments where user_id = old.id;
    end if;
  end if;
  return old;
end
$$;

drop trigger if exists fitpulse_delete_member_records on public.users;
create trigger fitpulse_delete_member_records
before delete on public.users
for each row execute function public.delete_fitpulse_member_records();

create or replace function public.check_fitpulse_account_deletion(p_user_id uuid, p_auth_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.users account
    join public.roles account_role on account_role.role_id = account.role_id
    where account.id = p_user_id and account.auth_user_id = p_auth_user_id
      and lower(account_role.role_name) = 'member'
  ) and exists (
    -- Refuse deletion if migration 001's Auth -> profile cascade is missing.
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.users'::regclass
      and confrelid = 'auth.users'::regclass and confdeltype = 'c'
      and conkey = array[(select attnum from pg_catalog.pg_attribute
        where attrelid = 'public.users'::regclass and attname = 'auth_user_id')]
  ) and exists (
    select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.users'::regclass
      and tgname = 'fitpulse_delete_member_records' and tgenabled in ('O', 'A')
  );
$$;

revoke all on function public.delete_fitpulse_member_records() from public, anon, authenticated;
revoke all on function public.check_fitpulse_account_deletion(uuid, uuid) from public, anon, authenticated;
grant execute on function public.check_fitpulse_account_deletion(uuid, uuid) to service_role;

commit;
