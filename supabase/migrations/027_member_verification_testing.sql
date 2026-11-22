-- Apply after 026. The API permits this bypass only outside NODE_ENV=production.
-- Browser roles cannot execute the testing RPC or write member profiles.
begin;

alter table public.users
  add column if not exists verification_status text not null default 'unverified';

-- Do not label older accounts without an ID link as verified or testing accounts.
update public.users
set verification_status = 'verified'
where id_verification_id is not null;

alter table public.users
  add constraint users_verification_status_check
    check (verification_status in ('unverified', 'verified', 'skipped'));

comment on column public.users.verification_status is
  'Enrollment result: verified ID link, explicitly skipped for testing, or legacy/unverified.';

-- The existing verified-enrollment RPC uses an explicit INSERT column list.
-- Derive its status here without changing that RPC or the ID/face proof triggers.
create function public.set_fitpulse_member_verification_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id_verification_id is not null then
    new.verification_status := 'verified';
  elsif new.verification_status = 'verified' then
    new.verification_status := 'unverified';
  end if;
  return new;
end;
$$;

create trigger fitpulse_set_member_verification_status
before insert or update of id_verification_id, verification_status on public.users
for each row execute function public.set_fitpulse_member_verification_status();

revoke all on function public.set_fitpulse_member_verification_status()
  from public, anon, authenticated;
grant execute on function public.set_fitpulse_member_verification_status() to service_role;

-- Separate from verified enrollment: no ID records, face templates or proof calls.
-- Profile, plan dates and optional payment either all commit or all roll back.
create function public.register_fitpulse_test_member_atomic(
  p_actor_id uuid,
  p_auth_user_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_plan_id integer,
  p_record_payment boolean default false,
  p_method_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set timezone = 'UTC'
as $$
declare
  member_role_id integer;
  selected_plan public.membership_plans%rowtype;
  selected_method_id integer;
  saved_member public.users%rowtype;
  new_subscription_id uuid := gen_random_uuid();
  new_payment_id uuid;
  registration_time timestamptz := now();
  membership_end timestamptz;
begin
  if p_actor_id is null or p_auth_user_id is null or p_plan_id is null
    or nullif(btrim(p_name), '') is null or length(btrim(p_name)) > 100
    or p_email is null or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'REGISTRATION_INVALID_INPUT';
  end if;

  perform actor.id from public.users actor
  join public.roles r on r.role_id = actor.role_id
  where actor.id = p_actor_id and actor.status = 'active' and lower(r.role_name) = 'admin'
  for share of actor;
  if not found then raise exception 'REGISTRATION_FORBIDDEN'; end if;

  -- Supabase Auth has already generated and hashed the temporary password.
  perform id from auth.users
  where id = p_auth_user_id and lower(email) = lower(btrim(p_email));
  if not found then raise exception 'REGISTRATION_AUTH_USER_INVALID'; end if;

  select role_id into member_role_id from public.roles where lower(role_name) = 'member';
  if member_role_id is null then raise exception 'REGISTRATION_MEMBER_ROLE_MISSING'; end if;

  select * into selected_plan from public.membership_plans
  where plan_id = p_plan_id and is_active and duration_days > 0
    and lower(btrim(plan_name)) <> 'unlimited monthly'
  for share;
  if not found then raise exception 'REGISTRATION_PLAN_UNAVAILABLE'; end if;

  if p_record_payment is true then
    select method_id into selected_method_id from public.payment_methods
    where lower(btrim(method_name)) = lower(btrim(p_method_name))
      and lower(btrim(method_name)) in ('cash', 'gcash');
    if selected_method_id is null then
      raise exception 'REGISTRATION_PAYMENT_METHOD_UNAVAILABLE';
    end if;
  end if;

  insert into public.users (
    id, auth_user_id, role_id, name, email, phone_number, status,
    must_change_password, verification_status, created_at
  ) values (
    gen_random_uuid(), p_auth_user_id, member_role_id, btrim(p_name),
    lower(btrim(p_email)), nullif(btrim(p_phone), ''), 'active', true, 'skipped', registration_time
  ) returning * into saved_member;

  membership_end := registration_time + make_interval(days => selected_plan.duration_days);
  insert into public.subscriptions (
    subscription_id, user_id, plan_id, start_date, end_date, status, created_at
  ) values (
    new_subscription_id, saved_member.id, selected_plan.plan_id,
    registration_time, membership_end, 'active', registration_time
  );

  if p_record_payment is true then
    new_payment_id := gen_random_uuid();
    insert into public.payments (
      payment_id, subscription_id, method_id, processed_by_user_id,
      amount_paid, legacy_plan_name, created_at
    ) values (
      new_payment_id, new_subscription_id, selected_method_id, p_actor_id,
      selected_plan.price, selected_plan.plan_name, registration_time
    );
  end if;

  -- The existing /me/qr endpoint signs QR credentials from these saved plan dates.
  return jsonb_build_object(
    'member_id', saved_member.id, 'member_code', saved_member.member_code,
    'subscription_id', new_subscription_id, 'payment_id', new_payment_id,
    'plan_id', selected_plan.plan_id, 'plan_name', selected_plan.plan_name,
    'start_date', registration_time, 'end_date', membership_end, 'created_at', registration_time,
    'amount', case when p_record_payment is true then selected_plan.price else null end,
    'verification_status', saved_member.verification_status
  );
end;
$$;

revoke all on function public.register_fitpulse_test_member_atomic(
  uuid, uuid, text, text, text, integer, boolean, text
) from public, anon, authenticated;
grant execute on function public.register_fitpulse_test_member_atomic(
  uuid, uuid, text, text, text, integer, boolean, text
) to service_role;

notify pgrst, 'reload schema';
commit;
