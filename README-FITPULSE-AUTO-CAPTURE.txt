FitPulse — Uploaded ID + Automatic Camera Capture
===============================================
Apply ON TOP OF your existing FitPulse project, after the previous
FitPulse-Live-Motion-ID-Guidance.zip update. ZIP contains changed files
only; it does not include .env, API keys, database migrations, or model files.

Windows PowerShell:
  cd "C:\Users\Admin\Sekki\SEMPROJ-GROUP-9"
  Expand-Archive -Path "$env:USERPROFILE\Downloads\FitPulse-ID-Upload-Auto-Capture.zip" -DestinationPath "." -Force

  # Optional PDF handling requires a new Python library:
  py -3 -m pip install PyMuPDF

  # In the PowerShell window launching the backend:
  $env:FITPULSE_TESSERACT_EXE = "C:\Program Files\Tesseract-OCR\tesseract.exe"
  $env:FITPULSE_BIOMETRIC_PYTHON = (py -3 -c "import sys; print(sys.executable)")
  npm run server

  # Start frontend in a separate terminal:
  npm run dev

ID verification options:
  * LIVE CAMERA: previews front and back side-by-side. The front automatically
    captures after consecutive quality + hold-still checks. The admin must
    click "Scan back of ID" to begin the back camera; back then auto-captures.
    Passport photo/details page does not require a separate back.
  * UPLOAD ID: upload a front image and a back image (JPEG/PNG/WebP), OR
    upload one PDF containing the ID information (1-2 relevant first pages).
    Only one PDF file is needed. Each file is capped at 4 MB.
    Both modes still run existing OCR type/name/ID portrait validation.
    The same live face-motion + identity match remains mandatory.

FACIAL ENROLLMENT AND LOGIN:
  * Look straight, then turn right and hold: automatic capture after
    consecutive guidance frames. Repeat for left with a new neutral sample.
  * Final forward-facing close-up automatically captures and is checked.
  * No blink action. Existing server-side head motion and face matching preserved.
  * Each camera instance captures once, preventing repeated submissions.

PDF implementation:
  * PyMuPDF renders the first 1-2 pages in memory, with no uploaded PDF saved.
  * First page MUST contain clear ID type/name and a detectable portrait.
  * Password-protected, malformed and oversized PDFs are rejected.
  * A one-page PDF is allowed, as requested, but an ID without visible identifying
    information or an ID portrait will fail verification.
  * The optional PDF dependency is NOT necessary for live-camera or image uploads.

Testing carried out here:
  * 14/14 focused JS identity + facial login API tests pass.
  * 12/12 Python biometric tests pass (including 1/2-page PDFs).
  * 167/168 full JS tests pass; only existing equipment route test mock fails
    (app.delete is not a function, unrelated to this update).
  * Changed JSX files pass Babel parser syntax checks.
  * A Linux Vite build could not complete with the supplied Windows dependency
    bundle due to missing @rollup/rollup-linux-x64-gnu, not source errors.
  * Real camera, Supabase live migration/registration, and deployment NOT tested.

SECURITY: Motion is NOT certified anti-spoofing; photo/video replay can evade
basic checks. Uploaded ID images and PDF are processed in memory only by this
worker; a face embedding is stored under existing Supabase policy. Keep IDs and
member personal data private, obtain consent, and offer manual review.
