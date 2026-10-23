-- Clear one history category in a single transaction. Member accounts,
-- subscriptions, equipment, and reminder delivery receipts are preserved.
begin;

create or replace function public.clear_fitpulse_report_records(p_category text)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  case p_category
    when 'attendance' then
      delete from public.attendance_logs;
    when 'payments' then
      delete from public.payments;
    when 'renewals' then
      -- Match the app's definition: the payment belongs to a subscription
      -- created after the member's first subscription, regardless of plan.
      delete from public.payments payment
      using public.subscriptions subscription
      where payment.subscription_id = subscription.subscription_id
        and exists (
          select 1 from public.subscriptions earlier
          where earlier.user_id = subscription.user_id
            and coalesce(earlier.created_at, earlier.start_date)
              < coalesce(subscription.created_at, subscription.start_date)
        );
    when 'maintenance' then
      delete from public.gym_maintenance;
    else
      raise exception 'Unsupported report category.' using errcode = '22023';
  end case;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end
$$;

-- The API checks the current administrator role before invoking this function.
-- Browser clients and ordinary Supabase Auth sessions cannot execute it.
revoke all on function public.clear_fitpulse_report_records(text)
  from public, anon, authenticated;
grant execute on function public.clear_fitpulse_report_records(text) to service_role;

commit;
