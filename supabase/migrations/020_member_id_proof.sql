begin;

alter table public.member_id_verifications
  add column has_documents boolean not null default false,
  add column face_enrolled boolean not null default false,
  add column staged_face_encrypted text,
  drop constraint member_id_verifications_document_attempts_check,
  add check (document_attempts >= 0),
  add check (not face_enrolled or member_id is not null or staged_face_encrypted is not null);

create index fitpulse_id_reviews_recent
  on public.member_id_verifications (updated_at desc, id);

-- Private bytea rows keep the review and its encrypted files in one transaction.
create table public.member_id_verification_files (
  verification_id uuid not null references public.member_id_verifications(id) on delete cascade,
  side text not null check (side in ('front', 'back', 'document')),
  mime_type text not null,
  encrypted_file bytea not null check (octet_length(encrypted_file) between 29 and 5242908),
  primary key (verification_id, side),
  check (
    (side in ('front', 'back') and mime_type in ('image/jpeg', 'image/png')) or
    (side = 'document' and mime_type in (
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ))
  )
);

create table public.member_id_rejected_emails (
  email text primary key check (email = lower(btrim(email))),
  rejected_attempts integer not null check (rejected_attempts between 1 and 5)
);

-- Preserve known rejected attempts from the previous audit trail.
insert into public.member_id_rejected_emails (email, rejected_attempts)
select lower(btrim(v.applicant_email)), least(count(*), 5)::integer
from public.member_id_verification_events e
join public.member_id_verifications v on v.id = e.verification_id
where e.result = 'rejected' and e.event in (
  'manual_reject', 'document_attempt_finished', 'face_attempt_finished'
)
group by lower(btrim(v.applicant_email));

alter table public.member_id_verification_files enable row level security;
alter table public.member_id_rejected_emails enable row level security;
revoke all on public.member_id_verification_files, public.member_id_rejected_emails
  from public, anon, authenticated, service_role;
grant select, insert, delete on public.member_id_verification_files to service_role;
grant select, insert, update, delete on public.member_id_rejected_emails to service_role;
grant delete on public.member_id_verifications, public.member_id_verification_events to service_role;

create function public.guard_fitpulse_id_rejections(p_email text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('fitpulse-id:' || p_email, 0));
  if exists (
    select 1 from public.member_id_rejected_emails
    where email = p_email and rejected_attempts >= 5
  ) then
    raise exception using errcode = 'P5405', message = 'Member ID rejection limit reached';
  end if;
end;
$$;

create or replace function public.audit_fitpulse_member_id_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.applicant_email := lower(btrim(new.applicant_email));
    -- The open-case unique index serializes inserts for this email. Avoid
    -- taking an email lock before waiting on a concurrent review's row lock.
    if new.member_id is null and exists (
      select 1 from public.member_id_rejected_emails
      where email = new.applicant_email and rejected_attempts >= 5
    ) then
      raise exception using errcode = 'P5405', message = 'Member ID rejection limit reached';
    end if;
  else
    new.revision := old.revision + 1;
    new.updated_at := now();
    if old.member_id is null then
      perform public.guard_fitpulse_id_rejections(new.applicant_email);
      if new.event = 'manual_reject' and new.verification_status = 'rejected'
        and old.verification_status is distinct from 'rejected' then
        insert into public.member_id_rejected_emails (email, rejected_attempts)
        values (new.applicant_email, 1)
        on conflict (email) do update
        set rejected_attempts = member_id_rejected_emails.rejected_attempts + 1;
      end if;
    end if;
  end if;
  insert into public.member_id_verification_events
    (verification_id, actor_id, event, result, document_attempts, face_attempts, reasons)
  values (new.id, new.updated_by, new.event, new.verification_status,
    new.document_attempts, new.attempts, new.reasons);
  return new;
end;
$$;

create function public.reset_fitpulse_id_rejections(p_email text, p_actor uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.users u
    join public.roles r on r.role_id = u.role_id
    where u.id = p_actor and u.status = 'active' and lower(r.role_name) = 'admin'
  ) then
    raise exception using errcode = '42501', message = 'Administrator access is required';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('fitpulse-id:' || lower(btrim(p_email)), 0)
  );
  delete from public.member_id_rejected_emails where email = lower(btrim(p_email));
end;
$$;

