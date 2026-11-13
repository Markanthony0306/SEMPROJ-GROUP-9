begin;

alter table public.face_enrollments add column id_portrait_encrypted text;

-- A profile update can carry a stale snapshot of auth_version. An older write
-- must never restore access after ID replacement, deletion, or provisioning.
create function public.keep_fitpulse_auth_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.auth_version := greatest(old.auth_version, new.auth_version);
  return new;
end;
$$;

create trigger fitpulse_keep_auth_version
before update of auth_version on public.users
for each row execute function public.keep_fitpulse_auth_version();

revoke all on function public.keep_fitpulse_auth_version() from public, anon, authenticated;
grant execute on function public.keep_fitpulse_auth_version() to service_role;

-- Keep one transactional enrollment writer, with an extra argument only the
-- server operator supplies when provisioning an administrator's ID portrait.
drop function public.save_fitpulse_face_enrollment(uuid, uuid[], text);

create function public.save_fitpulse_face_enrollment(
  p_user_id uuid,
  p_checked_ids uuid[],
  p_encrypted_descriptor text,
  p_admin_id_portrait text default null
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  active_ids uuid[];
  account_role text;
  id_portrait text;
begin
  select lower(r.role_name) into account_role
    from public.users u
    join public.roles r on r.role_id = u.role_id
    where u.id = p_user_id and u.status = 'active'
    for update of u;
  if account_role is null or (p_admin_id_portrait is not null and account_role <> 'admin') then
    raise exception using errcode = '23514', message = 'An eligible face enrollment account is required';
  end if;

  lock table public.face_enrollments in share row exclusive mode;
  select coalesce(array_agg(enrollment_id order by enrollment_id), '{}'::uuid[])
    into active_ids
    from public.face_enrollments
    where status = 'active';
  if active_ids is distinct from p_checked_ids then
    return false;
  end if;

  if account_role = 'admin' then
    select id_portrait_encrypted into id_portrait from public.face_enrollments
      where user_id = p_user_id and status = 'active';
    id_portrait := coalesce(p_admin_id_portrait, id_portrait);
    if id_portrait is null then
      raise exception using errcode = '23514', message = 'Administrator ID provisioning is required';
    end if;
  end if;

  delete from public.face_enrollments where user_id = p_user_id and status = 'active';
  insert into public.face_enrollments
    (user_id, provider, provider_reference, status, consented_at, descriptor_encrypted, id_portrait_encrypted)
  values
    (p_user_id, 'face-api.js', 'local-aes-256-gcm-v1', 'active', now(), p_encrypted_descriptor, id_portrait);

  if p_admin_id_portrait is not null then
    update public.users set auth_version = coalesce(auth_version, 0) + 1 where id = p_user_id;
  end if;
  return true;
end;
$$;

revoke all on function public.save_fitpulse_face_enrollment(uuid, uuid[], text, text)
  from public, anon, authenticated;
grant execute on function public.save_fitpulse_face_enrollment(uuid, uuid[], text, text)
  to service_role;

commit;
