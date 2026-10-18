-- Stores only the AES-256-GCM encrypted face descriptor produced by the app.
-- The encryption key must remain in the API server environment, never Supabase.
create table if not exists public.face_enrollments (
  enrollment_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null,
  provider_reference text not null,
  status text not null default 'pending',
  consented_at timestamptz,
  created_at timestamptz not null default now(),
  descriptor_encrypted text
);

alter table public.face_enrollments
  add column if not exists descriptor_encrypted text;

create index if not exists face_enrollments_user_status_created_idx
  on public.face_enrollments(user_id, status, created_at desc);

alter table public.face_enrollments enable row level security;
revoke all on table public.face_enrollments from public, anon, authenticated;
grant all on table public.face_enrollments to service_role;
