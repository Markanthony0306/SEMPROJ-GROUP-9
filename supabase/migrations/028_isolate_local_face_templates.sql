-- FitPulse: isolate local YuNet/SFace templates from the legacy provider-based
-- face_enrollments table. Keep legacy records and constraints unchanged.
-- Run once in Supabase SQL Editor AFTER migration 027.
BEGIN;

-- The older public.face_enrollments table is deliberately not altered.
-- Its provider/provider_reference/status fields are mandatory and do not match
-- the new local face embedding registration flow.
CREATE TABLE IF NOT EXISTS public.fitpulse_face_templates (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  embedding double precision[] NOT NULL CHECK (array_length(embedding, 1) = 128),
  id_type text NOT NULL CHECK (id_type IN ('philid', 'ephilid', 'drivers_license', 'passport', 'umid')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fitpulse_face_templates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.fitpulse_face_templates FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.fitpulse_face_templates TO service_role;

-- Keep the RPC signature consumed by MemberRegistrationRepository.js intact.
-- The regular account/subscription creation and facial-template insertion occur
-- inside the same SQL statement, so failures roll back the database transaction.
CREATE OR REPLACE FUNCTION public.register_fitpulse_member_with_face_atomic(
  p_actor_id uuid, p_auth_user_id uuid, p_name text, p_email text, p_phone text,
  p_plan_id integer, p_record_payment boolean, p_method_name text,
  p_embedding double precision[], p_id_type text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  registration jsonb;
BEGIN
  IF p_embedding IS NULL
    OR array_length(p_embedding, 1) IS DISTINCT FROM 128
    OR p_id_type IS NULL
    OR p_id_type NOT IN ('philid', 'ephilid', 'drivers_license', 'passport', 'umid') THEN
    RAISE EXCEPTION 'REGISTRATION_FACE_INVALID' USING errcode = 'P0001';
  END IF;

  SELECT to_jsonb(public.register_fitpulse_member_atomic(
    p_actor_id => p_actor_id, p_auth_user_id => p_auth_user_id,
    p_name => p_name, p_email => p_email, p_phone => p_phone,
    p_plan_id => p_plan_id, p_record_payment => p_record_payment,
    p_method_name => p_method_name
  )) INTO registration;

  IF registration IS NULL OR registration->>'member_id' IS NULL THEN
    RAISE EXCEPTION 'REGISTRATION_INVALID_RESULT' USING errcode = 'P0001';
  END IF;

  INSERT INTO public.fitpulse_face_templates (user_id, embedding, id_type)
  VALUES ((registration->>'member_id')::uuid, p_embedding, p_id_type);

  RETURN registration;
END;
$$;

REVOKE ALL ON FUNCTION public.register_fitpulse_member_with_face_atomic(
  uuid, uuid, text, text, text, integer, boolean, text, double precision[], text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_fitpulse_member_with_face_atomic(
  uuid, uuid, text, text, text, integer, boolean, text, double precision[], text
) TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';
