FitPulse - Live ID Guidance + Head Motion Verification
====================================================

Apply this to the existing project after FitPulse-Manual-ID-Scan-Face-Layout.zip.
This package contains 11 modified files, not a whole project. No .env, passwords,
Supabase migration, database reset, or dependency changes are included.

Windows PowerShell:
  cd "C:\Users\Admin\Sekki\SEMPROJ-GROUP-9"
  Expand-Archive -Path "$env:USERPROFILE\Downloads\FitPulse-Live-Motion-ID-Guidance.zip" -DestinationPath "." -Force
  $env:FITPULSE_TESSERACT_EXE = "C:\Program Files\Tesseract-OCR\tesseract.exe"
  $env:FITPULSE_BIOMETRIC_PYTHON = (py -3 -c "import sys; print(sys.executable)")
  npm run server
  # In a second terminal in this folder: npm run dev

Behavior:
- Details -> ID scan -> Face turns -> Face close-up. No Review or blink step.
- ID FRONT and BACK placeholders/thumbnails stay SIDE BY SIDE.
- The front scan never starts the back camera. Click "Scan back of ID" yourself.
- BOTH photos are shown in the same ID screen, and "Verify ID and continue"
  is a separate explicit action. Passport needs only its photo/details page.
- Live ID preview gives "Move closer", "Hold still", "Reduce glare", etc.
  It combines low-res server-side visual quality heuristics with browser motion
  stability. It does NOT certify ID authenticity or guarantee reliable corners.
- Face enrollment and member login each require a neutral (look-forward) sample,
  then a detected held right/left head turn; only then can the operator click
  Capture. All transitions are checked again on the Python backend.
- No blinking requested. Face still matches the existing ID/registered template.
- All live-preview images stay in memory and are submitted to local backend for
  guidance; the backend does not save them. The existing enrollment embedding is
  stored under the existing database policy.
- These checks are a basic SCHOOL PROJECT motion challenge, NOT anti-spoofing:
  video/deepfake replays may still pass. Real-world identity deployment needs
  independent certified liveness, access/consent controls, and alternative review.

No new Python or Node dependencies are required beyond the existing local
Tesseract and OpenCV Zoo YuNet/SFace setup. No Supabase SQL is required.

Checks performed locally:
  node --test server/routes/identityVerification.test.js server/routes/passwordLoginFace.test.js
  python -m unittest discover -s server/biometrics -p test_verify.py
  Node syntax checks and JSX parser checks
  all 165 existing JS server tests -> 164 pass; one pre-existing equipment
  routes mock failure (app.delete is not a function).

Not verified: real device camera behavior and a production Vite build, because
this environment only has the uploaded Windows-dependent bundle and no physical
webcam. Inspect browser console and backend output during local camera tests.

When troubleshooting, do not send ID images, face photos, face templates,
Supabase secrets, passwords or bearer tokens to anyone.
