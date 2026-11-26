BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS member_terms_version text,
  ADD COLUMN IF NOT EXISTS member_terms_accepted_at timestamptz;

COMMENT ON COLUMN public.users.member_terms_version IS
  'Latest member terms version accepted by this account.';
COMMENT ON COLUMN public.users.member_terms_accepted_at IS
  'Timestamp when the latest member terms version was accepted.';

COMMIT;
NOTIFY pgrst, 'reload schema';
