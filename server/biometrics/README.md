# FitPulse offline ID and facial verification

This implementation is **local and API-key-free**, using Tesseract OCR, OpenCV Zoo YuNet face detection, and OpenCV Zoo SFace face recognition. The repository includes the integration code, but **not the model weights or Tesseract binary**. Verification refuses to pass until they are installed.

## Windows setup (PowerShell)

From the existing project root (`C:\Users\Admin\SEMPROJ-GROUP-9`):

```powershell
py -3 -m pip install --upgrade opencv-contrib-python numpy pytesseract
```

Install Tesseract OCR from the [UB Mannheim Windows builds](https://github.com/UB-Mannheim/tesseract/wiki) if it is not already installed. Ensure `tesseract.exe` is available on your PATH; alternatively set `FITPULSE_TESSERACT_EXE` to its complete filename in the backend environment (for example `C:\Program Files\Tesseract-OCR\tesseract.exe`).

Create the models folder and download **both original model files** from OpenCV Zoo:

```powershell
New-Item -ItemType Directory -Force .\server\biometrics\models | Out-Null
Invoke-WebRequest 'https://github.com/opencv/opencv_zoo/raw/refs/heads/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx' -OutFile '.\server\biometrics\models\face_detection_yunet_2023mar.onnx'
Invoke-WebRequest 'https://github.com/opencv/opencv_zoo/raw/refs/heads/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx' -OutFile '.\server\biometrics\models\face_recognition_sface_2021dec.onnx'
```

**Verify** the files downloaded are model binaries, not Git LFS pointers or HTML. YuNet is approximately 230 KB and SFace is approximately 37 MB. If direct downloads are blocked, get them from the [YuNet](https://github.com/opencv/opencv_zoo/blob/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx) and [SFace](https://github.com/opencv/opencv_zoo/blob/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx) GitHub file pages instead.

Test the installation:

```powershell
py -3 -c "import cv2, numpy, pytesseract; print(cv2.__version__); print(pytesseract.get_tesseract_version())"
```

If the app server starts with a different Python environment, set `FITPULSE_BIOMETRIC_PYTHON` to the executable path and restart your backend. The worker launches with `python` by default; on Windows, `python` must resolve to the installation that has these packages.

## Supabase migration

1. Open your existing project's **Supabase SQL Editor**.
2. Run `supabase/migrations/027_payment_methods_and_face_enrollment.sql` once. It adds both **Cash** and **GCash** when missing, and creates biometric enrollments and an atomic member-registration wrapper.
3. Verify that `public.payment_methods` contains `Cash` and `GCash`. The older `026_configure_gcash_payment_method.sql` added only GCash.
4. Do **not** rerun the destructive `025_remove_identity_verification.sql` after this migration.
5. Do not expose `SUPABASE_SECRET_KEY` or `JWT_SECRET` to the Vite frontend.

The new tables are distinct from the retired identity-verification schema. **No old facial templates are recovered**; a member created after applying this migration must have face enrollment. Existing members without an enrollment record retain their prior password-login behavior (created before the migration's policy timestamp).

## Test the workflow

Start the original backend and frontend as usual (`npm run server`, `npm run dev`). Sign in as admin and select **Create Member**. Proceed through member details, payment, ID type, consent, live ID capture, and the right/left/front face scans. If verification passes, the existing credentials modal shows the temporary password once. After password sign-in, the newly created member will see the facial login challenge and must turn right, left, then face forward to receive a session.

The system checks the **ID's printed ID-type label and the member's first/last name**, since a government ID generally does not contain the member's email or phone number. Poor OCR may require retaking the ID. Face matching thresholds and head-turn estimates are best-effort and require evaluation on representative devices and ID styles; this **does not provide production-grade anti-spoofing**. Static images or recorded videos may fool pose-only challenges. Do not rely on this alone for consequential or regulated identity checks; offer manual review and an accessible non-biometric alternative before real deployment.

Privacy: The worker does not save ID photos or webcam images. The database saves a 128-number biometric face embedding associated with each new member; member deletion removes it through `ON DELETE CASCADE`. Obtain clear consent, restrict database credentials, use HTTPS for off-device cameras, define retention requirements, and safeguard biometric data under applicable privacy rules.
