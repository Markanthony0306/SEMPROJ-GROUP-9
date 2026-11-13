import { useEffect, useId, useRef, useState } from 'react'
import { memberIdRejectedAttemptLimit, memberIdTypes } from '../../../shared/memberIdTypes'
import { apiRequest } from '../../utils/api'
import { validateMemberIdFile } from '../../utils/memberIdUpload'
import Dialog from '../Dialog'
import FaceCapture from '../FaceCapture'
import Spinner from '../Spinner'
import './MemberIdVerification.css'

export const idVerificationPath = '/admin/id-verifications'

export function idVerificationError(error) {
  if (error.status === 404 && error.message === 'Request failed (404).') {
    return 'This FitPulse API is missing the ID verification routes. Restart it with the current code.'
  }
  return error.message
}

export const idVerificationLabels = {
  awaiting_document: 'Waiting for ID',
  reading_document: 'Reading ID',
  awaiting_face: 'ID saved',
  checking_face: 'Checking face',
  verified: 'Verified',
  approved: 'Approved by administrator',
  rejected: 'Rejected',
  needs_review: 'Needs manual review'
}

export function IdVerificationResult({ verification }) {
  return (
    <section className="id-check-result" aria-live="polite">
      <strong>{idVerificationLabels[verification.status]}</strong>
      {verification.faceMatchScore != null && (
        <p>Face similarity score {verification.faceMatchScore}/100</p>
      )}
      {verification.reasons?.length > 0 && (
        <ul>
          {verification.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
      {verification.reviewNotes && <p>Review notes: {verification.reviewNotes}</p>}
      {verification.rejectedAttempts > 0 && (
        <p>
          {verification.remainingAttempts
            ? `${verification.remainingAttempts} ${verification.remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining.`
            : 'Too many rejected attempts. Please contact the gym admin.'}
        </p>
      )}
    </section>
  )
}

const uploadSlots = {
  front: { label: 'Front of ID', accept: '.jpg,.jpeg,.png' },
  back: { label: 'Back of ID', accept: '.jpg,.jpeg,.png' },
  document: { label: 'Document with both sides', accept: '.pdf,.doc,.docx' }
}

function IdUploadSlot({ side, disabled, onFile }) {
  const { label, accept } = uploadSlots[side]
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const selection = useRef(0)
  const errorId = useId()

  useEffect(
    () => () => {
      selection.current += 1
    },
    []
  )

  useEffect(() => {
    if (!file || side === 'document') return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file, side])

  async function selectFile(selected) {
    if (disabled || !selected) return
    const current = ++selection.current
    setFile(null)
    setPreview('')
    setError('')
    setChecking(true)
    onFile(side, null)
    try {
      const validated = await validateMemberIdFile(selected, side)
      if (selection.current !== current) return
      setFile(validated)
      onFile(side, validated)
    } catch (cause) {
      if (selection.current === current) setError(cause.message)
    } finally {
      if (selection.current === current) setChecking(false)
    }
  }

  return (
    <div
      className="id-check-drop"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        selectFile(event.dataTransfer.files[0])
      }}
    >
      <label className="field">
        {label}
        <input
          type="file"
          accept={accept}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            selectFile(event.target.files[0])
            event.target.value = ''
          }}
        />
      </label>
      {checking && (
        <p className="id-check-progress" role="status">
          <Spinner /> Checking file…
        </p>
      )}
      {error && (
        <p id={errorId} className="form-error" role="alert">
          {error}
        </p>
      )}
      {file && <p className="form-help">{file.name}</p>}
      {preview && <img src={preview} alt={`${label} preview`} />}
    </div>
  )
}

