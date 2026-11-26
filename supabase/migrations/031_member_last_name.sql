-- Use the same "Last Name" field name in the app, ID verification and database.
-- Apply after 030_member_name_parts.sql. If 030 has not been applied yet, apply
-- 030 first; this migration upgrades its surname column and RPC in place.
BEGIN;

DROP TRIGGER IF EXISTS fitpulse_sync_user_name_parts ON public.users;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS first_name text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'surname'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE public.users RENAME COLUMN surname TO last_name;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE public.users ADD COLUMN last_name text;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'surname'
  ) THEN
    -- Preserve any values if both names exist from a manual/partial upgrade.
    EXECUTE $sql$
      UPDATE public.users
      SET last_name = COALESCE(NULLIF(pg_catalog.btrim(last_name), ''), NULLIF(pg_catalog.btrim(surname), ''))
      WHERE last_name IS NULL OR pg_catalog.btrim(last_name) = ''
    $sql$;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.fitpulse_sync_user_name_parts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  normalized_first text;
  normalized_last text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.first_name IS NULL AND NEW.last_name IS NULL THEN
      RETURN NEW;
    END IF;
  ELSIF NEW.first_name IS NOT DISTINCT FROM OLD.first_name
    AND NEW.last_name IS NOT DISTINCT FROM OLD.last_name THEN
    IF NEW.name IS DISTINCT FROM OLD.name THEN
      NEW.first_name := NULL;
      NEW.last_name := NULL;
    END IF;
    RETURN NEW;
  ELSIF NEW.first_name IS NULL AND NEW.last_name IS NULL THEN
    RETURN NEW;
  END IF;

  normalized_first := pg_catalog.regexp_replace(pg_catalog.btrim(NEW.first_name), '[[:space:]]+', ' ', 'g');
  normalized_last := pg_catalog.regexp_replace(pg_catalog.btrim(NEW.last_name), '[[:space:]]+', ' ', 'g');
  IF NULLIF(normalized_first, '') IS NULL OR NULLIF(normalized_last, '') IS NULL THEN
    RAISE EXCEPTION 'REGISTRATION_INVALID_INPUT' USING errcode = 'P0001';
  END IF;

  NEW.first_name := normalized_first;
  NEW.last_name := normalized_last;
  NEW.name := pg_catalog.concat_ws(' ', normalized_first, normalized_last);
  RETURN NEW;
END;
$$;

CREATE TRIGGER fitpulse_sync_user_name_parts
BEFORE INSERT OR UPDATE OF name, first_name, last_name ON public.users
FOR EACH ROW EXECUTE FUNCTION public.fitpulse_sync_user_name_parts();

-- PostgreSQL does not permit renaming RPC input parameters through
-- CREATE OR REPLACE, so recreate this wrapper with p_last_name.
DROP FUNCTION IF EXISTS public.register_fitpulse_member_with_name_parts_atomic(
  uuid, uuid, text, text, text, text, integer, boolean, text, double precision[], text
);

CREATE FUNCTION public.register_fitpulse_member_with_name_parts_atomic(
  p_actor_id uuid,
  p_auth_user_id uuid,
  p_first_name text,
  p_last_name text,
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
  normalized_last text;
  full_name text;
  registration jsonb;
  member_id uuid;
  updated_rows integer;
BEGIN
  normalized_first := pg_catalog.regexp_replace(pg_catalog.btrim(p_first_name), '[[:space:]]+', ' ', 'g');
  normalized_last := pg_catalog.regexp_replace(pg_catalog.btrim(p_last_name), '[[:space:]]+', ' ', 'g');
  IF NULLIF(normalized_first, '') IS NULL OR NULLIF(normalized_last, '') IS NULL THEN
    RAISE EXCEPTION 'REGISTRATION_INVALID_INPUT' USING errcode = 'P0001';
  END IF;
  full_name := pg_catalog.concat_ws(' ', normalized_first, normalized_last);
  IF pg_catalog.char_length(normalized_first) > 80
    OR pg_catalog.char_length(normalized_last) > 80
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
      last_name = normalized_last
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
