import { useState } from 'react'
import { Modal } from '../admin/AdminDialogParts'
import IdentityCamera from '../IdentityCamera'
import { apiRequest } from '../../utils/api'
import '../VerificationFlow.css'

const ID_TYPES = [
  ['philid', 'Philippine National ID (PhilID)'],
  ['ephilid', 'ePhilID / Digital National ID'],
  ['drivers_license', "Driver's License"],
  ['passport', 'Philippine Passport'],
  ['umid', 'UMID']
]

const PROGRESS = [
  { key: 'details', label: 'Details' },
  { key: 'id', label: 'ID scan' },
  { key: 'face', label: 'Face' },
  { key: 'closeup', label: 'Close-up' }
]

function Progress({ current }) {
  const active = PROGRESS.findIndex(item => item.key === current)
  return (
    <nav className="fp-verification-progress" aria-label="Create member steps">
      {PROGRESS.map(({ key, label }, index) => (
        <div key={key} className={`fp-verification-progress-item ${index === active ? 'is-current' : ''} ${index < active ? 'is-complete' : ''}`} aria-current={index === active ? 'step' : undefined}>
          <div className="fp-verification-track" />
          <span>{label}</span>
        </div>
      ))}
    </nav>
  )
}

const EMPTY_DETAILS = { name: '', email: '', phone: '', plan: '' }
const MAX_UPLOAD_BYTES = 4_000_000

function readIdentityFile(file, format) {
  if (!file) return Promise.resolve(null)
  if (file.size > MAX_UPLOAD_BYTES) return Promise.reject(new Error('Choose a file smaller than 4 MB.'))
  const pdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
  if (format === 'pdf' ? !pdf : pdf || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    return Promise.reject(new Error(format === 'pdf' ? 'Upload a PDF document.' : 'Upload a JPEG, PNG, or WebP photo.'))
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(format === 'pdf' ? String(reader.result).replace(/^data:[^,]*,/, 'data:application/pdf;base64,') : reader.result)
    reader.onerror = () => reject(new Error('Unable to read the selected file.'))
    reader.readAsDataURL(file)
  })
}

/**
 * Four-stage enrollment. Original ID/camera photos remain only in browser memory until
 * verification and are never sent to the member-registration endpoint.
 * Front/back camera actions remain explicitly separate; PDF upload is one file.
 */
