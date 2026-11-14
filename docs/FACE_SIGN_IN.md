# Strict face sign-in

Apply the Supabase migrations through `014_member_enrollment.sql` in order.
Set a stable, server-only `FACE_ENCRYPTION_KEY` with 64 hex characters. Keep the
existing key if you already have enrollments. Set `ID_VERIFICATION_KEY` to your
existing ID key if you use a separate one. `FACE_LOGIN_ENABLED` controls the
optional check for enrolled staff. Members require face verification. Admins
require it once they have an active face enrollment.

## Set up administrator face sign-in

Use a trusted operator terminal with the private Supabase key in the local
environment. Verify the admin and their original photo ID in person. With their
consent, provide two ID images in front/back order or a single PDF, DOC, or DOCX
with both sides in that order. Keep the files outside the repository. The file
limit is 5 MB each.

To prepare the ID portrait for enrollment in Settings, run either command:

```powershell
node scripts/provision-admin-face.mjs --id-only admin@fitpulse.com 'C:\private\id-front.jpg' 'C:\private\id-back.jpg'
node scripts/provision-admin-face.mjs --id-only admin@fitpulse.com 'C:\private\both-sides.pdf'
```

The admin signs in with their password, opens **Settings → Set up face sign-in**,
and saves a live capture using their current password. Sign in again to complete
face verification. The ID-only option refuses to replace an existing face
enrollment.

For supervised enrollment, take a separate front-facing enrollment photo in JPG
or PNG with the admin's consent. These commands save the enrollment and ID
portrait together:

```powershell
node scripts/provision-admin-face.mjs admin@fitpulse.com 'C:\private\enrollment.jpg' 'C:\private\id-front.jpg' 'C:\private\id-back.jpg'
node scripts/provision-admin-face.mjs admin@fitpulse.com 'C:\private\enrollment.jpg' 'C:\private\both-sides.pdf'
```

The script validates both sides, detects the portraits, and stores their
encrypted templates together. The admin ID files stay with the operator.
Provisioning expires the admin's older sessions.
Sign in with the administrator's credentials, start the camera, and follow the
live prompt. A verified admin can update their face enrollment in Settings using
their current password. The saved ID remains the reference for that update.

## What sign-in verifies

Enrolled admins go straight from credentials to face verification. Members accept
the Terms first. After alignment, the camera asks for three blinks, a left turn,
and a right turn in a randomized order. Face forward again after each turn.
The API consumes a two-minute challenge and rechecks all 14 submitted frames,
including whether the same face performed every gesture. It compares the
highest-confidence frontal sample against the enrollment and the ID portrait
for roles that require both. The distance cutoff is `0.50` in
`server/lib/face-auth.js`. Smaller distances mean closer matches. The login
screen exchanges a single-use, 30-second verification token for the signed
application session. Camera frames are discarded after processing.

Member creation uses the same live check, followed by a closer shot. The API
checks that both distances show the same face and that it matches the ID portrait.
It rejects a duplicate face before staging the encrypted template and checks
again before activating the template with the new member profile.

Members need a readable ID and an enrolled face before they can sign in. After a
failed server check, start again from credentials for a fresh
challenge. If the ID is unreadable or enrollment is missing, gym staff need to
update that account's enrollment information. Five failed face submissions
temporarily lock sign-in or enrollment for 15 minutes, in addition to the IP
rate limits. The lockout and enrollment serialization are local to the API
process. A multi-instance deployment needs shared attempts and challenges
and a database-level duplicate check during profile activation.

The preview checks a downscaled frame every 120 ms and uses a detector confidence
cutoff of `0.35` for feedback. Active gestures sample at most every 60 ms.
Blink counting uses two closed samples and counts on reopening. The threshold
for each eye is at most `0.19` or 72% of its open-eye ratio, whichever is lower.
Turns use an estimated yaw of at least `25°` in the requested direction.
Alignment and turns each have 10 seconds. The three-blink block has 15 seconds.
If the window is behind you, turn to face it or light your face from the front.
The API requires a detector score of at least
`0.78` for camera frames, a face at least 64 pixels across its shorter side, and
visible eye, nose, and mouth detail. It reads the current encrypted enrollment and
ID record on each sign-in. A 60-second server cache reuses descriptors for the
same encrypted data, including portraits that would otherwise need reprocessing.

Use HTTPS or localhost for camera access. Test with the intended webcams and
supported IDs before rollout. A browser camera gesture can reject a static
photo, but injected frames, replayed video, or synthetic faces can defeat it.
Production deployments should use independently evaluated presentation attack
detection and a stronger administrator factor such as a passkey.
