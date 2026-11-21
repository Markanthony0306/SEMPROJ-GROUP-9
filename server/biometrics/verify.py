"""FitPulse offline ID OCR and facial matching worker.

Requires: Python >=3.10, opencv-contrib-python, numpy, pytesseract, Tesseract OCR,
and locally installed OpenCV Zoo YuNet and SFace ONNX model files.
Reads one JSON request from stdin, writes one JSON response to stdout.
No uploaded ID image is saved, logged, or transmitted by this worker.
"""
import base64
import json
import os
import re
import shutil
import sys
import unicodedata

try:
    import cv2
    import numpy as np
    import pytesseract
except ImportError:
    print(json.dumps({"error": "Biometric dependencies are missing. Install opencv-contrib-python, numpy and pytesseract."}))
    sys.exit(0)

BASE = os.path.dirname(os.path.abspath(__file__))


def configure_tesseract():
    """Locate Tesseract in the backend process, not just in an interactive shell.

    Windows installers commonly omit tesseract.exe from PATH. In that case
    Python package installation/version checks can succeed while the Node
    worker cannot run OCR. An explicit environment override always wins.
    """
    explicit = os.getenv("FITPULSE_TESSERACT_EXE", "").strip().strip('"')
    if explicit:
        pytesseract.pytesseract.tesseract_cmd = explicit
        return explicit
    installed = shutil.which("tesseract")
    if installed:
        pytesseract.pytesseract.tesseract_cmd = installed
        return installed
    if os.name == "nt":
        candidates = [
            os.path.join(root, "Tesseract-OCR", "tesseract.exe")
            for root in (os.getenv("ProgramFiles"), os.getenv("ProgramFiles(x86)"), os.getenv("LOCALAPPDATA"))
            if root
        ]
        candidates.append(r"C:\Program Files\Tesseract-OCR\tesseract.exe")
        for path in candidates:
            if os.path.isfile(path):
                pytesseract.pytesseract.tesseract_cmd = path
                return path
    return None


configure_tesseract()
DETECTOR = os.getenv("FITPULSE_YUNET_MODEL", os.path.join(BASE, "models", "face_detection_yunet_2023mar.onnx"))
RECOGNIZER = os.getenv("FITPULSE_SFACE_MODEL", os.path.join(BASE, "models", "face_recognition_sface_2021dec.onnx"))

# Exact ID-type text must be visible in OCR; broad country names alone are insufficient.
TYPE_TERMS = {
    "philid": ["PAMBANSANG PAGKAKAKILANLAN", "PHILIPPINE IDENTIFICATION CARD", "PHILSYS", "NATIONAL ID"],
    "ephilid": ["EPHILID", "E PHILID", "DIGITAL NATIONAL ID"],
    "drivers_license": ["DRIVERS LICENSE", "DRIVER LICENSE", "DRIVING LICENSE", "LAND TRANSPORTATION OFFICE"],
    "passport": ["PASSPORT", "PASAPORTE"],
    "umid": ["UNIFIED MULTI PURPOSE", "UNIFIED MULTIPURPOSE", "UMID"],
}


def fail(code, message):
    return {"error": message, "code": code}


def normalize(text):
    text = unicodedata.normalize("NFKD", str(text or ""))
    return re.sub(r"[^A-Z0-9 ]+", " ", "".join(c for c in text.upper() if not unicodedata.combining(c))).strip()


def read_image(value):
    if not isinstance(value, str):
        raise ValueError("A captured photo is required.")
    encoded = value.split(",", 1)[-1]
    if len(encoded) > 5_500_000:
        raise ValueError("The image is too large. Capture a smaller photo.")
    raw = base64.b64decode(encoded, validate=True)
    if len(raw) > 4_000_000:
        raise ValueError("The image is too large. Capture a smaller photo.")
    data = np.frombuffer(raw, dtype=np.uint8)
    img = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if img is None or min(img.shape[:2]) < 160:
        raise ValueError("The captured image is unclear. Try again in brighter light.")
    return img


