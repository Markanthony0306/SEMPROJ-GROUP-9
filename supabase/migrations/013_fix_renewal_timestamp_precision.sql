-- FitPulse migration 013: fix PostgreSQL/JavaScript timestamp precision mismatch.
-- Intended target: FitPulse-Test ONLY. Do not run on the original project.
-- Keeps migration 012 behavior, including service_role-only EXECUTE.
-- Validates at millisecond precision (JavaScript Date), then saves full PostgreSQL precision.

BEGIN;

CREATE OR REPLACE FUNCTION public.renew_fitpulse_membership_atomic(
    p_member_id uuid,
    p_actor_id uuid,
    p_plan_id integer,
    p_method_name text,
    p_amount numeric,
    p_expected_subscription_id uuid,
    p_new_subscription_id uuid,
    p_new_payment_id uuid,
    p_start_date timestamptz,
    p_end_date timestamptz,
    p_renewed_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_member_id uuid;
    v_plan_name text;
    v_duration integer;
    v_method_id integer;

    v_previous_subscription_id uuid;
    v_previous_start timestamptz;
    v_previous_end timestamptz;

    v_base timestamptz;
    v_expected_start timestamptz;
    v_expected_end timestamptz;
BEGIN
    -- 1. Validate required values.
    IF p_member_id IS NULL
       OR p_actor_id IS NULL
       OR p_plan_id IS NULL
       OR p_new_subscription_id IS NULL
       OR p_new_payment_id IS NULL
       OR p_renewed_at IS NULL
       OR p_start_date IS NULL
       OR p_end_date IS NULL
       OR p_end_date <= p_start_date
    THEN
        RAISE EXCEPTION 'MEMBERSHIP_INVALID_INPUT';
    END IF;

    -- 2. Verify the processing administrator (no separate staff role).
    IF NOT EXISTS (
        SELECT 1
        FROM public.users u
        JOIN public.roles r ON r.role_id = u.role_id
        WHERE u.id = p_actor_id
          AND u.status = 'active'
          AND lower(r.role_name) = 'admin'
    ) THEN
        RAISE EXCEPTION 'MEMBERSHIP_ACTOR_FORBIDDEN';
    END IF;

    -- 3. Lock the member row during renewal.
    SELECT u.id INTO v_member_id
    FROM public.users u
    JOIN public.roles r ON r.role_id = u.role_id
    WHERE u.id = p_member_id
      AND lower(r.role_name) = 'member'
    FOR UPDATE OF u;

    IF v_member_id IS NULL THEN
        RAISE EXCEPTION 'MEMBERSHIP_MEMBER_NOT_FOUND';
    END IF;

    -- 4. Verify the membership plan.
    SELECT plan_name, duration_days
    INTO v_plan_name, v_duration
    FROM public.membership_plans
    WHERE plan_id = p_plan_id
      AND is_active = true
      AND lower(btrim(plan_name)) <> 'unlimited monthly';

    IF v_plan_name IS NULL OR v_duration <= 0 THEN
        RAISE EXCEPTION 'MEMBERSHIP_PLAN_UNAVAILABLE';
    END IF;

    -- 5. Verify payment method.
    SELECT method_id INTO v_method_id
    FROM public.payment_methods
    WHERE lower(btrim(method_name)) = lower(btrim(p_method_name))
      AND lower(btrim(method_name)) IN ('cash', 'gcash')
    LIMIT 1;

    IF v_method_id IS NULL THEN
        RAISE EXCEPTION 'MEMBERSHIP_PAYMENT_METHOD_UNAVAILABLE';
    END IF;

    -- 6. Validate payment amount.
    IF p_amount IS NULL
       OR p_amount <= 0
       OR p_amount::text IN ('NaN', 'Infinity', '-Infinity')
    THEN
        RAISE EXCEPTION 'MEMBERSHIP_INVALID_AMOUNT';
    END IF;

    -- 7. Find the latest saved subscription.
    SELECT subscription_id, start_date, end_date
    INTO v_previous_subscription_id, v_previous_start, v_previous_end
    FROM public.subscriptions
    WHERE user_id = p_member_id
    ORDER BY created_at DESC, subscription_id DESC
    LIMIT 1;

    -- 8. Detect another renewal that happened first.
    IF v_previous_subscription_id
       IS DISTINCT FROM p_expected_subscription_id
    THEN
        RAISE EXCEPTION 'MEMBERSHIP_RENEWAL_CONFLICT';
    END IF;

    -- 9. Verify dates calculated by MembershipService.
    IF v_previous_end IS NOT NULL
       AND v_previous_end > p_renewed_at
    THEN
        v_base := v_previous_end;
        v_expected_start := v_previous_start;
    ELSE
        v_base := p_renewed_at;
        v_expected_start := p_renewed_at;
    END IF;

    v_expected_end := v_base + make_interval(days => v_duration);

    -- JavaScript Date precision is milliseconds, while PostgreSQL may store
    -- microseconds. Compare only the precision the API can represent.
    IF p_start_date IS DISTINCT FROM date_trunc('milliseconds', v_expected_start)
       OR p_end_date IS DISTINCT FROM date_trunc('milliseconds', v_expected_end)
    THEN
        RAISE EXCEPTION 'MEMBERSHIP_RENEWAL_DATES_CHANGED';
    END IF;

    -- 10. Activate member.
    UPDATE public.users
    SET status = 'active'
    WHERE id = p_member_id;

    -- 11. Insert new subscription.
    INSERT INTO public.subscriptions (
        subscription_id,
        user_id,
        plan_id,
        start_date,
        end_date,
        status,
        created_at
    ) VALUES (
        p_new_subscription_id,
        p_member_id,
        p_plan_id,
        v_expected_start,
        v_expected_end,
        'active',
        p_renewed_at
    );

    -- 12. Insert matching payment.
    INSERT INTO public.payments (
        payment_id,
        subscription_id,
        method_id,
        processed_by_user_id,
        amount_paid,
        legacy_plan_name,
        created_at
    ) VALUES (
        p_new_payment_id,
        p_new_subscription_id,
        v_method_id,
        p_actor_id,
        p_amount,
        v_plan_name,
        p_renewed_at
    );

    -- 13. Return successful renewal details.
    RETURN jsonb_build_object(
        'subscription_id', p_new_subscription_id,
        'payment_id', p_new_payment_id,
        'member_id', p_member_id,
        'start_date', v_expected_start,
        'end_date', v_expected_end,
        'amount', p_amount
    );
END;
$function$;

-- This SECURITY DEFINER function accepts an actor ID from the caller.
-- Restrict execution to the server's service_role key, not browser clients.
REVOKE ALL ON FUNCTION public.renew_fitpulse_membership_atomic(
    uuid, uuid, integer, text, numeric, uuid, uuid, uuid,
    timestamptz, timestamptz, timestamptz
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.renew_fitpulse_membership_atomic(
    uuid, uuid, integer, text, numeric, uuid, uuid, uuid,
    timestamptz, timestamptz, timestamptz
) TO service_role;

COMMIT;
