-- FitPulse-Test: READ-ONLY integration verification.
-- Run ONLY in the FitPulse-Test Supabase SQL Editor.
-- This script does not create, modify, delete or migrate any data.

-- 1) Current database and timestamp (project URL must be confirmed in the app environment).
select current_database() as database_name, current_user as sql_role, now() as checked_at;

-- 2) Baseline counts: save these, then repeat after your UI test actions.
select 'users' as entity, count(*) as total from public.users
union all select 'subscriptions', count(*) from public.subscriptions
union all select 'payments', count(*) from public.payments
union all select 'attendance_logs', count(*) from public.attendance_logs
union all select 'gym_equipment', count(*) from public.gym_equipment
union all select 'gym_maintenance', count(*) from public.gym_maintenance
union all select 'membership_plans', count(*) from public.membership_plans
union all select 'payment_methods', count(*) from public.payment_methods
order by entity;

-- 3) Existing role/account states (aggregate only; no personal information returned).
select r.role_name, u.status, count(*) as accounts
from public.users u
join public.roles r on r.role_id = u.role_id
group by r.role_name, u.status
order by r.role_name, u.status;

-- 4) Active membership plans and allowed payment methods.
select plan_id, plan_name, duration_days, price, is_active
from public.membership_plans
order by plan_id;
select method_id, method_name from public.payment_methods order by method_id;

-- 5) Orphan/incomplete-record counts. Ideally all orphan columns are zero.
select
  (select count(*) from public.users u
     left join auth.users a on a.id = u.auth_user_id
     where u.auth_user_id is not null and a.id is null) as profile_auth_link_orphans,
  (select count(*) from public.subscriptions s
     left join public.users u on u.id = s.user_id
     where u.id is null) as subscription_without_member,
  (select count(*) from public.payments p
     left join public.subscriptions s on s.subscription_id = p.subscription_id
     where s.subscription_id is null) as payment_without_subscription,
  (select count(*) from public.attendance_logs a
     left join public.users u on u.id = a.user_id
     where u.id is null) as attendance_without_member,
  (select count(*) from public.gym_maintenance m
     left join public.gym_equipment e on e.id = m.equipment_id
     where m.equipment_id is not null and e.id is null) as maintenance_without_equipment;

-- 6) RPC availability/permissions. Service role should execute backend-only RPCs,
--    but anon/authenticated should not. Note the absence of reactivation after migration 018.
select
  p.proname as rpc,
  p.prosecdef as security_definer,
  has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_allowed,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_allowed,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_allowed
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'record_fitpulse_checkin',
    'renew_fitpulse_membership_atomic',
    'update_fitpulse_member_details_atomic',
    'begin_fitpulse_member_password_change',
    'finish_fitpulse_member_password_change',
    'deactivate_fitpulse_member_atomic',
    'reactivate_fitpulse_member_atomic'
  )
order by p.proname;
