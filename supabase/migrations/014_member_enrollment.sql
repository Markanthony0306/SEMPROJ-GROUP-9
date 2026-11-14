-- Each enrollment has its own draft. Only completed user accounts reserve email.
begin;

alter table public.member_id_verifications
  drop constraint member_id_verifications_id_type_check,
  add constraint member_id_verifications_id_type_check
    check (id_type in ('passport', 'drivers_license', 'national_id', 'student_id',
      'senior_id', 'sss_id', 'pwd_id'));

drop index public.fitpulse_open_id_verification_email;
drop index public.fitpulse_id_verification_review_queue;

create or replace function public.audit_fitpulse_member_id_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.applicant_email := lower(btrim(new.applicant_email));
  if tg_op = 'UPDATE' then
    new.revision := old.revision + 1;
    new.updated_at := now();
  end if;
  insert into public.member_id_verification_events
    (verification_id, actor_id, event, result, document_attempts, face_attempts, reasons)
  values (new.id, new.updated_by, new.event, new.verification_status,
    new.document_attempts, new.attempts, new.reasons);
  return new;
end;
$$;

create or replace function public.link_fitpulse_member_id_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  staged_descriptor text;
begin
  if tg_op = 'UPDATE' then
    if new.id_verification_id is not distinct from old.id_verification_id and
      new.id_verification_actor is not distinct from old.id_verification_actor then
      return new;
    end if;
    if new.id_verification_id is null and new.id_verification_actor is null and not exists (
      select 1 from public.member_id_verifications where id = old.id_verification_id
    ) then return new; end if;
    if exists (
      select 1 from public.member_id_verifications v
      join public.users actor on actor.id = new.id_verification_actor
      join public.roles r on r.role_id = actor.role_id
      where v.id = new.id_verification_id and v.member_id = new.id and v.has_documents
        and v.event = 'member_document_replaced'
        and actor.status = 'active' and lower(r.role_name) = 'admin'
    ) then return new; end if;
    raise exception using errcode = '23514', message = 'Member ID verification link cannot be changed';
  end if;
  if new.id_verification_id is null then return new; end if;

  select v.staged_face_encrypted into staged_descriptor
  from public.member_id_verifications v
  where v.id = new.id_verification_id and v.member_id is null
    and v.verification_status = 'awaiting_face' and v.document_passed
    and v.has_documents and v.face_enrolled
    and v.applicant_email = lower(btrim(new.email)) and v.applicant_name = btrim(new.name)
    and (v.expiry_date is null or v.expiry_date >= (now() at time zone 'Asia/Manila')::date)
    and exists (
      select 1 from public.users actor
      join public.roles r on r.role_id = actor.role_id
      where actor.id = new.id_verification_actor and actor.status = 'active'
        and lower(r.role_name) = 'admin' and v.opened_by = actor.id
    )
  for update;
  if staged_descriptor is null then
    raise exception using errcode = '23514', message = 'ID files and face enrollment are required';
  end if;
  update public.member_id_verifications
    set member_id = new.id, updated_by = new.id_verification_actor,
      event = 'member_created', staged_face_encrypted = null
    where id = new.id_verification_id;
  insert into public.face_enrollments
    (user_id, provider, provider_reference, status, consented_at, descriptor_encrypted)
  values (new.id, 'face-api.js', 'local-aes-256-gcm-v1', 'active', now(), staged_descriptor);
  return new;
end;
$$;

-- Keep the profile, face enrollment trigger, subscription and payment in one
-- transaction. An Auth-only row can be safely reused if this transaction fails.
create function public.create_fitpulse_enrolled_member(
  p_profile jsonb, p_subscription jsonb, p_payment jsonb default null
)
returns setof public.users
language plpgsql
set search_path = ''
as $$
declare
  profile public.users%rowtype := jsonb_populate_record(null::public.users, p_profile);
  subscription public.subscriptions%rowtype :=
    jsonb_populate_record(null::public.subscriptions, p_subscription);
  payment public.payments%rowtype := jsonb_populate_record(null::public.payments, p_payment);
begin
  if profile.id_verification_id is null or profile.auth_user_id is null then
    raise exception using errcode = '23514', message = 'Member verification is required';
  end if;

  insert into public.users (
    id, auth_user_id, role_id, name, email, phone_number, status, must_change_password,
    id_verification_id, id_verification_actor, created_at
  ) values (
    profile.id, profile.auth_user_id, profile.role_id, profile.name, profile.email,
    profile.phone_number, 'active', profile.must_change_password, profile.id_verification_id,
    profile.id_verification_actor, profile.created_at
  ) returning * into profile;

  insert into public.subscriptions (
    subscription_id, user_id, plan_id, start_date, end_date, status, created_at
  ) values (
    subscription.subscription_id, profile.id, subscription.plan_id, subscription.start_date,
    subscription.end_date, 'active', profile.created_at
  );

  if p_payment is not null then
    insert into public.payments (
      payment_id, subscription_id, method_id, processed_by_user_id, amount_paid,
      created_at, legacy_plan_name
    ) values (
      payment.payment_id, subscription.subscription_id, payment.method_id,
      profile.id_verification_actor, payment.amount_paid, profile.created_at, payment.legacy_plan_name
    );
  end if;

  return next profile;
end;
$$;

revoke all on function public.create_fitpulse_enrolled_member(jsonb, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_fitpulse_enrolled_member(jsonb, jsonb, jsonb)
  to service_role;

commit;
