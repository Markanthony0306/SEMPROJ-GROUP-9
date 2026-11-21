-- Apply in Supabase SQL Editor. Non-destructive: existing accounts/payments are preserved.
begin;

insert into public.payment_methods (method_name)
select needed.name
from (values ('Cash'), ('GCash')) as needed(name)
where not exists (
  select 1 from public.payment_methods method
  where lower(btrim(method.method_name)) = lower(needed.name)
);

create table if not exists public.fitpulse_identity_policy (
  id integer primary key check (id = 1),
  enforced_from timestamptz not null default now()
);
insert into public.fitpulse_identity_policy (id) values (1) on conflict (id) do nothing;

create table if not exists public.face_enrollments (
  user_id uuid primary key references public.users(id) on delete cascade,
  embedding double precision[] not null check (array_length(embedding, 1) = 128),
  id_type text not null check (id_type in ('philid', 'ephilid', 'drivers_license', 'passport', 'umid')),
  created_at timestamptz not null default now()
);
alter table public.face_enrollments enable row level security;
revoke all on public.face_enrollments from anon, authenticated;
revoke all on public.fitpulse_identity_policy from anon, authenticated;
grant select, insert, update, delete on public.face_enrollments to service_role;
grant select on public.fitpulse_identity_policy to service_role;

-- Calls the already-installed registration RPC in the SAME database transaction,
-- then inserts the verified facial template. Failure rolls the entire transaction back.
create or replace function public.register_fitpulse_member_with_face_atomic(
  p_actor_id uuid, p_auth_user_id uuid, p_name text, p_email text, p_phone text,
  p_plan_id integer, p_record_payment boolean, p_method_name text,
  p_embedding double precision[], p_id_type text
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  registration jsonb;
begin
  if p_embedding is null or array_length(p_embedding, 1) is distinct from 128 or
    p_id_type not in ('philid', 'ephilid', 'drivers_license', 'passport', 'umid') then
    raise exception 'REGISTRATION_FACE_INVALID' using errcode = 'P0001';
  end if;

  select to_jsonb(public.register_fitpulse_member_atomic(
    p_actor_id => p_actor_id, p_auth_user_id => p_auth_user_id,
    p_name => p_name, p_email => p_email, p_phone => p_phone,
    p_plan_id => p_plan_id, p_record_payment => p_record_payment,
    p_method_name => p_method_name
  )) into registration;

  if registration is null or registration->>'member_id' is null then
    raise exception 'REGISTRATION_INVALID_RESULT' using errcode = 'P0001';
  end if;

  insert into public.face_enrollments (user_id, embedding, id_type)
  values ((registration->>'member_id')::uuid, p_embedding, p_id_type);
  return registration;
end;
$$;
revoke all on function public.register_fitpulse_member_with_face_atomic(
  uuid, uuid, text, text, text, integer, boolean, text, double precision[], text
) from public, anon, authenticated;
grant execute on function public.register_fitpulse_member_with_face_atomic(
  uuid, uuid, text, text, text, integer, boolean, text, double precision[], text
) to service_role;

commit;
notify pgrst, 'reload schema';