def read_pdf_document(value):
    """Render at most two PDF pages in memory for the existing OCR/face pipeline.

    One PDF upload replaces separate photo files. First page must show the ID's
    name, type, and portrait; an optional second page can contain the back.
    """
    if not isinstance(value, str) or not value.startswith("data:application/pdf;base64,"):
        raise ValueError("Upload a PDF document of the member's ID.")
    raw = base64.b64decode(value.split(",", 1)[1], validate=True)
    if len(raw) > 4_000_000 or not raw.startswith(b"%PDF-"):
        raise ValueError("The PDF is invalid or exceeds 4 MB.")
    try:
        import fitz  # PyMuPDF, installed separately for optional PDF support
    except ImportError:
        raise RuntimeError("PDF verification requires PyMuPDF. Install it using: py -3 -m pip install PyMuPDF")
    result = []
    try:
        pdf_file = fitz.open(stream=raw, filetype="pdf")
    except Exception:
        raise ValueError("The uploaded PDF is damaged or cannot be opened.") from None
    with pdf_file as pdf:
        if pdf.is_encrypted or not 1 <= pdf.page_count <= 10:
            raise ValueError("Upload an unlocked PDF with 1–10 pages. The first two pages are checked.")
        for index in range(min(2, pdf.page_count)):
            page = pdf[index]
            bounds = page.rect
            if bounds.width <= 0 or bounds.height <= 0:
                raise ValueError("The PDF page is invalid.")
            scale = min(2.5, 1900 / max(bounds.width, bounds.height))
            pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), colorspace=fitz.csRGB, alpha=False)
            rgb = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, 3))
            result.append(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
    return result[0], (result[1] if len(result) > 1 else None)


def make_detector():
    if not os.path.isfile(DETECTOR):
        raise RuntimeError("YuNet face detector is not installed.")
    if not hasattr(cv2, "FaceDetectorYN"):
        raise RuntimeError("OpenCV YuNet face detection is unavailable.")
    return cv2.FaceDetectorYN.create(DETECTOR, "", (320, 320), 0.65, 0.3, 5000)


def document_guidance(req):
    """Conservative frame-by-frame visual advice, not proof of ID authenticity."""
    img = read_image(req.get("image"))
    h, w = img.shape[:2]
    work = cv2.resize(img, (480, max(160, round(480 * h / w))))
    gray = cv2.cvtColor(work, cv2.COLOR_BGR2GRAY)
    brightness = float(np.mean(gray))
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if brightness < 55:
        return {"ok": True, "code": "LOW_LIGHT", "message": "More light needed. Avoid shadows over the ID.", "ready": False}
    if brightness > 233:
        return {"ok": True, "code": "GLARE", "message": "Reduce glare. Tilt the ID away from the light.", "ready": False}
    if sharpness < 24:
        return {"ok": True, "code": "BLURRY", "message": "Hold still. The ID text looks blurry.", "ready": False}
    # Find large rectangular card/document outlines; an approximation may be missing
    # on dark/low-contrast IDs, so do not present it as a verified physical edge.
    edges = cv2.Canny(cv2.GaussianBlur(gray, (5, 5), 0), 45, 125)
    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    candidates = []
    area = float(work.shape[0] * work.shape[1])
    for contour in sorted(contours, key=cv2.contourArea, reverse=True)[:24]:
        perimeter = cv2.arcLength(contour, True)
        if perimeter < 1:
            continue
        approx = cv2.approxPolyDP(contour, 0.03 * perimeter, True)
        if len(approx) != 4 or not cv2.isContourConvex(approx):
            continue
        x, y, bw, bh = cv2.boundingRect(approx)
        fraction = cv2.contourArea(approx) / area
        aspect = max(bw, bh) / max(1, min(bw, bh))
        if 1.25 <= aspect <= 2.4 and .04 < fraction < .94:
            candidates.append((fraction, x, y, bw, bh))
    if candidates:
        fraction, x, y, bw, bh = max(candidates)
        if fraction < .23:
            return {"ok": True, "code": "CLOSER", "message": "Move the ID closer to the camera.", "ready": False}
        if fraction > .78 or x < 6 or y < 6 or x + bw > work.shape[1] - 6 or y + bh > work.shape[0] - 6:
            return {"ok": True, "code": "FRAME", "message": "Move back slightly. Keep all four corners visible.", "ready": False}
        center_offset = abs(x + bw / 2 - work.shape[1] / 2) / work.shape[1]
        if center_offset > .18:
            return {"ok": True, "code": "CENTER", "message": "Center the ID inside the outline.", "ready": False}
    return {"ok": True, "code": "POSITION_OK", "message": "Position looks good. Hold still before capturing.", "ready": True}


def face_guidance(req, detector):
    img = read_image(req.get("image"))
    try:
        work, face = best_face(img, detector, "live")
        direction = float(yaw(face))
    except ValueError as exc:
        return {"ok": True, "found": False, "message": str(exc)}
    x, y, fw, fh = [float(n) for n in face[:4]]
    center = (x + fw / 2) / work.shape[1]
    if center < .29 or center > .71 or fw / work.shape[1] < .13:
        return {"ok": True, "found": False, "message": "Center your face and move closer to the camera."}
    return {"ok": True, "found": True, "yaw": round(direction, 4), "message": "Face detected."}


def check_motion_evidence(motion, detector, recognizer, main_embeddings, angles):
    """A neutral->turned sequence is mandatory for each turn, in addition to
    matching the identity across all views. It is a motion check, not
    presentation-attack detection; prerecorded video can still bypass it."""
    if not isinstance(motion, dict):
        return fail("MOTION_REQUIRED", "Complete the live head-turn motion check before continuing.")
    for step in ("right", "left"):
        samples = motion.get(step)
        if not isinstance(samples, dict):
            return fail("MOTION_REQUIRED", "Look forward, then turn your head when prompted.")
        neutral_img = read_image(samples.get("neutral"))
        turned_img = read_image(samples.get("turned"))
        neutral_embed, neutral_face = descriptor(neutral_img, detector, recognizer)
        turned_embed, turned_face = descriptor(turned_img, detector, recognizer)
        neutral_angle = yaw(neutral_face)
        turned_angle = yaw(turned_face)
        if abs(neutral_angle) > .17 or abs(turned_angle) < .18 or abs(turned_angle - neutral_angle) < .19:
            return fail("MOTION_FAILED", "Look forward first, then visibly turn your head as instructed.")
        if turned_angle * angles[step] <= 0 or abs(turned_angle - angles[step]) > .18:
            return fail("MOTION_FAILED", "Hold your head at the requested turn when capturing.")
        if min(cosine(neutral_embed, main_embeddings["front"]),
               cosine(turned_embed, main_embeddings["front"])) < .36:
            return fail("LIVENESS_FACE_MISMATCH", "The same person must complete the live movement and face check.")
    return None


def models():
    if not os.path.isfile(DETECTOR) or not os.path.isfile(RECOGNIZER):
        raise RuntimeError("Face models are not installed. Follow server/biometrics/README.md before using verification.")
    if not hasattr(cv2, "FaceDetectorYN") or not hasattr(cv2, "FaceRecognizerSF"):
        raise RuntimeError("OpenCV face models require opencv-contrib-python.")
    return make_detector(), cv2.FaceRecognizerSF.create(RECOGNIZER, "")


def best_face(img, detector, kind):
    # Multi-scale ID processing accommodates small portraits without relying on a blind crop.
    h, w = img.shape[:2]
    candidate_scales = [min(1280 / max(h, w), 1.0)] if kind == "live" else [min(1400 / max(h, w), 1.0), min(2000 / max(h, w), 2.0)]
    found = []
    for scale in candidate_scales:
        work = cv2.resize(img, (max(160, int(w * scale)), max(160, int(h * scale))))
        detector.setInputSize((work.shape[1], work.shape[0]))
        _, faces = detector.detect(work)
        if faces is not None:
            for face in faces:
                x, y, fw, fh = face[:4]
                if min(fw, fh) < (16 if kind == "id" else 65):
                    continue
                if kind == "live" and fw * fh < (work.shape[0] * work.shape[1]) * .02:
                    continue
                found.append((float(face[14]), float(fw * fh), work, face))
    if not found:
        raise ValueError("The ID portrait could not be detected clearly." if kind == "id" else "No clear face detected. Face the camera in good light.")
    found.sort(key=lambda f: (f[0] * min(f[1] / 12000, 1), f[1]), reverse=True)
    # Reject multiple live faces to avoid switching identities during liveness checks.
    if kind == "live":
        strong = [f for f in found if f[0] > .8 and f[1] > found[0][1] * .55]
        if len(strong) > 1:
            raise ValueError("Only one person may appear in the camera.")
    return found[0][2], found[0][3]


def descriptor(img, detector, recognizer, kind="live"):
    image, face = best_face(img, detector, kind)
    aligned = recognizer.alignCrop(image, face)
    vector = recognizer.feature(aligned).reshape(-1).astype(np.float64)
    norm = np.linalg.norm(vector)
    if not np.isfinite(norm) or norm <= 0 or vector.size != 128:
        raise ValueError("Could not extract a reliable face template.")
    return (vector / norm).tolist(), face


def yaw(face):
    # YuNet: eye points x4/x6, nose x8. Pose estimate is normalized for face size.
    eyes = sorted([float(face[4]), float(face[6])])
    separation = eyes[1] - eyes[0]
    if separation < 1:
        raise ValueError("Both eyes must be visible for the head-turn check.")
    return (float(face[8]) - (eyes[0] + eyes[1]) / 2) / separation


def cosine(a, b):
    left, right = np.asarray(a, dtype=np.float64), np.asarray(b, dtype=np.float64)
    if left.shape != (128,) or right.shape != (128,) or not np.all(np.isfinite(left)) or not np.all(np.isfinite(right)):
        raise ValueError("Invalid face template.")
    return float(np.dot(left, right) / (np.linalg.norm(left) * np.linalg.norm(right)))


def verify_id(req, detector, recognizer):
    # The single-file PDF path reuses exactly the same front-page OCR and portrait
    # checks as a camera photo. When present, page two is checked for legibility.
    is_pdf = "document" in req
    if is_pdf:
        img, back = read_pdf_document(req.get("document"))
    else:
        img = read_image(req.get("image"))
        back = None
        if req.get("idType") != "passport":
            back_value = req.get("backImage")
            if back_value == req.get("image"):
                return fail("ID_BACK_REQUIRED", "Capture the back of the ID separately from the front.")
            back = read_image(back_value)
    if back is not None and np.std(cv2.cvtColor(back, cv2.COLOR_BGR2GRAY)) < 10:
        return fail("ID_BACK_UNCLEAR", "The back of the ID is unclear. Retake the back photo or PDF.")
    # Rotate/denoise mildly for OCR, but do not infer an ID type from the user's selection.
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    zoom = max(1.0, min(2.0, 1600.0 / max(gray.shape)))
    gray = cv2.resize(gray, None, fx=zoom, fy=zoom)
    clahe = cv2.createCLAHE(clipLimit=2, tileGridSize=(8, 8)).apply(gray)
    text = " ".join([pytesseract.image_to_string(image, config="--psm 11") for image in (gray, clahe)])
    normalized = normalize(text)
    kind = req.get("idType")
    terms = TYPE_TERMS.get(kind)
    if not terms:
        return fail("ID_TYPE_UNSUPPORTED", "Choose a supported ID type.")
    if not any(normalize(term) in normalized for term in terms):
        return fail("ID_TYPE_MISMATCH", "The captured ID does not match the chosen ID type, or its label is unreadable.")
    name_tokens = [x for x in normalize(req.get("name")).split() if len(x) > 1]
    if len(name_tokens) < 2:
        return fail("NAME_REQUIRED", "Enter the member's full name before verification.")
    # Require first and last names, tolerate OCR line separation and middle-name omissions.
    compact = normalized.replace(" ", "")
    if not all(t in normalized.split() or t in compact for t in (name_tokens[0], name_tokens[-1])):
        return fail("ID_DETAILS_MISMATCH", "Make sure ID details matches with the entered details")
    embedding, _ = descriptor(img, detector, recognizer, "id")
    return {"ok": True, "embedding": embedding, "idType": kind}


def verify_face(req, detector, recognizer):
    stages = req.get("frames") or {}
    embeddings, angles = {}, {}
    for step in ("right", "left", "front"):
        embedding, detected = descriptor(read_image(stages.get(step)), detector, recognizer)
        embeddings[step] = embedding
        angles[step] = yaw(detected)
    # Opposite signed turns prevent submitting three similar frontal pictures.
    if not ((angles["right"] > .18 and angles["left"] < -.18) or (angles["right"] < -.18 and angles["left"] > .18)):
        return fail("HEAD_TURN_FAILED", "Turn your head clearly to the right and left in the requested steps, then retry.")
    if abs(angles["front"]) > .25:
        return fail("FRONT_FACE_REQUIRED", "Face the camera directly for the final scan.")
    if cosine(embeddings["right"], embeddings["front"]) < .36 or cosine(embeddings["left"], embeddings["front"]) < .36:
        return fail("LIVENESS_FACE_MISMATCH", "The same person must complete every head-turn step.")
    motion_error = check_motion_evidence(req.get("motion"), detector, recognizer, embeddings, angles)
    if motion_error is not None:
        return motion_error
    reference = req.get("embedding")
    if cosine(reference, embeddings["front"]) < .45:
        return fail("FACE_MISMATCH", "The face does not match the ID portrait or registered member.")
    return {"ok": True, "embedding": embeddings["front"]}


def main():
    task = None
    try:
        req = json.loads(sys.stdin.read())
        task = req.get("task")
        if task == "id-guidance":
            result = document_guidance(req)
        elif task == "face-guidance":
            result = face_guidance(req, make_detector())
        elif task in ("id", "face"):
            detector, recognizer = models()
            if task == "id":
                result = verify_id(req, detector, recognizer)
            else:
                result = verify_face(req, detector, recognizer)
        else:
            result = fail("INVALID_TASK", "Unsupported verification operation.")
        print(json.dumps(result, allow_nan=False))
    except pytesseract.TesseractNotFoundError:
        # This can happen when Tesseract works in an interactive terminal but
        # the Express backend was launched without FITPULSE_TESSERACT_EXE.
        print(json.dumps(fail("VERIFICATION_UNAVAILABLE", "Tesseract OCR was not found by the FitPulse backend. Set FITPULSE_TESSERACT_EXE to the installed tesseract.exe path and restart the server.")))
    except pytesseract.TesseractError:
        # Do not echo stderr; some Tesseract errors include input locations.
        print(json.dumps(fail("VERIFICATION_UNAVAILABLE", "Tesseract could not read the ID. Verify the OCR installation and English language data, then try again.")))
    except (ValueError, RuntimeError, cv2.error) as exc:
        print(json.dumps(fail("VERIFICATION_FAILED", str(exc))))
    except Exception as exc:
        # Keep image content, OCR text and embeddings out of error responses.
        action = "ID" if task == "id" else "Facial" if task == "face" else "Live image"
        message = f"{action} verification could not complete. Check the backend setup and try again."
        if os.getenv("FITPULSE_BIOMETRIC_DEBUG") == "1":
            import traceback
            frames = traceback.extract_tb(exc.__traceback__)
            worker_frame = next(
                (frame for frame in reversed(frames) if os.path.abspath(frame.filename) == os.path.abspath(__file__)),
                None,
            )
            if worker_frame is not None:
                message += f" [diagnostic: {type(exc).__name__} in {worker_frame.name} at verify.py:{worker_frame.lineno}]"
            else:
                message += f" [diagnostic: {type(exc).__name__}]"
        print(json.dumps(fail("VERIFICATION_UNAVAILABLE", message)))


if __name__ == "__main__":
    main()
