-- Apply after migration 013. Storage files are removed through the Storage API.
begin;

create table public.member_account_deletion_audit (
  member_id uuid primary key,
  deleted_by uuid not null,
  deleted_at timestamptz not null default now(),
  photos_cleaned_at timestamptz
);

-- Preserve the audit row after either account is deleted.
alter table public.member_account_deletion_audit enable row level security;
revoke all on public.member_account_deletion_audit from public, anon, authenticated, service_role;
grant select, update (photos_cleaned_at) on public.member_account_deletion_audit to service_role;
create index member_account_deletion_pending_photos
  on public.member_account_deletion_audit (member_id) where photos_cleaned_at is null;

create function public.delete_fitpulse_member_account(
  p_actor_id uuid, p_actor_auth_version integer, p_member_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.users%rowtype;
begin
  if p_actor_id = p_member_id then
    raise exception using errcode = '42501', message = 'You cannot delete your own account.';
  end if;

  -- Recheck permission and session version under a row lock at commit time.
  perform 1 from public.users actor
  join public.roles account_role on account_role.role_id = actor.role_id
  where actor.id = p_actor_id and actor.status = 'active'
    and actor.auth_version = p_actor_auth_version and lower(account_role.role_name) = 'admin'
  for share of actor, account_role;
  if not found then
    raise exception using errcode = '42501', message = 'Administrator access is required.';
  end if;

  select * into target from public.users where id = p_member_id for update;
  if not found then
    -- A repeated request can resume photo cleanup after the database commit.
    if exists (select 1 from public.member_account_deletion_audit where member_id = p_member_id) then
      return true;
    end if;
    raise exception using errcode = 'P0002', message = 'Member account not found.';
  end if;

  perform 1 from public.roles
  where role_id = target.role_id and lower(role_name) = 'member'
  for share;
  if not found then
    raise exception using errcode = '42501', message = 'Only member accounts can be deleted here.';
  end if;

  if target.auth_user_id is null or not (
    case when target.id_verification_id is null
      then public.check_fitpulse_account_deletion(target.id, target.auth_user_id)
      else public.check_fitpulse_account_deletion_with_id(target.id, target.auth_user_id)
    end
  ) then
    raise exception using errcode = '23514', message = 'Member account cleanup is unavailable.';
  end if;

  -- The Auth foreign key cascades to the profile and the existing cleanup
  -- trigger removes history, face enrollment and dependent ID records.
  delete from auth.users where id = target.auth_user_id;
  if not found then
    raise exception using errcode = '23514', message = 'Member login is unavailable.';
  end if;

  insert into public.member_account_deletion_audit (member_id, deleted_by)
  values (p_member_id, p_actor_id);
  return true;
end;
$$;

revoke all on function public.delete_fitpulse_member_account(uuid, integer, uuid)
  from public, anon, authenticated;
grant execute on function public.delete_fitpulse_member_account(uuid, integer, uuid) to service_role;
notify pgrst, 'reload schema';

commit;
