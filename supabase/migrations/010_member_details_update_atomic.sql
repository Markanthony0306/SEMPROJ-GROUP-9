
-- Migration 010: Atomic member details and membership-plan update
-- This function updates a member's profile and subscription
-- within a single PostgreSQL transaction.

CREATE OR REPLACE FUNCTION public.update_fitpulse_member_details_atomic(
    p_actor_id uuid,
    p_member_id uuid,
    p_name text,
    p_phone text,
    p_plan_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_plan_id INTEGER;
    v_subscription_id UUID;
    v_profile RECORD;
BEGIN

    -- 1. Validate required information.
    IF p_actor_id IS NULL
       OR p_member_id IS NULL
       OR p_name IS NULL
       OR LENGTH(TRIM(p_name)) = 0
       OR LENGTH(TRIM(p_name)) > 100
    THEN
        RAISE EXCEPTION 'INVALID_MEMBER_INPUT'
            USING ERRCODE = 'P0001';
    END IF;

    -- 2. Confirm that the actor is an active admin/staff.
    IF NOT EXISTS (
        SELECT 1
        FROM public.users u
        JOIN public.roles r
          ON r.role_id = u.role_id
        WHERE u.id = p_actor_id
          AND u.status = 'active'
          AND LOWER(r.role_name) IN ('admin', 'staff')
    ) THEN
        RAISE EXCEPTION 'UPDATE_NOT_ALLOWED'
            USING ERRCODE = 'P0001';
    END IF;

    -- 3. Find and lock the member being updated.
    PERFORM 1
    FROM public.users u
    JOIN public.roles r
      ON r.role_id = u.role_id
    WHERE u.id = p_member_id
      AND LOWER(r.role_name) = 'member'
    FOR UPDATE OF u;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'MEMBER_NOT_FOUND'
            USING ERRCODE = 'P0001';
    END IF;

    -- 4. If a new plan was requested, validate it.
    IF p_plan_name IS NOT NULL THEN

        SELECT plan_id
        INTO v_plan_id
        FROM public.membership_plans
        WHERE LOWER(plan_name) = LOWER(TRIM(p_plan_name))
          AND is_active = TRUE;

        IF v_plan_id IS NULL THEN
            RAISE EXCEPTION 'MEMBERSHIP_PLAN_NOT_AVAILABLE'
                USING ERRCODE = 'P0001';
        END IF;

        -- 5. Locate the member's latest subscription.
        SELECT subscription_id
        INTO v_subscription_id
        FROM public.subscriptions
        WHERE user_id = p_member_id
        ORDER BY
            created_at DESC NULLS LAST,
            start_date DESC NULLS LAST,
            subscription_id DESC
        LIMIT 1
        FOR UPDATE;

        IF v_subscription_id IS NULL THEN
            RAISE EXCEPTION 'MEMBER_SUBSCRIPTION_MISSING'
                USING ERRCODE = 'P0001';
        END IF;

        -- 6. Change the plan while preserving dates.
        UPDATE public.subscriptions
        SET plan_id = v_plan_id
        WHERE subscription_id = v_subscription_id;

    END IF;

    -- 7. Update the member's basic profile.
    UPDATE public.users
    SET
        name = TRIM(p_name),
        phone_number = NULLIF(TRIM(COALESCE(p_phone, '')), '')
    WHERE id = p_member_id
    RETURNING
        id,
        name,
        email,
        phone_number
    INTO v_profile;

    -- 8. Return the updated information.
    RETURN JSONB_BUILD_OBJECT(
        'member', TO_JSONB(v_profile),
        'subscription_id', v_subscription_id,
        'plan_changed', p_plan_name IS NOT NULL
    );

END;
$function$;

-- Restrict execution to the backend service role.
REVOKE ALL ON FUNCTION
    public.update_fitpulse_member_details_atomic(
        uuid, uuid, text, text, text
    )
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
    public.update_fitpulse_member_details_atomic(
        uuid, uuid, text, text, text
    )
TO service_role;
