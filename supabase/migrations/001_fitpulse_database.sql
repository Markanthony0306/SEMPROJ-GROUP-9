-- FitPulse app additions to the existing normalized Supabase schema.
-- Memberships, payments, and attendance stay in the existing tables:
-- subscriptions, payments, and attendance_logs.

insert into public.roles (role_name)
select required.role_name
from (values ('admin'), ('member'), ('staff')) as required(role_name)
where not exists (
  select 1 from public.roles existing
  where lower(existing.role_name) = lower(required.role_name)
);

alter table public.users add column if not exists auth_user_id uuid;
alter table public.users add column if not exists member_code text;
alter table public.users add column if not exists emergency_contact text;
alter table public.users add column if not exists status text not null default 'active';
alter table public.users add column if not exists must_change_password boolean not null default false;
alter table public.users add column if not exists auth_version integer not null default 0;
alter table public.users add column if not exists avatar_path text;
alter table public.users add column if not exists created_at timestamptz not null default now();

alter table public.users alter column member_code set default (
  'FP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
);
update public.users
set member_code = 'FP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where member_code is null or member_code = '';

create unique index if not exists users_auth_user_id_unique on public.users(auth_user_id);
create unique index if not exists users_member_code_unique on public.users(member_code) where member_code is not null;
create unique index if not exists users_email_lower_unique on public.users(lower(email));
create unique index if not exists roles_role_name_lower_unique on public.roles(lower(role_name));

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.users'::regclass
      and conname = 'users_auth_user_id_fkey'
  ) then
    alter table public.users
      add constraint users_auth_user_id_fkey
      foreign key (auth_user_id) references auth.users(id) on delete cascade;
  end if;
end
$$;

-- The project already has this normalized table. Do not create a parallel
-- attendance_records table.
create unique index if not exists attendance_device_request_unique
  on public.attendance_logs(device_id, request_id)
  where device_id is not null and request_id is not null;
create index if not exists attendance_user_time_idx
  on public.attendance_logs(user_id, check_in_time desc);

-- Preserve existing entry types while allowing the values used by this app.
do $$
declare
  current_definition text;
  current_expression text;
begin
  select pg_get_constraintdef(oid)
    into current_definition
  from pg_constraint
  where conrelid = 'public.attendance_logs'::regclass
    and conname = 'attendance_logs_entry_type_check';

  if current_definition is null then
    alter table public.attendance_logs
      add constraint attendance_logs_entry_type_check
      check (entry_type in ('ESP32-CAM', 'Staff', 'Demo'));
  elsif current_definition not like '%ESP32-CAM%'
     or current_definition not like '%Staff%'
     or current_definition not like '%Demo%' then
    current_expression := substr(current_definition, 8, length(current_definition) - 8);
    alter table public.attendance_logs drop constraint attendance_logs_entry_type_check;
    execute format(
      'alter table public.attendance_logs add constraint attendance_logs_entry_type_check check ((%s) or entry_type in (%L, %L, %L))',
      current_expression,
      'ESP32-CAM',
      'Staff',
      'Demo'
    );
  end if;
end
$$;

create or replace function public.record_fitpulse_checkin(
  p_member_id uuid,
  p_member_name text,
  p_date timestamptz,
  p_source text,
  p_device_id text,
  p_request_id text,
  p_qr_token_id text
)
returns table (result_code text, attendance_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  prior public.attendance_logs%rowtype;
  new_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_member_id::text, 0));

  select * into prior
  from public.attendance_logs
  where device_id = p_device_id and request_id = p_request_id;

  if found then
    if prior.qr_token_id = p_qr_token_id and prior.user_id = p_member_id then
      return query select 'ALREADY_RECORDED'::text, prior.attendance_id;
    else
      return query select 'REQUEST_CONFLICT'::text, null::uuid;
    end if;
    return;
  end if;

  if exists (
    select 1 from public.attendance_logs
    where user_id = p_member_id and check_in_time > now() - interval '60 seconds'
  ) then
    return query select 'CHECK_IN_COOLDOWN'::text, null::uuid;
    return;
  end if;

  insert into public.attendance_logs (
    user_id, member_name, check_in_time, entry_type, device_id, request_id, qr_token_id
  ) values (
    p_member_id, p_member_name, p_date, p_source, p_device_id, p_request_id, p_qr_token_id
  ) returning attendance_id into new_id;

  return query select 'CHECK_IN_RECORDED'::text, new_id;
end
$$;

revoke all on function public.record_fitpulse_checkin(uuid, text, timestamptz, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_fitpulse_checkin(uuid, text, timestamptz, text, text, text, text)
  to service_role;

-- Keep using the existing payment -> subscription -> member relationship.
create index if not exists payments_subscription_created_idx
  on public.payments(subscription_id, created_at desc);
create index if not exists subscriptions_user_created_idx
  on public.subscriptions(user_id, created_at desc);

create table if not exists public.gym_equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Other',
  condition text not null default 'Good'
    check (condition in ('Good', 'Needs Maintenance', 'Out of Service')),
  last_inspected timestamptz
);

create table if not exists public.gym_maintenance (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid references public.gym_equipment(id) on delete set null,
  item text not null,
  note text not null,
  date timestamptz not null default now()
);

create index if not exists gym_maintenance_date_idx
  on public.gym_maintenance(date desc);

create table if not exists public.gym_settings (
  id integer primary key check (id = 1),
  gym_name text not null default 'FitPulse Gym',
  reminder_days integer not null default 7 check (reminder_days between 1 and 30),
  email_enabled boolean not null default true
);

-- A pre-existing gym_settings table may not have the default declared above.
alter table public.gym_settings
  alter column gym_name set default 'FitPulse Gym';
update public.gym_settings
set gym_name = 'FitPulse Gym'
where gym_name is null or btrim(gym_name) = '';

insert into public.gym_settings (id) values (1) on conflict (id) do nothing;

alter table public.users enable row level security;
alter table public.roles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.membership_plans enable row level security;
alter table public.payment_methods enable row level security;
alter table public.payments enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.gym_equipment enable row level security;
alter table public.gym_maintenance enable row level security;
alter table public.gym_settings enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 262144, array['image/jpeg'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
