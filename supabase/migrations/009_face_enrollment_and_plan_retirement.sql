-- Keep historical subscriptions and payments linked to their original plan.
update public.membership_plans
set is_active = false
where lower(btrim(plan_name)) = 'unlimited monthly';

-- The API compares decrypted templates. Commit only if the set it compared
-- is still current, so concurrent enrollments cannot both claim the same face.
create or replace function public.save_fitpulse_face_enrollment(
  p_user_id uuid,
  p_checked_ids uuid[],
  p_encrypted_descriptor text
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  active_ids uuid[];
begin
  lock table public.face_enrollments in share row exclusive mode;
  select coalesce(array_agg(enrollment_id order by enrollment_id), '{}'::uuid[])
    into active_ids
    from public.face_enrollments
    where status = 'active';
  if active_ids is distinct from p_checked_ids then
    return false;
  end if;

  delete from public.face_enrollments where user_id = p_user_id and status = 'active';
  insert into public.face_enrollments
    (user_id, provider, provider_reference, status, consented_at, descriptor_encrypted)
  values
    (p_user_id, 'face-api.js', 'local-aes-256-gcm-v1', 'active', now(), p_encrypted_descriptor);
  return true;
end;
$$;

revoke all on function public.save_fitpulse_face_enrollment(uuid, uuid[], text)
  from public, anon, authenticated;
grant execute on function public.save_fitpulse_face_enrollment(uuid, uuid[], text)
  to service_role;
