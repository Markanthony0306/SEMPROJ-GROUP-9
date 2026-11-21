-- Remove biometric templates, ID document proofs, review history, and their API RPCs.
-- Applying this migration permanently removes any stored face and ID verification data.
begin;

do $$
declare
  target record;
begin
  for target in
    select p.oid::regprocedure as signature
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'save_fitpulse_face_enrollment',
        'audit_fitpulse_member_id_verification',
        'link_fitpulse_member_id_verification',
        'guard_fitpulse_id_rejections',
        'reset_fitpulse_id_rejections',
        'save_fitpulse_member_id_files',
        'cleanup_fitpulse_member_id_review',
        'create_fitpulse_enrolled_member'
      )
  loop
    execute format('drop function if exists %s cascade', target.signature);
  end loop;
end;
$$;

drop table if exists public.member_id_verification_files cascade;
drop table if exists public.member_id_verification_events cascade;
drop table if exists public.member_id_rejected_emails cascade;
drop table if exists public.member_id_verifications cascade;
drop table if exists public.face_enrollments cascade;

alter table public.users
  drop column if exists id_verification_id,
  drop column if exists id_verification_actor;

-- Refresh the account-deletion trigger body without the retired cleanup branch.
create or replace function public.delete_fitpulse_member_records()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.roles
    where role_id = old.role_id and lower(role_name) in ('member', 'user')
  ) then
    delete from public.payments payment
    using public.subscriptions subscription
    where payment.subscription_id = subscription.subscription_id
      and subscription.user_id = old.id;
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
end;
$$;

revoke all on function public.delete_fitpulse_member_records() from public, anon, authenticated;

commit;

notify pgrst, 'reload schema';
