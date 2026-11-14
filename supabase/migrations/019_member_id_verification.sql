begin;

create table public.member_id_verifications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid unique references public.users(id) on delete cascade,
  applicant_name text not null,
  applicant_email text not null,
  id_type text check (id_type in ('passport', 'drivers_license', 'national_id', 'student_id')),
  id_number text, -- AES-GCM ciphertext, never the plaintext number
  id_fingerprint text, -- keyed fingerprint used for duplicate detection
  expiry_date date,
  verification_status text not null default 'awaiting_document' check (
    verification_status in ('awaiting_document', 'reading_document', 'awaiting_face',
      'checking_face', 'verified', 'needs_review', 'rejected', 'approved')
  ),
  face_match_score integer check (face_match_score between 0 and 100),
  document_attempts integer not null default 0 check (document_attempts between 0 and 3),
  attempts integer not null default 0 check (attempts between 0 and 3),
  reviewed_by uuid references public.users(id) on delete set null,
  review_notes text check (length(review_notes) <= 600),
  reasons text[] not null default '{}',
  document_passed boolean not null default false,
  consented_at timestamptz not null default now(),
  opened_by uuid not null,
  updated_by uuid not null,
  event text not null default 'consent_recorded',
  revision integer not null default 0,
  updated_at timestamptz not null default now(),
  check (verification_status not in ('verified', 'approved') or
    (id_type is not null and id_number is not null and id_fingerprint is not null))
);

create unique index fitpulse_open_id_verification_email
  on public.member_id_verifications (applicant_email) where member_id is null;
create unique index fitpulse_member_document_unique
  on public.member_id_verifications (id_fingerprint) where member_id is not null;
create index fitpulse_id_verification_review_queue
  on public.member_id_verifications (updated_at desc) where member_id is null;

create table public.member_id_verification_events (
  id bigint generated always as identity primary key,
  verification_id uuid not null,
  actor_id uuid not null,
  occurred_at timestamptz not null default now(),
  event text not null,
  result text not null,
  document_attempts integer not null,
  face_attempts integer not null,
  reasons text[] not null
);
create index fitpulse_id_verification_event_history
  on public.member_id_verification_events (verification_id, occurred_at);

alter table public.member_id_verifications enable row level security;
alter table public.member_id_verification_events enable row level security;
revoke all on public.member_id_verifications, public.member_id_verification_events
  from public, anon, authenticated, service_role;
grant select, insert, update on public.member_id_verifications to service_role;
grant select, insert on public.member_id_verification_events to service_role;
grant usage, select on sequence public.member_id_verification_events_id_seq to service_role;

create function public.audit_fitpulse_member_id_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
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

create trigger fitpulse_audit_member_id_verification
before insert or update on public.member_id_verifications
for each row execute function public.audit_fitpulse_member_id_verification();

-- FitPulse-Test already has these columns and a UNIQUE constraint backed by
-- users_id_verification_id_key. Preserve them rather than re-adding columns.
alter table public.users
  add column if not exists id_verification_id uuid,
  add column if not exists id_verification_actor uuid;

-- On a fresh test database, enforce the same uniqueness rule. In FitPulse-Test
-- this index already exists as the backing index of the current constraint.
create unique index if not exists users_id_verification_id_key
  on public.users (id_verification_id);

-- Link the approval in the same database transaction as the new profile.
-- A duplicate document or a concurrently consumed approval rolls back the insert.
create function public.link_fitpulse_member_id_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.id_verification_id is distinct from old.id_verification_id or
      new.id_verification_actor is distinct from old.id_verification_actor then
      raise exception using errcode = '23514', message = 'Member ID verification link cannot be changed';
    end if;
    return new;
  end if;
  if new.id_verification_id is null then return new; end if;

  update public.member_id_verifications v
  set member_id = new.id, updated_by = new.id_verification_actor, event = 'member_created'
  where v.id = new.id_verification_id and v.member_id is null
    and v.verification_status in ('verified', 'approved')
    and v.applicant_email = lower(btrim(new.email)) and v.applicant_name = btrim(new.name)
    and (v.expiry_date is null or v.expiry_date >= (now() at time zone 'Asia/Manila')::date)
    and exists (
      select 1 from public.users actor
      join public.roles r on r.role_id = actor.role_id
      where actor.id = new.id_verification_actor and actor.status = 'active'
        and (lower(r.role_name) = 'admin' or
          (lower(r.role_name) = 'staff' and v.opened_by = actor.id))
    );
  if not found then
    raise exception using errcode = '23514', message = 'An available ID approval is required';
  end if;
  return new;
end;
$$;

create trigger fitpulse_link_member_id_verification
after insert or update of id_verification_id, id_verification_actor on public.users
for each row execute function public.link_fitpulse_member_id_verification();

revoke all on function public.audit_fitpulse_member_id_verification() from public, anon, authenticated;
revoke all on function public.link_fitpulse_member_id_verification() from public, anon, authenticated;
grant execute on function public.audit_fitpulse_member_id_verification() to service_role;
grant execute on function public.link_fitpulse_member_id_verification() to service_role;

commit;
