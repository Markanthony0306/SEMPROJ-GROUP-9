
-- Securely invalidate member sessions before changing
-- a member's password in Supabase Auth.

CREATE OR REPLACE FUNCTION public.begin_fitpulse_member_password_change(
  p_actor_id uuid,
  p_member_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new_version integer;
BEGIN
  -- Only an active administrator or staff account
  -- may initiate a member password change.
  IF NOT EXISTS (
    SELECT 1
    FROM public.users AS actor
    JOIN public.roles AS role
      ON role.role_id = actor.role_id
    WHERE actor.id = p_actor_id
      AND actor.status = 'active'
      AND role.role_name IN ('admin', 'staff')
  ) THEN
    RAISE EXCEPTION
      'Not authorized to update member passwords.';
  END IF;

  -- Atomically invalidate existing FitPulse sessions.
  UPDATE public.users AS member
  SET auth_version = COALESCE(member.auth_version, 0) + 1
  WHERE member.id = p_member_id
    AND EXISTS (
      SELECT 1
      FROM public.roles AS role
      WHERE role.role_id = member.role_id
        AND role.role_name = 'member'
    )
  RETURNING member.auth_version
  INTO v_new_version;

  IF v_new_version IS NULL THEN
    RAISE EXCEPTION 'Member account not found.';
  END IF;

  RETURN v_new_version;
END;
$$;

-- The backend uses the Supabase service-role key.
-- Never expose this operation to ordinary clients.
REVOKE ALL ON FUNCTION
  public.begin_fitpulse_member_password_change(uuid, uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.begin_fitpulse_member_password_change(uuid, uuid)
TO service_role;
