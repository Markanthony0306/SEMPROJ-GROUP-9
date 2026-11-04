-- A QR token remains valid for its membership period and can be used for
-- subsequent daily check-ins. Request IDs provide scan retry idempotency, so
-- the token ID must not be unique across attendance rows.
alter table public.attendance_logs
  drop constraint if exists attendance_logs_qr_token_id_key;
