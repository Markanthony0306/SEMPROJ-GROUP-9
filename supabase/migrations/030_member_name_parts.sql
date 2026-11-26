-- Persist the Create Member name parts while keeping users.name as the
-- compatibility/display value used by existing RPCs, reports, and UI.
-- Existing users are not backfilled because name-part boundaries cannot be
-- inferred reliably from their combined name. Apply after migration 029.
BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS surname text;

-- Keep the split columns coherent if an existing account is edited through an
-- older full-name form: retain the new display name and clear stale parts.
-- Writes that provide both parts derive the canonical users.name value.
CREATE OR REPLACE FUNCTION public.fitpulse_sync_user_name_parts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  normalized_first text;
  normalized_surname text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.first_name IS NULL AND NEW.surname IS NULL THEN
      RETURN NEW;
    END IF;
  ELSIF NEW.first_name IS NOT DISTINCT FROM OLD.first_name
    AND NEW.surname IS NOT DISTINCT FROM OLD.surname THEN
    IF NEW.name IS DISTINCT FROM OLD.name THEN
      NEW.first_name := NULL;
      NEW.surname := NULL;
    END IF;
    RETURN NEW;
  ELSIF NEW.first_name IS NULL AND NEW.surname IS NULL THEN
    RETURN NEW;
  END IF;

  normalized_first := pg_catalog.regexp_replace(pg_catalog.btrim(NEW.first_name), '[[:space:]]+', ' ', 'g');
  normalized_surname := pg_catalog.regexp_replace(pg_catalog.btrim(NEW.surname), '[[:space:]]+', ' ', 'g');
  IF NULLIF(normalized_first, '') IS NULL OR NULLIF(normalized_surname, '') IS NULL THEN
    RAISE EXCEPTION 'REGISTRATION_INVALID_INPUT' USING errcode = 'P0001';
  END IF;

  NEW.first_name := normalized_first;
  NEW.surname := normalized_surname;
  NEW.name := pg_catalog.concat_ws(' ', normalized_first, normalized_surname);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fitpulse_sync_user_name_parts ON public.users;
CREATE TRIGGER fitpulse_sync_user_name_parts
BEFORE INSERT OR UPDATE OF name, first_name, surname ON public.users
FOR EACH ROW EXECUTE FUNCTION public.fitpulse_sync_user_name_parts();

-- Preserve the installed face-registration RPC and add the split parts in the
-- same transaction. Calling the existing wrapper also preserves whichever
-- face-template table the deployed 027/028 migration set uses.
CREATE OR REPLACE FUNCTION public.register_fitpulse_member_with_name_parts_atomic(
  p_actor_id uuid,
  p_auth_user_id uuid,
  p_first_name text,
  p_surname text,
  p_email text,
  p_phone text,
  p_plan_id integer,
  p_record_payment boolean,
  p_method_name text,
  p_embedding double precision[],
  p_id_type text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  normalized_first text;
  normalized_surname text;
  full_name text;
  registration jsonb;
  member_id uuid;
  updated_rows integer;
BEGIN
  normalized_first := pg_catalog.regexp_replace(pg_catalog.btrim(p_first_name), '[[:space:]]+', ' ', 'g');
  normalized_surname := pg_catalog.regexp_replace(pg_catalog.btrim(p_surname), '[[:space:]]+', ' ', 'g');
  IF NULLIF(normalized_first, '') IS NULL OR NULLIF(normalized_surname, '') IS NULL THEN
    RAISE EXCEPTION 'REGISTRATION_INVALID_INPUT' USING errcode = 'P0001';
  END IF;
  full_name := pg_catalog.concat_ws(' ', normalized_first, normalized_surname);
  IF pg_catalog.char_length(normalized_first) > 80
    OR pg_catalog.char_length(normalized_surname) > 80
    OR pg_catalog.char_length(full_name) > 100 THEN
    RAISE EXCEPTION 'REGISTRATION_INVALID_INPUT' USING errcode = 'P0001';
  END IF;

  SELECT public.register_fitpulse_member_with_face_atomic(
    p_actor_id => p_actor_id,
    p_auth_user_id => p_auth_user_id,
    p_name => full_name,
    p_email => p_email,
    p_phone => p_phone,
    p_plan_id => p_plan_id,
    p_record_payment => p_record_payment,
    p_method_name => p_method_name,
    p_embedding => p_embedding,
    p_id_type => p_id_type
  ) INTO registration;

  IF registration IS NULL OR registration->>'member_id' IS NULL THEN
    RAISE EXCEPTION 'REGISTRATION_INVALID_RESULT' USING errcode = 'P0001';
  END IF;

  member_id := (registration->>'member_id')::uuid;
  UPDATE public.users
  SET first_name = normalized_first,
      surname = normalized_surname
  WHERE id = member_id;
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 1 THEN
    RAISE EXCEPTION 'REGISTRATION_INVALID_RESULT' USING errcode = 'P0001';
  END IF;

  RETURN registration;
END;
$$;

REVOKE ALL ON FUNCTION public.register_fitpulse_member_with_name_parts_atomic(
  uuid, uuid, text, text, text, text, integer, boolean, text, double precision[], text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_fitpulse_member_with_name_parts_atomic(
  uuid, uuid, text, text, text, text, integer, boolean, text, double precision[], text
) TO service_role;

COMMIT;
NOTIFY pgrst, 'reload schema';
