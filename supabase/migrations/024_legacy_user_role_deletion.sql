-- Legacy databases may store member accounts under a role named `user`.
-- Apply the same permanent deletion cleanup used for role `member` accounts.
CREATE OR REPLACE FUNCTION public.delete_fitpulse_member_records()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.roles
    WHERE role_id = OLD.role_id
      AND LOWER(role_name) IN ('member', 'user')
  ) THEN
    DELETE FROM public.payments payment
    USING public.subscriptions subscription
    WHERE payment.subscription_id = subscription.subscription_id
      AND subscription.user_id = OLD.id;

    DELETE FROM public.subscriptions WHERE user_id = OLD.id;
    DELETE FROM public.attendance_logs WHERE user_id = OLD.id;
    UPDATE public.payments SET processed_by_user_id = NULL WHERE processed_by_user_id = OLD.id;

    IF pg_catalog.to_regclass('public.maintenance_logs') IS NOT NULL THEN
      UPDATE public.maintenance_logs SET staff_id = NULL WHERE staff_id = OLD.id;
    END IF;
    IF pg_catalog.to_regclass('public.notifications') IS NOT NULL THEN
      DELETE FROM public.notifications WHERE user_id = OLD.id;
    END IF;
    IF pg_catalog.to_regclass('public.qr_credentials') IS NOT NULL THEN
      DELETE FROM public.qr_credentials WHERE user_id = OLD.id;
    END IF;
  END IF;
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_fitpulse_account_deletion(
  p_user_id uuid,
  p_auth_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.users account
    JOIN public.roles account_role ON account_role.role_id = account.role_id
    WHERE account.id = p_user_id
      AND account.auth_user_id = p_auth_user_id
      AND LOWER(account_role.role_name) IN ('member', 'user')
  ) AND EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.users'::regclass
      AND confrelid = 'auth.users'::regclass
      AND confdeltype = 'c'
      AND conkey = ARRAY[(
        SELECT attnum
        FROM pg_catalog.pg_attribute
        WHERE attrelid = 'public.users'::regclass
          AND attname = 'auth_user_id'
      )]
  ) AND EXISTS (
    SELECT 1
    FROM pg_catalog.pg_trigger
    WHERE tgrelid = 'public.users'::regclass
      AND tgname = 'fitpulse_delete_member_records'
      AND tgenabled IN ('O', 'A')
  );
$function$;

REVOKE ALL ON FUNCTION public.delete_fitpulse_member_records()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_fitpulse_account_deletion(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_fitpulse_account_deletion(uuid, uuid)
  TO service_role;
