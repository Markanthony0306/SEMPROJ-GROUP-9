
-- Migration 017: Atomic member reactivation
-- Apply to FitPulse-Test ONLY.

CREATE OR REPLACE FUNCTION
public.reactivate_fitpulse_member_atomic(
    p_actor_id uuid,
    p_member_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_status text;
    v_auth_version integer;
BEGIN
    -- Validate identifiers.
    IF p_actor_id IS NULL OR p_member_id IS NULL THEN
        RAISE EXCEPTION 'INVALID_MEMBER_INPUT'
            USING ERRCODE = 'P0001';
    END IF;

    -- Only active administrators may reactivate members.
    IF NOT EXISTS (
        SELECT 1
        FROM public.users u
        JOIN public.roles r
          ON r.role_id = u.role_id
        WHERE u.id = p_actor_id
          AND u.status = 'active'
          AND LOWER(r.role_name) = 'admin'
    ) THEN
        RAISE EXCEPTION 'REACTIVATION_NOT_ALLOWED'
            USING ERRCODE = 'P0001';
    END IF;

    -- Locate and lock the member account.
    SELECT u.status
    INTO v_status
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

    -- Only inactive accounts can be reactivated.
    IF v_status <> 'inactive' THEN
        RAISE EXCEPTION 'MEMBER_NOT_INACTIVE'
            USING ERRCODE = 'P0001';
    END IF;

    -- Restore access and invalidate previous tokens.
    UPDATE public.users
    SET
        status = 'active',
        auth_version = COALESCE(auth_version, 0) + 1
    WHERE id = p_member_id
    RETURNING status, auth_version
    INTO v_status, v_auth_version;

    RETURN JSONB_BUILD_OBJECT(
        'member_id', p_member_id,
        'status', v_status,
        'auth_version', v_auth_version
    );
END;
$function$;

-- Only the trusted backend may execute this function.
REVOKE ALL ON FUNCTION
public.reactivate_fitpulse_member_atomic(uuid, uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
public.reactivate_fitpulse_member_atomic(uuid, uuid)
TO service_role;