create function public.save_fitpulse_member_id_files(
  p_id uuid, p_revision integer, p_actor uuid, p_id_type text, p_files jsonb,
  p_member_id uuid default null
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  actor_role text;
  target_member public.users%rowtype;
  current_case public.member_id_verifications%rowtype;
  front_count integer;
  back_count integer;
  document_count integer;
begin
  select lower(r.role_name) into actor_role
  from public.users u join public.roles r on r.role_id = u.role_id
  where u.id = p_actor and u.status = 'active';
  if actor_role is null or actor_role not in ('admin', 'staff')
    or (p_member_id is not null and actor_role <> 'admin') then
    raise exception using errcode = '42501', message = 'Administrator or staff access is required';
  end if;
  if p_member_id is not null then
    select u.* into target_member
    from public.users u join public.roles r on r.role_id = u.role_id
    where u.id = p_member_id and lower(r.role_name) in ('member', 'user')
    for update of u;
    if not found then return false; end if;
  end if;

  select * into current_case from public.member_id_verifications where id = p_id for update;
  if not found and p_member_id is not null and p_revision is null then
    insert into public.member_id_verifications
      (id, member_id, applicant_name, applicant_email, opened_by, updated_by, event)
    values (p_id, p_member_id, target_member.name, target_member.email, p_actor, p_actor, 'recovery_started')
    returning * into current_case;
  elsif not found or current_case.revision is distinct from p_revision
    or current_case.member_id is distinct from p_member_id
    or (actor_role = 'staff' and current_case.opened_by <> p_actor) then
    return false;
  end if;

  select count(*) filter (where item->>'side' = 'front'),
    count(*) filter (where item->>'side' = 'back'),
    count(*) filter (where item->>'side' = 'document')
  into front_count, back_count, document_count
  from jsonb_array_elements(p_files) as files(item);
  if p_files is null or not (
    (jsonb_array_length(p_files) = 2 and front_count = 1 and back_count = 1)
    or (jsonb_array_length(p_files) = 1 and document_count = 1)
  ) then
    raise exception using errcode = '23514', message = 'Both sides of the ID are required';
  end if;

  delete from public.member_id_verification_files where verification_id = p_id;
  insert into public.member_id_verification_files (verification_id, side, mime_type, encrypted_file)
  select p_id, item->>'side', item->>'mime_type', pg_catalog.decode(item->>'ciphertext', 'base64')
  from jsonb_array_elements(p_files) as files(item);

  update public.member_id_verifications set
    id_type = p_id_type,
    document_attempts = document_attempts + 1,
    has_documents = true,
    document_passed = false,
    staged_face_encrypted = null,
    face_enrolled = p_member_id is not null and face_enrolled,
    verification_status = 'awaiting_face',
    id_number = null,
    id_fingerprint = null,
    expiry_date = null,
    face_match_score = null,
    reviewed_by = null,
    review_notes = null,
    reasons = '{}',
    updated_by = p_actor,
    event = case when p_member_id is null then 'document_uploaded' else 'member_document_replaced' end
  where id = p_id;

  if p_member_id is not null then
    update public.users set id_verification_id = p_id, id_verification_actor = p_actor,
      auth_version = coalesce(auth_version, 0) + 1
    where id = p_member_id;
  end if;
  return true;
end;
$$;

-- Finalize the staged face with the member profile. Failure rolls back both
-- records, leaving the open submission available for a retry.
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
  if new.id_verification_id is null then
    if exists (
      select 1 from public.roles where role_id = new.role_id and lower(role_name) in ('member', 'user')
    ) then perform public.guard_fitpulse_id_rejections(lower(btrim(new.email))); end if;
    return new;
  end if;

  select v.staged_face_encrypted into staged_descriptor
  from public.member_id_verifications v
  where v.id = new.id_verification_id and v.member_id is null
    and v.verification_status in ('awaiting_face', 'verified', 'approved')
    and v.has_documents and v.face_enrolled
    and v.applicant_email = lower(btrim(new.email)) and v.applicant_name = btrim(new.name)
    and (v.expiry_date is null or v.expiry_date >= (now() at time zone 'Asia/Manila')::date)
    and exists (
      select 1 from public.users actor
      join public.roles r on r.role_id = actor.role_id
      where actor.id = new.id_verification_actor and actor.status = 'active'
        and (lower(r.role_name) = 'admin' or (lower(r.role_name) = 'staff' and v.opened_by = actor.id))
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

create function public.cleanup_fitpulse_member_id_review()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.member_id_verification_events where verification_id = old.id;
  -- User deletion already removed the profile. A direct ID review deletion
  -- clears its link so that the surviving profile needs a fresh proof.
  update public.users set id_verification_id = null, id_verification_actor = null,
    auth_version = coalesce(auth_version, 0) + 1
  where id = old.member_id and id_verification_id = old.id;
  return old;
end;
$$;

create trigger fitpulse_cleanup_member_id_review
after delete on public.member_id_verifications
for each row execute function public.cleanup_fitpulse_member_id_review();

revoke all on function public.guard_fitpulse_id_rejections(text),
  public.reset_fitpulse_id_rejections(text, uuid),
  public.save_fitpulse_member_id_files(uuid, integer, uuid, text, jsonb, uuid),
  public.cleanup_fitpulse_member_id_review()
  from public, anon, authenticated;
grant execute on function public.guard_fitpulse_id_rejections(text),
  public.reset_fitpulse_id_rejections(text, uuid),
  public.save_fitpulse_member_id_files(uuid, integer, uuid, text, jsonb, uuid),
  public.cleanup_fitpulse_member_id_review()
  to service_role;

commit;
