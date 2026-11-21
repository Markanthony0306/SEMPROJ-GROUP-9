-- Migration 018: Remove member reactivation
-- Apply to FitPulse-Test ONLY.

DROP FUNCTION IF EXISTS
public.reactivate_fitpulse_member_atomic(uuid, uuid);
