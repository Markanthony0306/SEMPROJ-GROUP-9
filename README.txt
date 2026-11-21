FitPulse ID worker fix - 2026-11-19
===================================
Fixes:
- Finds Tesseract from PATH or common Windows install locations when FITPULSE_TESSERACT_EXE was not inherited by npm run server.
- Reports a specific Tesseract OCR not found error instead of the misleading Face verification error during an ID scan.
- Gives stage-specific error labels (ID, facial, live image) on unexpected exceptions.
- Preserves privacy-safe diagnostic suffix when FITPULSE_BIOMETRIC_DEBUG=1.
- Does not alter OCR matching rules, face thresholds, member creation, UI, or Supabase.

Install in PowerShell after downloading into Downloads:
  cd "C:\Users\Admin\Sekki\SEMPROJ-GROUP-9"
  Expand-Archive -Path "$env:USERPROFILE\Downloads\FitPulse-ID-Verification-Tesseract-Fix.zip" -DestinationPath "." -Force
  py -3 -m py_compile .\server\biometrics\verify.py

Stop and restart backend in the terminal after setting:
  $env:FITPULSE_TESSERACT_EXE = "C:\Program Files\Tesseract-OCR\tesseract.exe"
  $env:FITPULSE_BIOMETRIC_PYTHON = (py -3 -c "import sys; print(sys.executable)")
  $env:FITPULSE_BIOMETRIC_DEBUG = "1"
  npm run server

Then retry the ID verification once. If failure recurs, copy only the error
message and diagnostic from the backend/API Response (not ID images or passwords).

Unit tests verified: 16/16 Python worker tests passed. Live Windows OCR
and camera integration cannot be verified from this environment.
