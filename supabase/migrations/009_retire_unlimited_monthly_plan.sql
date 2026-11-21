-- Keep historical subscriptions and payments linked to their original plan.
update public.membership_plans
set is_active = false
where lower(btrim(plan_name)) = 'unlimited monthly';
