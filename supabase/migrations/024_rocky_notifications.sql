begin;

create table public.rocky_notifications (
  sequence_id bigint generated always as identity primary key,
  event_id text not null unique,
  staff_only boolean not null,
  user_id uuid references public.users(id) on delete cascade,
  event jsonb not null,
  created_at timestamptz not null default now(),
  check (staff_only = (user_id is null))
);

create index rocky_notifications_staff_idx on public.rocky_notifications (sequence_id) where staff_only;
create index rocky_notifications_user_idx on public.rocky_notifications (user_id, sequence_id) where not staff_only;

alter table public.rocky_notifications enable row level security;
revoke all on public.rocky_notifications from public, anon, authenticated;
grant select, insert on public.rocky_notifications to service_role;
grant usage on sequence public.rocky_notifications_sequence_id_seq to service_role;

create function public.insert_rocky_notification(p_id text, p_staff boolean, p_user uuid, p_event jsonb)
returns timestamptz
language plpgsql
set search_path = ''
as $$
declare
  saved_at timestamptz;
begin
  -- Keep the history cursor in commit order even when requests overlap.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('fitpulse-rocky-notifications', 0));
  insert into public.rocky_notifications (event_id, staff_only, user_id, event, created_at)
  values (p_id, p_staff, p_user, p_event, clock_timestamp())
  on conflict (event_id) do nothing
  returning created_at into saved_at;
  return saved_at;
end;
$$;

revoke all on function public.insert_rocky_notification(text, boolean, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.insert_rocky_notification(text, boolean, uuid, jsonb) to service_role;
notify pgrst, 'reload schema';

commit;
