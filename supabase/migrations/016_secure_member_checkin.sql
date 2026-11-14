
-- Migration 016: Reject inactive member check-ins.
-- Run in FitPulse-Test ONLY.

CREATE OR REPLACE FUNCTION public.record_fitpulse_checkin(
    p_member_id uuid,
    p_member_name text,
    p_date timestamptz,
    p_source text,
    p_device_id text,
    p_request_id text,
    p_qr_token_id text
)
RETURNS TABLE (
    result_code text,
    attendance_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    prior public.attendance_logs%ROWTYPE;
    new_id uuid;
BEGIN
    -- Serialize check-ins for this member.
    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(p_member_id::text, 0)
    );

    -- Verify the member's CURRENT account status.
    -- This row lock also coordinates with deactivation.
    PERFORM 1
    FROM public.users u
    JOIN public.roles r
      ON r.role_id = u.role_id
    WHERE u.id = p_member_id
      AND u.status = 'active'
      AND LOWER(r.role_name) = 'member'
    FOR UPDATE OF u;

    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 'MEMBERSHIP_INACTIVE'::text, NULL::uuid;
        RETURN;
    END IF;

    -- Preserve duplicate-request protection.
    SELECT *
    INTO prior
    FROM public.attendance_logs
    WHERE device_id = p_device_id
      AND request_id = p_request_id;

    IF FOUND THEN
        IF prior.qr_token_id = p_qr_token_id
           AND prior.user_id = p_member_id THEN
            RETURN QUERY
            SELECT 'ALREADY_RECORDED'::text,
                   prior.attendance_id;
        ELSE
            RETURN QUERY
            SELECT 'REQUEST_CONFLICT'::text, NULL::uuid;
        END IF;

        RETURN;
    END IF;

    -- Preserve the 60-second check-in cooldown.
    IF EXISTS (
        SELECT 1
        FROM public.attendance_logs
        WHERE user_id = p_member_id
          AND check_in_time > NOW() - INTERVAL '60 seconds'
    ) THEN
        RETURN QUERY
        SELECT 'CHECK_IN_COOLDOWN'::text, NULL::uuid;
        RETURN;
    END IF;

    -- Record successful attendance.
    INSERT INTO public.attendance_logs (
        user_id,
        member_name,
        check_in_time,
        entry_type,
        device_id,
        request_id,
        qr_token_id
    )
    VALUES (
        p_member_id,
        p_member_name,
        p_date,
        p_source,
        p_device_id,
        p_request_id,
        p_qr_token_id
    )
    RETURNING attendance_logs.attendance_id
    INTO new_id;

    RETURN QUERY
    SELECT 'CHECK_IN_RECORDED'::text, new_id;
END;
$function$;

-- Permit only the trusted backend to execute the RPC.
REVOKE ALL ON FUNCTION public.record_fitpulse_checkin(
    uuid, text, timestamptz, text, text, text, text
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.record_fitpulse_checkin(
    uuid, text, timestamptz, text, text, text, text
) TO service_role;
