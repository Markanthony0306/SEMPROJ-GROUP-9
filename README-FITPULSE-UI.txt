FitPulse: Create Member + Facial Login layout update
==================================================

INSTALL (Windows PowerShell)
  cd "C:\Users\Admin\Sekki\SEMPROJ-GROUP-9"
  Expand-Archive -Path "$env:USERPROFILE\Downloads\FitPulse-Manual-ID-Scan-Face-Layout.zip" -DestinationPath "." -Force
  node --check .\server\routes\identityVerification.js
  py -3 -m py_compile .\server\biometrics\verify.py
  npm run server
  # In another PowerShell terminal: npm run dev

FEATURES
  1. Four-stage Create Member screen: Details / ID scan / Face / Close-up.
  2. Details includes Cash/GCash, ID type, consent, optional contact number.
  3. No "payment received" checkbox. Existing temporary password modal stays.
  4. Back of card ID is NOT scanned automatically: an explicit button follows front capture.
  5. Passports use the passport photo/details page (no physical card back).
  6. No Review step.
  7. No blink check. Right turn, left turn, and front close-up are verified by the server.
  8. Facial Login Security uses the same look and required right/left/front images.
  9. Back photo is checked for decodability/basic image quality. This does NOT
     authenticate the physical document's reverse side or detect sophisticated fraud.
  10. Existing biometric Python diagnostic-mode handler preserved.

MODIFIED FILES
  src/components/mobile/CreateMemberSheet.jsx
  src/components/IdentityCamera.jsx
  src/components/IdentityCamera.css
  src/components/FacialLoginChallenge.jsx
  server/routes/identityVerification.js
  server/routes/identityVerification.test.js
  server/biometrics/verify.py
  server/biometrics/test_verify.py
NEW FILE
  src/components/VerificationFlow.css

DOES NOT CHANGE
  .env / secrets, Supabase schema/migrations, other dashboard sections,
  existing credentials modal, password-login form, facial matching thresholds,
  registration persistence or Supabase Auth logic.

TESTS (local)
  node --test server/routes/identityVerification.test.js server/routes/passwordLoginFace.test.js
  py -3 -m unittest discover -s server/biometrics -p "test_verify.py"
  npm run dev

STATUS
  161/162 server tests passed on reference source; the single existing failure is
  equipment routes' test mock missing app.delete. 5/5 Python helper tests passed.
  New JSX syntax validated with @babel/parser. Full Vite build not available in
  Linux test container because the uploaded node_modules has Windows binaries.
  Live-camera ID and face matching were not tested against physical hardware.

IMPORTANT: The user's last reported email_exists registration error is a separate
Supabase Auth issue. This UI update does not change or guarantee its resolution.