export default function MemberIdWizard({
  token,
  plans,
  planOptionLabel,
  initialCase,
  canEnrollFace,
  pending,
  error,
  onClose,
  onCreate
}) {
  const [step, setStep] = useState(1)
  const [details, setDetails] = useState({
    name: initialCase?.name || '',
    email: initialCase?.email || '',
    phone: '',
    plan: '',
    method: 'Cash',
    recordPayment: false
  })
  const [verification, setVerification] = useState(initialCase || null)
  const [idType, setIdType] = useState(initialCase?.idType || '')
  const [consent, setConsent] = useState(Boolean(initialCase))
  const [uploadMode, setUploadMode] = useState('images')
  const [files, setFiles] = useState({})
  const [uploadVersion, setUploadVersion] = useState(0)
  const [working, setWorking] = useState('')
  const [savingFace, setSavingFace] = useState(false)
  const [retakingFace, setRetakingFace] = useState(false)
  const [issue, setIssue] = useState('')
  const heading = useRef(null)
  const actionLock = useRef(false)
  const busy = pending || savingFace || Boolean(working)
  const endpoint = verification ? `${idVerificationPath}/${verification.id}` : null
  const remainingAttempts = verification?.remainingAttempts ?? memberIdRejectedAttemptLimit
  const canUpload = remainingAttempts > 0 && verification?.status !== 'needs_review'
  const sides = uploadMode === 'images' ? ['front', 'back'] : ['document']
  const readyToUpload = canUpload && consent && idType && sides.every((side) => files[side])
  const hasSavedId = verification?.canEnroll
  const canResume = hasSavedId && Object.keys(files).length === 0

  useEffect(() => {
    heading.current?.focus()
  }, [step])

  function changeField(event) {
    const { name, value, checked, type } = event.target
    setDetails((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  async function run(label, callback) {
    if (actionLock.current || busy) return
    actionLock.current = true
    setIssue('')
    setWorking(label)
    try {
      return await callback()
    } catch (cause) {
      setIssue(idVerificationError(cause))
    } finally {
      setWorking('')
      actionLock.current = false
    }
  }

  function clearUploads() {
    setFiles({})
    setUploadVersion((value) => value + 1)
  }

  function submitDocument(event) {
    event.preventDefault()
    if (canResume) {
      setIssue('')
      setStep(2)
      return
    }
    if (!readyToUpload) return
    void run('Checking the ID files…', async () => {
      let current = verification
      if (!current) {
        const result = await apiRequest(idVerificationPath, {
          token,
          method: 'POST',
          body: JSON.stringify({ ...details, consent: true })
        })
        current = result.verification
        setVerification(current)
        if (!current.remainingAttempts || current.status === 'needs_review') return
      }
      const body = new FormData()
      sides.forEach((side) => body.append(side, files[side]))
      const result = await apiRequest(
        `${idVerificationPath}/${current.id}/document?type=${encodeURIComponent(idType)}`,
        { token, method: 'POST', body }
      )
      clearUploads()
      setVerification(result.verification)
      if (result.verification.canEnroll) setStep(2)
    })
  }

  async function submitFace(capture) {
    setSavingFace(true)
    try {
      const result = await apiRequest(endpoint + '/face', {
        token,
        method: 'POST',
        body: JSON.stringify(capture)
      })
      setVerification(result.verification)
      setRetakingFace(false)
      return result.verification.faceEnrolled
    } finally {
      setSavingFace(false)
    }
  }

  const refreshResult = () =>
    run('Refreshing the ID review…', async () => {
      const result = await apiRequest(endpoint, { token })
      setVerification(result.verification)
    })

  const requestReview = () =>
    run('Sending to the review queue…', async () => {
      const result = await apiRequest(endpoint + '/request-review', { token, method: 'POST' })
      setVerification(result.verification)
      setStep(1)
    })

  return (
    <Dialog title="Create Member Account" onClose={onClose} busy={busy} className="id-check-dialog">
      <div className="mf id-check-wizard">
        <p className="form-help id-check-step">Step {step} of 2</p>
        <h3 ref={heading} tabIndex={-1}>
          {step === 1 ? 'Member details and ID verification' : 'Face enrollment'}
        </h3>
        {(issue || error) && (
          <p className="form-error" role="alert">
            {issue || error}
          </p>
        )}
        {working && (
          <div className="id-check-progress" role="status">
            <Spinner /> {working}
          </div>
        )}
        {step === 1 && (
          <form className="mf" onSubmit={submitDocument}>
            <fieldset className="modal-fields id-check-member-details" disabled={busy}>
              <label className="field">
                Full name
                <input
                  className="clay-in"
                  name="name"
                  value={details.name}
                  onChange={changeField}
                  readOnly={Boolean(verification)}
                  autoComplete="name"
                  required
                  maxLength={100}
                />
              </label>
              <label className="field">
                Contact number
                <input
                  className="clay-in"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={details.phone}
                  onChange={changeField}
                />
              </label>
              <label className="field">
                Email
                <input
                  className="clay-in"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={details.email}
                  onChange={changeField}
                  readOnly={Boolean(verification)}
                  required
                />
              </label>
              <label className="field">
                Plan
                <select
                  className="clay-in"
                  name="plan"
                  value={details.plan}
                  onChange={changeField}
                  required
                >
                  <option value="" disabled>
                    Select a membership plan
                  </option>
                  {plans.map((plan) => (
                    <option key={plan.plan_id} value={plan.plan_name}>
                      {planOptionLabel(plan)}
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>
            <p className="form-help">Confirm eligibility before choosing the Student plan.</p>
            <section className="mf id-check-section" aria-label="Payment">
              <fieldset className="modal-fields id-check-member-details" disabled={busy}>
                <label className="field">
                  Payment method
                  <select
                    className="clay-in"
                    name="method"
                    value={details.method}
                    onChange={changeField}
                  >
                    <option>Cash</option>
                    <option>GCash</option>
                  </select>
                </label>
                <label className="set id-check-consent id-check-payment">
                  <input
                    type="checkbox"
                    name="recordPayment"
                    checked={details.recordPayment}
                    onChange={changeField}
                  />
                  <span>Payment already received</span>
                </label>
              </fieldset>
              <p className="form-help">
                Check payment only after receiving it. A temporary password will be shown once.
              </p>
            </section>
            {verification && <IdVerificationResult verification={verification} />}
            {canUpload && (
              <section className="id-check-section id-check-upload mf" aria-label="Photo ID">
                <h4>Photo ID</h4>
                <p className="form-help">
                  Upload both sides. FitPulse stores the ID and uses the portrait to confirm the
                  member’s identity when they sign in.
                </p>
                <label className="set id-check-consent">
                  <input
                    type="checkbox"
                    checked={consent}
                    disabled={busy || Boolean(verification)}
                    onChange={(event) => {
                      setConsent(event.target.checked)
                      if (!event.target.checked) clearUploads()
                    }}
                  />
                  <span>The member has agreed to the ID and face check.</span>
                </label>
                <label className="field">
                  ID type
                  <select
                    className="clay-in"
                    value={idType}
                    disabled={busy}
                    onChange={(event) => setIdType(event.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Select an ID type
                    </option>
                    {Object.entries(memberIdTypes).map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Upload format
                  <select
                    className="clay-in"
                    value={uploadMode}
                    disabled={busy}
                    onChange={(event) => {
                      setUploadMode(event.target.value)
                      clearUploads()
                    }}
                  >
                    <option value="images">Two images (JPG or PNG)</option>
                    <option value="document">One document (PDF, DOC or DOCX)</option>
                  </select>
                </label>
                <div className="id-check-slots" key={uploadVersion}>
                  {sides.map((side) => (
                    <IdUploadSlot
                      key={side}
                      side={side}
                      disabled={!consent || busy}
                      onFile={(slot, file) => setFiles((current) => ({ ...current, [slot]: file }))}
                    />
                  ))}
                </div>
                <p className="form-help">
                  {uploadMode === 'images'
                    ? 'Upload one image per side. Include the full ID and avoid glare.'
                    : 'Include both sides of the ID in this single document.'}{' '}
                  Up to 5 MB per file.
                </p>
                {hasSavedId && Object.keys(files).length > 0 && (
                  <button
                    className="btn ghost"
                    type="button"
                    disabled={busy}
                    onClick={clearUploads}
                  >
                    Keep saved ID
                  </button>
                )}
                {hasSavedId && (
                  <p className="form-help">
                    You can continue with the saved ID or upload replacements.
                  </p>
                )}
              </section>
            )}
            <div className="ma">
              <button
                className="btn ghost cancel-button"
                type="button"
                disabled={busy}
                onClick={onClose}
              >
                Cancel
              </button>
              {verification?.status === 'needs_review' && (
                <button className="btn ghost" type="button" disabled={busy} onClick={refreshResult}>
                  Refresh status
                </button>
              )}
              <button
                className="btn"
                type="submit"
                disabled={busy || (!readyToUpload && !canResume)}
              >
                {canResume ? 'Continue to face enrollment' : 'Save ID and continue'}
              </button>
            </div>
          </form>
        )}
        {step === 2 && verification && (
          <div className="mf">
            <IdVerificationResult verification={verification} />
            {verification.faceEnrolled && !retakingFace ? (
              <div>
                <p className="form-help" role="status">Face enrollment saved.</p>
                {canEnrollFace && (
                  <button className="btn ghost" type="button" disabled={busy} onClick={() => setRetakingFace(true)}>
                    Retake face capture
                  </button>
                )}
              </div>
            ) : canEnrollFace ? (
              <section className="id-check-section mf" aria-label="Capture the member’s face">
                <p className="form-help">
                  Capture one clear face for enrollment. FitPulse will compare the live face,
                  enrollment, and ID portrait at sign-in.
                </p>
                <FaceCapture
                  purpose="enrollment"
                  actionLabel="Capture and save face"
                  disabled={busy}
                  getChallenge={() => apiRequest(endpoint + '/face/challenge', { token, method: 'POST' })}
                  onCaptured={submitFace}
                />
              </section>
            ) : (
              <div>
                <p className="form-help" role="status">An administrator must complete face enrollment for this member.</p>
                <button className="btn ghost" type="button" disabled={busy} onClick={refreshResult}>
                  Refresh enrollment
                </button>
              </div>
            )}
            <div className="ma">
              <button
                className="btn ghost"
                type="button"
                disabled={busy}
                onClick={() => {
                  setIssue('')
                  setStep(1)
                }}
              >
                Back to ID verification
              </button>
              <button
                className="btn ghost cancel-button"
                type="button"
                disabled={busy}
                onClick={onClose}
              >
                Cancel
              </button>
              {!verification.faceEnrolled && verification.status === 'awaiting_face' && (
                <button className="btn ghost" type="button" disabled={busy} onClick={requestReview}>
                  Request review
                </button>
              )}
              <button
                className="btn"
                type="button"
                disabled={busy || retakingFace || !verification.faceEnrolled}
                onClick={() => onCreate({ ...details, verificationId: verification.id })}
              >
                {pending && <Spinner />}
                {pending ? 'Creating account…' : 'Create member account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
