FitPulse face-enrollment schema compatibility fix
=================================================

Why: Your existing public.face_enrollments table has mandatory legacy
provider, provider_reference, status, and enrollment_id columns. Migration 027
used CREATE TABLE IF NOT EXISTS, so it did not replace that older structure.
Adding embedding/id_type alone cannot fix member registration.

Install (Windows PowerShell, from C:\Users\Admin\Sekki\SEMPROJ-GROUP-9):
1. Extract this ZIP into your existing project root, preserving paths.
2. In Supabase SQL Editor run:
   supabase/migrations/028_isolate_local_face_templates.sql
   This changes only a new table and the new facial registration wrapper.
   Do NOT rerun migration 025.
3. Verify the new table exists and is empty (before fresh registrations):
   SELECT to_regclass('public.fitpulse_face_templates');
4. Check for a preexisting Auth/profile record for the email you are about
   to use; do not repeat a registration with an existing record.
5. Restart the backend, then try Create Member once.
6. Sign in as the newly-created member and confirm the face login challenge.

Changes:
- New restricted public.fitpulse_face_templates table with 128-number SFace
  template and verified ID type; foreign-key cascade on member removal.
- Rebind facial-registration RPC to this new table, preserving atomicity.
- Redirect both password-login challenge lookup and face-login matching lookup
  to the new table.
- Update corresponding test mocks. No UI modifications.

The old public.face_enrollments table is not modified or deleted. Existing
legacy provider templates are not migrated to the local SFace format.
Do not post member photos, embeddings, API keys, or passwords while debugging.