export default function CreateMemberSheet({ plans, planOptionLabel, pending, error, fieldError, onClose, onCreate, token }) {
  const [step, setStep] = useState('details')
  const [details, setDetails] = useState(EMPTY_DETAILS)
  const [method, setMethod] = useState('Cash')
  const [idType, setIdType] = useState('')
  const [consent, setConsent] = useState(false)
  const [idSide, setIdSide] = useState('front')
  const [idInputMode, setIdInputMode] = useState('camera')
  const [idPdf, setIdPdf] = useState(null)
  const [idPdfName, setIdPdfName] = useState('')
  const [idFront, setIdFront] = useState(null)
  const [idBack, setIdBack] = useState(null)
  const [idTicket, setIdTicket] = useState('')
  const [faceTurn, setFaceTurn] = useState('right')
  const [faceFrames, setFaceFrames] = useState({})
  const [faceMotion, setFaceMotion] = useState({})
  const [localPending, setLocalPending] = useState(false)
  const [localError, setLocalError] = useState('')
  const busy = pending || localPending
  const requiresBackSide = idType && idType !== 'passport'
  const uploadReady = Boolean(idPdf || (idFront && (!requiresBackSide || idBack)))

  function moveTo(next) {
    setLocalError('')
    setStep(next)
  }

  function resetIdScan() {
    setIdFront(null)
    setIdBack(null)
    setIdPdf(null)
    setIdPdfName('')
    setIdTicket('')
    setIdSide('front')
    setFaceFrames({})
    setFaceMotion({})
    setFaceTurn('right')
    moveTo('id')
  }

  function goBack() {
    if (busy || step === 'details') return
    if (step === 'id') return moveTo('details')
    if (step === 'face') return resetIdScan()
    if (step === 'closeup') {
      setFaceFrames({})
      setFaceMotion({})
      setFaceTurn('right')
      return moveTo('face')
    }
    return resetIdScan()
  }

  function submitDetails(event) {
    event.preventDefault()
    if (!consent || !idType || !method) {
      setLocalError('Select a payment method and ID type, and obtain member consent.')
      return
    }
    setDetails(current => ({ ...current, name: current.name.trim(), email: current.email.trim().toLowerCase(), phone: current.phone.trim() }))
    resetIdScan()
  }

  function captureFront(image) {
    setIdPdf(null)
    setIdFront(image)
    setIdBack(null)
    setIdSide('done') // Stay on ID page; the admin must explicitly start the back camera.
    setLocalError('')
  }

  function captureBack(image) {
    setIdBack(image)
    setIdSide('done') // No automatic verification or navigation.
    setLocalError('')
  }

  function changeIdMode(mode) {
    if (busy || mode === idInputMode) return
    setIdInputMode(mode)
    setIdFront(null)
    setIdBack(null)
    setIdPdf(null)
    setIdPdfName('')
    setIdSide(mode === 'camera' ? 'front' : 'done')
    setLocalError('')
  }

  async function uploadIdFile(event, kind) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || busy) return
    setLocalError('')
    try {
      const value = await readIdentityFile(file, kind)
      if (!value) return
      if (kind === 'pdf') {
        setIdPdf(value)
        setIdPdfName(file.name)
        setIdFront(null)
        setIdBack(null)
      } else if (kind === 'front') {
        setIdPdf(null)
        setIdPdfName('')
        setIdFront(value)
        setIdBack(null)
      } else {
        setIdBack(value)
      }
      setIdSide('done')
    } catch (cause) {
      setLocalError(cause.message || 'Unable to read this ID file.')
    }
  }

  function validateIdInputs() {
    if (idPdf) return true
    if (!idFront) {
      setLocalError(idInputMode === 'upload' ? 'Upload the front of the ID before continuing.' : 'Capture the front of the ID before continuing.')
      return false
    }
    if (requiresBackSide && !idBack) {
      setLocalError(idInputMode === 'upload' ? 'Upload the back of the ID before continuing.' : 'Capture the back of the ID before continuing.')
      return false
    }
    return true
  }

  async function verifyId(frontImage, backImage, pdfDocument = null) {
    setLocalPending(true)
    setLocalError('')
    try {
      const result = await apiRequest('/admin/identity/verify-id', {
        token,
        method: 'POST',
        body: JSON.stringify({
          name: details.name,
          email: details.email,
          idType,
          consent,
          ...(pdfDocument ? { document: pdfDocument } : { image: frontImage, ...(backImage ? { backImage } : {}) })
        })
      })
      setIdTicket(result.ticket)
      setIdFront(null)
      setIdBack(null)
      setIdPdf(null)
      setIdPdfName('')
      setFaceFrames({})
      setFaceMotion({})
      setFaceTurn('right')
      moveTo('face')
    } catch (cause) {
      setLocalError(cause.message || 'The ID could not be verified. Retake the image.')
    } finally {
      setLocalPending(false)
    }
  }

  function captureTurn(image, evidence) {
    // Both samples were taken from the continuous live view, not upload controls.
    if (!evidence?.neutral || !evidence?.turned) {
      setLocalError('Look forward and complete the live head turn before capturing.')
      return
    }
    setFaceMotion(old => ({ ...old, [faceTurn]: evidence }))
    if (faceTurn === 'right') {
      setFaceFrames({ right: image })
      setFaceTurn('left')
    } else {
      setFaceFrames(old => ({ ...old, left: image }))
      moveTo('closeup')
    }
  }

  async function captureCloseup(image) {
    setLocalPending(true)
    setLocalError('')
    try {
      const result = await apiRequest('/admin/identity/verify-face', {
        token,
        method: 'POST',
        body: JSON.stringify({ ticket: idTicket, frames: { ...faceFrames, front: image }, motion: faceMotion })
      })
      // The existing registration handler owns password display and database errors.
      moveTo('creating')
      await onCreate({ ...details, method, recordPayment: true, enrollmentProof: result.enrollmentProof })
    } catch (cause) {
      setLocalError(cause.message || 'Face verification could not be completed.')
    } finally {
      setLocalPending(false)
    }
  }

  const active = step === 'creating' ? 'closeup' : step
  const stepNumber = PROGRESS.findIndex(item => item.key === active) + 1
  const subtitle = {
    details: 'Member details',
    id: 'Scan ID front and back',
    face: 'Face check · head turns',
    closeup: 'Face check · normal view',
    creating: 'Confirming member account'
  }[step]

  return (
    <Modal
      title="Create member account"
      className="fitpulse-onboarding-dialog fp-verification-dialog"
      busy={busy}
      error={localError || error}
      invalidField={fieldError}
      onClose={onClose}
      dismissOnBackdrop={false}
      dismissOnEscape={false}
    >
      <p className="fp-verification-subtitle">Step {stepNumber} of 4 · {subtitle}</p>
      <Progress current={active} />

      {step === 'details' && (
        <form className="fp-verification-content" onSubmit={submitDetails}>
          <h3>Member details</h3>
          <div className="fp-verification-form-grid">
            <label className="field"><span className="fp-field-label">Full name <span className="fp-required">*</span></span>
              <input className="clay-in" name="name" value={details.name} onChange={e => setDetails(d => ({ ...d, name: e.target.value }))} maxLength={100} required placeholder="Juan Dela Cruz" />
            </label>
            <label className="field"><span className="fp-field-label">Contact number <span className="fp-optional">(optional)</span></span>
              <input className="clay-in" name="phone" type="tel" value={details.phone} onChange={e => setDetails(d => ({ ...d, phone: e.target.value }))} placeholder="09XX XXX XXXX" />
            </label>
            <label className="field"><span className="fp-field-label">Email <span className="fp-required">*</span></span>
              <input className="clay-in" name="email" type="email" value={details.email} onChange={e => setDetails(d => ({ ...d, email: e.target.value }))} required placeholder="juan123@gmail.com" />
            </label>
            <label className="field"><span className="fp-field-label">Plan <span className="fp-required">*</span></span>
              <select className="clay-in" name="plan" value={details.plan} onChange={e => setDetails(d => ({ ...d, plan: e.target.value }))} required>
                <option value="" disabled>Select a plan</option>
                {plans.map(plan => <option key={plan.plan_id} value={plan.plan_name}>{planOptionLabel(plan)}</option>)}
              </select>
            </label>
          </div>
          <p className="fp-verification-hint">Student plans require a valid school ID before selection.</p>

          <h3>Payment</h3>
          <div className="fp-payment-switch" role="group" aria-label="Payment method">
            {['Cash', 'GCash'].map(value => (
              <button key={value} type="button" className={method === value ? 'selected' : ''} aria-pressed={method === value} onClick={() => setMethod(value)}>{value}</button>
            ))}
          </div>
          <p className="fp-verification-hint">The selected payment method will be recorded during account creation.</p>

          <h3>Identity check</h3>
          <label className="field"><span className="fp-field-label">ID type <span className="fp-required">*</span></span>
            <select className="clay-in" value={idType} onChange={e => setIdType(e.target.value)} required>
              <option value="" disabled>Select an ID type</option>
              {ID_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="fp-consent-row">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required />
            <span>The member agrees to an ID and face check, and to storing a facial template for sign-in.</span>
          </label>
          <details className="fp-privacy-details">
            <summary>Privacy notice</summary>
            The ID and webcam images are processed for verification and are not saved by the verification worker. A facial template is stored with the member account for sign-in.
          </details>
          <div className="fp-verification-footer">
            <p>Fill all required fields and accept consent to continue.</p>
            <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
            <button className="btn" type="submit" disabled={!consent || !idType || !details.name.trim() || !details.email.trim() || !details.plan}>Continue</button>
          </div>
        </form>
      )}

      {step === 'id' && (
        <div className="fp-verification-content">
          <h3>Verify the member's ID</h3>
          <div className="fp-payment-switch fp-id-mode-switch" role="group" aria-label="ID verification source">
            <button type="button" className={idInputMode === 'camera' ? 'selected' : ''} aria-pressed={idInputMode === 'camera'} disabled={busy} onClick={() => changeIdMode('camera')}>Live camera</button>
            <button type="button" className={idInputMode === 'upload' ? 'selected' : ''} aria-pressed={idInputMode === 'upload'} disabled={busy} onClick={() => changeIdMode('upload')}>Upload ID</button>
          </div>
          {idInputMode === 'upload' && (
            <div className="fp-id-pdf-option">
              <label className="field"><span className="fp-field-label">Upload one PDF (front and back pages can be in the same file)</span>
                <input className="clay-in fp-id-file" type="file" accept=".pdf,application/pdf" disabled={busy} onChange={event => uploadIdFile(event, 'pdf')} />
              </label>
              <p className="fp-verification-hint">One PDF is sufficient. For images, upload the front and back separately. Maximum 4 MB per file.</p>
            </div>
          )}
          <div className="fp-id-side-by-side" aria-label="Front and back ID capture status">
            <div className={`fp-id-side-card ${idInputMode === 'camera' && idSide === 'front' ? 'is-active' : ''}`}>
              <div className="fp-id-card-heading"><strong>Front of ID</strong><span>{idPdf ? '✓ PDF uploaded' : idFront ? '✓ Captured' : idSide === 'front' && idInputMode === 'camera' ? '● Live' : 'Not captured'}</span></div>
              {idPdf ? <div className="fp-id-card-empty fp-id-pdf-preview"><strong>PDF document</strong><span title={idPdfName}>{idPdfName}</span></div> : idFront ? <img src={idFront} alt="Front of ID" /> : <div className="fp-id-card-empty">Front · name and portrait</div>}
              {idInputMode === 'upload' && (
                <label className="fp-id-upload-label">{idFront ? 'Replace front image' : 'Upload front image'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => uploadIdFile(event, 'front')} />
                </label>
              )}
              {idInputMode === 'camera' && idFront && <button type="button" className="fp-id-inline-action" disabled={busy} onClick={() => { setIdFront(null); setIdBack(null); setIdSide('front') }}>Retake front</button>}
            </div>
            <div className={`fp-id-side-card ${idInputMode === 'camera' && idSide === 'back' ? 'is-active' : ''}`}>
              <div className="fp-id-card-heading"><strong>{idType === 'passport' ? 'Photo/details page' : 'Back of ID'}</strong><span>{idPdf ? 'Included in PDF' : idType === 'passport' ? 'Not required' : idBack ? '✓ Captured' : idSide === 'back' && idInputMode === 'camera' ? '● Live' : 'Not captured'}</span></div>
              {idPdf ? <div className="fp-id-card-empty">PDF is checked as a single document</div> : idType === 'passport' ? <div className="fp-id-card-empty">No back scan required</div> : idBack ? <img src={idBack} alt="Back of ID" /> : <div className="fp-id-card-empty">Back · reverse side</div>}
              {idInputMode === 'upload' && idType !== 'passport' && !idPdf && (
                <label className="fp-id-upload-label">{idBack ? 'Replace back image' : 'Upload back image'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => uploadIdFile(event, 'back')} />
                </label>
              )}
              {idInputMode === 'camera' && idBack && <button type="button" className="fp-id-inline-action" disabled={busy} onClick={() => { setIdBack(null); setIdSide('back') }}>Retake back</button>}
              {idInputMode === 'camera' && idType !== 'passport' && idFront && !idBack && idSide !== 'back' && <button type="button" className="fp-id-inline-action" disabled={busy} onClick={() => setIdSide('back')}>Scan back of ID</button>}
            </div>
          </div>
          {idInputMode === 'camera' && (idSide === 'front' || idSide === 'back') && (
            <IdentityCamera
              key={`id-${idSide}`}
              autoCapture
              facingMode="environment"
              overlay="id"
              side={idSide}
              disabled={busy}
              guide={{ type: 'id', token }}
              instruction={idSide === 'front' ? 'Show the FRONT of your ID and hold still; the camera captures it automatically.' : 'Show the BACK of your ID and hold still for automatic capture.'}
              onCapture={idSide === 'front' ? captureFront : captureBack}
            />
          )}
          {idInputMode === 'camera' && idSide === 'done' && <p className="fp-verification-hint" role="status">{idFront ? 'Front captured. ' : ''}{requiresBackSide && !idBack ? 'Choose Scan back of ID when ready; the camera will not open automatically.' : 'Both required sides are ready. Select Verify ID and continue.'}</p>}
          {idInputMode === 'upload' && <p className="fp-verification-hint" role="status">Uploaded IDs undergo the same name, ID-type, and portrait verification. Uploading an ID does not bypass the live face check, and the step will not continue until you select Verify ID and continue.</p>}
          <div className="fp-verification-footer">
            <p>{idInputMode === 'camera' ? 'Auto-capture begins when the live quality and hold-still checks pass. Starting the back scan remains manual.' : uploadReady ? 'Required upload(s) are present. Select Verify ID and continue to validate the document before moving to the next step.' : requiresBackSide ? 'Upload the front and back images, or upload one PDF, before continuing.' : 'Upload the ID image, or upload one PDF, before continuing.'}</p>
            <button className="btn ghost" type="button" disabled={busy} onClick={goBack}>Back</button>
            <button className="btn" type="button" disabled={busy} onClick={() => { if (validateIdInputs()) verifyId(idFront, idBack, idPdf) }}>
              {busy ? 'Checking ID…' : 'Verify ID and continue'}
            </button>
          </div>
        </div>
      )}

      {step === 'face' && (
        <div className="fp-verification-content">
          <h3>Face check · {faceTurn === 'right' ? 'turn right' : 'turn left'}</h3>
          <IdentityCamera
            key={faceTurn}
            autoCapture
            overlay="face"
            guide={{ type: 'face', stage: faceTurn, token, ticket: idTicket, oppositeYaw: faceTurn === 'left' ? faceMotion.right?.yaw : undefined }}
            disabled={busy}
            instruction={faceTurn === 'right' ? 'Look forward, then TURN RIGHT and hold still for automatic capture.' : 'Look forward, then TURN LEFT and hold still for automatic capture.'}
            captureLabel={faceTurn === 'right' ? 'Capture right turn' : 'Capture left turn'}
            onCapture={captureTurn}
          />
          <div className="fp-verification-checks">
            <div className={faceFrames.right ? 'done' : 'current'}>{faceFrames.right ? '✓' : '○'} Turn right</div>
            <div className={faceFrames.left ? 'done' : faceTurn === 'left' ? 'current' : ''}>{faceFrames.left ? '✓' : '○'} Turn left</div>
            <div>○ Normal-view close-up next</div>
          </div>
          <div className="fp-verification-footer">
            <p>One person only. Use natural lighting and keep your face visible.</p>
            <button className="btn ghost" type="button" disabled={busy} onClick={goBack}>Back</button>
            {faceTurn === 'left' && <button className="btn ghost" type="button" disabled={busy} onClick={() => { setFaceFrames({}); setFaceMotion({}); setFaceTurn('right') }}>Restart turns</button>}
          </div>
        </div>
      )}

      {step === 'closeup' && (
        <div className="fp-verification-content">
          <h3>Face check · normal view</h3>
          <IdentityCamera
            key="face-closeup"
            autoCapture
            overlay="face"
            guide={{ type: 'face', stage: 'front', token, ticket: idTicket }}
            disabled={busy}
            instruction="Look straight ahead and fit your face in the oval. The camera automatically captures a clear frontal image and checks it against the ID portrait."
            captureLabel={busy ? 'Verifying…' : 'Capture close-up and verify'}
            onCapture={captureCloseup}
          />
          <div className="fp-verification-checks">
            <div className="done">✓ Right turn captured</div>
            <div className="done">✓ Left turn captured</div>
            <div className="current">○ Match live face with ID portrait</div>
          </div>
          <div className="fp-verification-footer">
            <p>The temporary password will be displayed once the member account is created.</p>
            <button type="button" className="btn ghost" disabled={busy} onClick={goBack}>Back</button>
          </div>
        </div>
      )}

      {step === 'creating' && (
        <div className="fp-verification-content">
          <h3>Confirming account</h3>
          <p role="status">{busy ? 'Saving member details, payment, and face enrollment…' : 'Account creation was not confirmed. Check the Auth account and member profile before retrying.'}</p>
          {!busy && <button className="btn ghost" type="button" onClick={goBack}>Restart identity verification</button>}
        </div>
      )}
    </Modal>
  )
}
