-- Ensure GCash is available to registration, payment, and renewal flows.
-- Match trimmed, case-insensitive names so existing configurations are preserved.
begin;

insert into public.payment_methods (method_name)
select 'GCash'
where not exists (
  select 1
  from public.payment_methods
  where lower(btrim(method_name)) = 'gcash'
);

commit;
