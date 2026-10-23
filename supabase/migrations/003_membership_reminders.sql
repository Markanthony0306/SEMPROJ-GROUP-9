-- One upcoming and one expired reminder per subscription expiry date.
-- Changing the expiry on renewal creates a new reminder period.
begin;

create table if not exists public.membership_reminders (
  subscription_id uuid not null references public.subscriptions(subscription_id) on delete cascade,
  membership_end timestamptz not null,
  reminder_type text not null check (reminder_type in ('upcoming', 'expired')),
  claim_token uuid not null,
  claimed_until timestamptz not null,
  sent_at timestamptz,
  primary key (subscription_id, membership_end, reminder_type)
);

alter table public.membership_reminders enable row level security;
revoke all on table public.membership_reminders from public, anon, authenticated;
grant select, insert, update on table public.membership_reminders to service_role;

-- Atomic claims prevent two API instances from emailing the same reminder.
-- Recheck the latest subscription and preferences here in case staff renewed
-- the member, suspended access, or disabled reminders after the worker loaded.
create or replace function public.claim_membership_reminder(
  p_subscription_id uuid,
  p_membership_end timestamptz,
  p_reminder_type text,
  p_claim_token uuid
) returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  claimed boolean;
begin
  if not exists (
    select 1
    from public.subscriptions subscription
    join public.users member on member.id = subscription.user_id
    join public.roles member_role on member_role.role_id = member.role_id
    join public.gym_settings settings on settings.id = 1
    where subscription.subscription_id = p_subscription_id
      and subscription.end_date = p_membership_end
      and subscription.start_date <= now()
      and subscription.end_date > subscription.start_date
      and lower(subscription.status) in ('active', 'expired')
      and lower(member.status) in ('active', 'expired')
      and lower(member_role.role_name) in ('member', 'user')
      and settings.email_enabled
      and subscription.subscription_id = (
        select latest.subscription_id from public.subscriptions latest
        where latest.user_id = member.id
        order by latest.created_at desc limit 1
      )
      and (
        (p_reminder_type = 'upcoming'
          and subscription.end_date > now()
          and subscription.end_date <= now() + make_interval(days => settings.reminder_days))
        or (p_reminder_type = 'expired' and subscription.end_date <= now())
      )
  ) then
    return false;
  end if;

  insert into public.membership_reminders as reminder (
    subscription_id, membership_end, reminder_type, claim_token, claimed_until
  ) values (
    p_subscription_id, p_membership_end, p_reminder_type, p_claim_token, now() + interval '10 minutes'
  )
  on conflict (subscription_id, membership_end, reminder_type) do update
    set claim_token = excluded.claim_token, claimed_until = excluded.claimed_until
    where reminder.sent_at is null and reminder.claimed_until <= now()
  returning true into claimed;

  return coalesce(claimed, false);
end
$$;

revoke all on function public.claim_membership_reminder(uuid, timestamptz, text, uuid)
  from public, anon, authenticated;
grant execute on function public.claim_membership_reminder(uuid, timestamptz, text, uuid)
  to service_role;

commit;
