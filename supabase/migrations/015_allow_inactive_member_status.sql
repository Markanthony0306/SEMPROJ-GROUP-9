
-- Migration 015: Allow inactive member status
-- Retains all existing valid account statuses.

BEGIN;

ALTER TABLE public.users
DROP CONSTRAINT users_status_check;

ALTER TABLE public.users
ADD CONSTRAINT users_status_check
CHECK (
    status IN (
        'active',
        'suspended',
        'archived',
        'inactive'
    )
);

COMMIT;
