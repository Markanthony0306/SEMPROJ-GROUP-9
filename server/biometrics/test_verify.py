"""Fast offline tests that do not require external model files."""
import unittest
import io
import os
import json
from contextlib import redirect_stdout
from unittest.mock import patch
import numpy as np
import verify


class BiometricWorkerTests(unittest.TestCase):
    def test_configure_tesseract_explicit_path(self):
        old = verify.pytesseract.pytesseract.tesseract_cmd
        try:
            with patch.dict(os.environ, {"FITPULSE_TESSERACT_EXE": r"C:\Program Files\Tesseract-OCR\tesseract.exe"}):
                self.assertEqual(verify.configure_tesseract(), r"C:\Program Files\Tesseract-OCR\tesseract.exe")
                self.assertEqual(verify.pytesseract.pytesseract.tesseract_cmd, r"C:\Program Files\Tesseract-OCR\tesseract.exe")
        finally:
            verify.pytesseract.pytesseract.tesseract_cmd = old

    def test_configure_tesseract_finds_common_windows_install(self):
        old = verify.pytesseract.pytesseract.tesseract_cmd
        try:
            with patch.dict(os.environ, {"FITPULSE_TESSERACT_EXE": "", "ProgramFiles": r"C:\Program Files"}), \
                    patch.object(verify.os, "name", "nt"), \
                    patch.object(verify.shutil, "which", return_value=None), \
                    patch.object(verify.os.path, "isfile", side_effect=lambda path: path == r"C:\Program Files/Tesseract-OCR/tesseract.exe" or path == r"C:\Program Files\Tesseract-OCR\tesseract.exe"):
                path = verify.configure_tesseract()
                self.assertTrue(path and path.lower().endswith('tesseract.exe'))
                self.assertEqual(verify.pytesseract.pytesseract.tesseract_cmd, path)
        finally:
            verify.pytesseract.pytesseract.tesseract_cmd = old

    def test_missing_tesseract_reports_ocr_failure(self):
        with patch.object(verify.sys, "stdin", io.StringIO('{"task":"id"}')), \
                patch.object(verify, "models", return_value=(None, None)), \
                patch.object(verify, "verify_id", side_effect=verify.pytesseract.TesseractNotFoundError()), \
                redirect_stdout(io.StringIO()) as output:
            verify.main()
        result = json.loads(output.getvalue())
        self.assertEqual(result['code'], 'VERIFICATION_UNAVAILABLE')
        self.assertIn('Tesseract OCR', result['error'])
        self.assertNotIn('Face verification', result['error'])

    def test_unexpected_id_error_identifies_stage(self):
        with patch.object(verify.sys, "stdin", io.StringIO('{"task":"id"}')), \
                patch.object(verify, "models", return_value=(None, None)), \
                patch.object(verify, "verify_id", side_effect=AttributeError('fake test data')), \
                patch.dict(os.environ, {"FITPULSE_BIOMETRIC_DEBUG": "1"}), \
                redirect_stdout(io.StringIO()) as output:
            verify.main()
        result = json.loads(output.getvalue())
        self.assertIn('ID verification could not complete', result['error'])
        self.assertIn('diagnostic: AttributeError', result['error'])
        self.assertNotIn('fake test data', result['error'])

    def test_normalizes_name(self):
        self.assertEqual(verify.normalize('  José M. Cruz!  '), 'JOSE M  CRUZ')

    def test_supported_ids(self):
        self.assertIn('passport', verify.TYPE_TERMS)
        self.assertIn('philid', verify.TYPE_TERMS)

    def test_matching_cosine(self):
        a = np.zeros(128); a[0] = 1
        b = np.zeros(128); b[1] = 1
        self.assertAlmostEqual(verify.cosine(a, a), 1)
        self.assertAlmostEqual(verify.cosine(a, b), 0)

    def test_front_and_back_must_not_be_identical(self):
        import cv2
        import base64
        image = np.full((220, 330, 3), 128, dtype=np.uint8)
        success, binary = cv2.imencode('.jpg', image)
        self.assertTrue(success)
        photo = 'data:image/jpeg;base64,' + base64.b64encode(binary.tobytes()).decode('ascii')
        result = verify.verify_id({"image": photo, "backImage": photo, "idType": "philid"}, None, None)
        self.assertEqual(result["code"], "ID_BACK_REQUIRED")

    def test_single_pdf_renders_front_page_without_back_photo(self):
        import fitz
        import base64
        pdf = fitz.open()
        page = pdf.new_page(width=600, height=360)
        page.insert_text((40, 50), "PHILIPPINE IDENTIFICATION CARD")
        raw = pdf.tobytes()
        pdf.close()
        encoded = 'data:application/pdf;base64,' + base64.b64encode(raw).decode('ascii')
        front, back = verify.read_pdf_document(encoded)
        self.assertIsNone(back)
        self.assertGreater(front.shape[1], 160)

    def test_pdf_with_two_pages_renders_front_and_back(self):
        import fitz
        import base64
        pdf = fitz.open()
        for name in ("Front", "Back"):
            page = pdf.new_page(width=450, height=300)
            page.insert_text((30, 50), name)
        encoded = 'data:application/pdf;base64,' + base64.b64encode(pdf.tobytes()).decode('ascii')
        pdf.close()
        front, back = verify.read_pdf_document(encoded)
        self.assertEqual(front.shape, back.shape)

    def test_rejects_non_pdf_header(self):
        import base64
        encoded = 'data:application/pdf;base64,' + base64.b64encode(b'not a pdf').decode('ascii')
        with self.assertRaisesRegex(ValueError, 'invalid'):
            verify.read_pdf_document(encoded)

    def test_yaw_uses_nose_relative_to_eyes(self):
        face = [0.] * 15
        face[4], face[6], face[8] = 10., 30., 20.
        self.assertAlmostEqual(verify.yaw(face), 0)
        face[8] = 25.
        self.assertGreater(verify.yaw(face), 0.18)
        face[8] = 15.
        self.assertLess(verify.yaw(face), -0.18)
    def test_missing_motion_is_rejected(self):
        result = verify.check_motion_evidence(None, None, None, {}, {})
        self.assertEqual(result["code"], "MOTION_REQUIRED")

    def test_dark_id_preview_gives_lighting_hint(self):
        image = np.full((300, 480, 3), 30, dtype=np.uint8)
        with patch.object(verify, "read_image", return_value=image):
            result = verify.document_guidance({"image": "data:placeholder"})
        self.assertEqual(result["code"], "LOW_LIGHT")
        self.assertFalse(result["ready"])

    def test_motion_accepts_forward_then_opposite_turns_with_matching_face(self):
        basis = np.zeros(128); basis[0] = 1
        face = np.zeros(15)
        # Two descriptors are evaluated per turn: centered and turned.
        with patch.object(verify, "read_image", return_value=np.zeros((240, 320, 3), np.uint8)), \
                patch.object(verify, "descriptor", return_value=(basis.tolist(), face)), \
                patch.object(verify, "yaw", side_effect=[0., .33, 0., -.31]):
            result = verify.check_motion_evidence({
                "right": {"neutral": "n1", "turned": "t1"},
                "left": {"neutral": "n2", "turned": "t2"},
            }, None, None, {"front": basis.tolist()}, {"right": .32, "left": -.30})
        self.assertIsNone(result)

    def test_motion_requires_neutral_and_a_turn(self):
        basis = np.zeros(128); basis[0] = 1
        angles = {"right": .34, "left": -.32}
        # Mock the decoded photographs and face descriptors to focus on pose sequence.
        def fake_descriptor(_image, _detector, _recognizer):
            return basis.tolist(), np.zeros(15)
        with patch.object(verify, "read_image", return_value=np.zeros((240, 320, 3), np.uint8)), \
                patch.object(verify, "descriptor", side_effect=fake_descriptor), \
                patch.object(verify, "yaw", return_value=.30):
            result = verify.check_motion_evidence({
                "right": {"neutral": "a", "turned": "b"},
                "left": {"neutral": "c", "turned": "d"},
            }, None, None, {"front": basis.tolist()}, angles)
        self.assertEqual(result["code"], "MOTION_FAILED")


if __name__ == '__main__':
    unittest.main()
