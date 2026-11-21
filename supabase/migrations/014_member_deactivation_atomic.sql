
-- Migration 014: Atomic member deactivation
-- Preserves subscriptions, payments, attendance,
-- and the member's Supabase Auth account.

CREATE OR REPLACE FUNCTION
public.deactivate_fitpulse_member_atomic(
    p_actor_id uuid,
    p_member_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_member RECORD;
BEGIN
    -- 1. Validate identifiers.
    IF p_actor_id IS NULL OR p_member_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_MEMBER_INPUT'
            USING ERRCODE = 'P0001';
    END IF;

    -- 2. Only active administrators may deactivate members.
    IF NOT EXISTS (
        SELECT 1
        FROM public.users u
        JOIN public.roles r
          ON r.role_id = u.role_id
        WHERE u.id = p_actor_id
          AND u.status = 'active'
          AND LOWER(r.role_name) = 'admin'
    ) THEN
        RAISE EXCEPTION 'DEACTIVATION_NOT_ALLOWED'
            USING ERRCODE = 'P0001';
    END IF;

    -- 3. Find and lock the member.
    SELECT u.id, u.status, u.auth_version
    INTO v_member
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

    -- 4. Deactivate and invalidate existing
    -- FitPulse token versions.
    IF v_member.status <> 'inactive' THEN
        UPDATE public.users
        SET
            status = 'inactive',
            auth_version = COALESCE(auth_version, 0) + 1
        WHERE id = p_member_id
        RETURNING id, status, auth_version
        INTO v_member;
    END IF;

    -- 5. Return the updated account status.
    RETURN JSONB_BUILD_OBJECT(
        'member_id', v_member.id,
        'status', v_member.status,
        'auth_version', v_member.auth_version
    );
END;
$function$;

-- Backend-only execution.
REVOKE ALL ON FUNCTION
public.deactivate_fitpulse_member_atomic(uuid, uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
public.deactivate_fitpulse_member_atomic(uuid, uuid)
TO service_role;
