-- Repair reminder preferences and tracking, including projects that skipped 003.
-- One upcoming and one expired reminder per subscription expiry date.
-- Changing the expiry on renewal creates a new reminder period.
begin;

-- Preserve the preference used by older FitPulse databases.
alter table public.gym_settings add column if not exists email_enabled boolean;
update public.gym_settings settings
set email_enabled = coalesce(
  settings.email_enabled, (to_jsonb(settings)->>'email_notifications')::boolean, false
)
where email_enabled is null;
alter table public.gym_settings alter column email_enabled set default false;
alter table public.gym_settings alter column email_enabled set not null;


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


-- SMTP acceptance is recorded separately from any claim or failed attempt.
alter table public.membership_reminders
  add column if not exists last_attempt_at timestamptz,
  add column if not exists last_error_code text,
  add column if not exists message_id text;

-- Dismissing an alert never deletes a member, equipment, or email receipt.
create table if not exists public.admin_notification_dismissals (
  admin_user_id uuid not null references public.users(id) on delete cascade,
  notification_key text not null check (notification_key ~ '^[a-f0-9]{64}$'),
  dismissed_at timestamptz not null default now(),
  primary key (admin_user_id, notification_key)
);
alter table public.admin_notification_dismissals enable row level security;
revoke all on table public.admin_notification_dismissals from public, anon, authenticated;
grant select, insert, update on table public.admin_notification_dismissals to service_role;

-- Expose the new table columns and function to the Data API after commit.
notify pgrst, 'reload schema';

commit;
