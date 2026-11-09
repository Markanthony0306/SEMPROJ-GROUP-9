import { useEffect, useRef, useState } from 'react'
import {
  memberIdAttemptLimit,
  memberIdImageLimit,
  memberIdImageTypes,
  memberIdTypes
} from '../../../shared/memberIdTypes'
import { apiRequest } from '../../utils/api'
import Dialog from '../Dialog'
import FaceCapture from '../FaceCapture'
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
  awaiting_face: 'Ready for face scan',
  checking_face: 'Checking face',
  verified: 'Verified',
  approved: 'Verified by administrator',
  rejected: 'Rejected',
  needs_review: 'Needs manual review'
}

const fieldLabels = {
  name: 'Full name',
  idNumber: 'ID number',
  birthDate: 'Date of birth',
  expiryDate: 'Expiry date'
}

export function IdVerificationResult({ verification }) {
  return (
    <section className="id-check-result" aria-live="polite">
      <strong>{idVerificationLabels[verification.status]}</strong>
      {verification.faceMatchScore != null && (
        <p>Face similarity score {verification.faceMatchScore}/100</p>
      )}
      {verification.reasons.length > 0 && (
        <ul>
          {verification.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
      {verification.reviewNotes && <p>Review notes: {verification.reviewNotes}</p>}
    </section>
  )
}

const isApproved = (verification) => ['verified', 'approved'].includes(verification?.status)

export default function MemberIdWizard({
  token,
  plans,
  planOptionLabel,
  initialCase,
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
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [fields, setFields] = useState(null)
  const [working, setWorking] = useState('')
  const [issue, setIssue] = useState('')
  const heading = useRef(null)
  const actionLock = useRef(false)
  const busy = pending || Boolean(working)
  const endpoint = verification ? `${idVerificationPath}/${verification.id}` : null
  const canUpload =
    !isApproved(verification) &&
    (verification?.documentAttempts || 0) < memberIdAttemptLimit &&
    !verification?.processing
  const canResume = Boolean(verification && !file && verification.documentAttempts > 0)
  const readyToRead = canUpload && consent && Boolean(idType && file)

  useEffect(() => {
    heading.current?.focus()
  }, [step])

  useEffect(() => {
    if (!file) {
      setPreview('')
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function changeField(event) {
    const { name, value, checked, type } = event.target
    setDetails((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  async function run(label, callback) {
    if (actionLock.current || pending) return
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

  function selectFile(selected) {
    setIssue('')
    if (!selected) return
    if (
      !memberIdImageTypes.includes(selected.type) ||
      selected.size > memberIdImageLimit ||
      !selected.size
    ) {
      setFile(null)
      setIssue('Upload a JPG or PNG image up to 5 MB.')
      return
    }
    setFile(selected)
  }

  function showResult(result, nextStep = 3) {
    setVerification(result)
    setStep(nextStep)
  }

  function submitDocument(event) {
    event.preventDefault()
    if (canResume) {
      setIssue('')
      showResult(verification, verification.canScanFace ? 2 : 3)
      return
    }
    if (!readyToRead) return
    void run('Checking the photo and reading the ID…', async () => {
      let current = verification
      if (!current) {
        const result = await apiRequest(idVerificationPath, {
          token,
          method: 'POST',
          body: JSON.stringify({ ...details, consent: true })
        })
        current = result.verification
        setVerification(current)
        if (
          isApproved(current) ||
          current.documentAttempts >= memberIdAttemptLimit ||
          current.processing
        ) {
          setFile(null)
          showResult(current, current.canScanFace ? 2 : 3)
          return
        }
      }
      const result = await apiRequest(
        `${idVerificationPath}/${current.id}/document?type=${idType}`,
        {
          token,
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file
        }
      )
      setFile(null)
      setFields(result.fields || null)
      showResult(result.verification, result.verification.canScanFace ? 2 : 3)
    })
  }

  async function refreshResult(captureError) {
    if (!endpoint) return
    try {
      const result = await apiRequest(endpoint, { token })
      setVerification(result.verification)
      if (!result.verification.canScanFace) {
        if (captureError) setIssue(captureError.message)
        setStep(3)
      }
    } catch (cause) {
      setIssue(idVerificationError(cause))
    }
  }

  const submitFace = async (capture) => {
    const result = await apiRequest(endpoint + '/face', {
      token,
      method: 'POST',
      body: JSON.stringify(capture)
    })
    showResult(result.verification)
    return isApproved(result.verification)
  }

  async function reportCaptureError(cause, challengeToken) {
    if (challengeToken) {
      try {
        // Complete the recorded attempt even when the browser could not collect the gesture.
        await submitFace({ challengeToken })
        setIssue(cause.message)
        return
      } catch {
        // The prompt may have expired or the case may have been reviewed in the meantime.
      }
    }
    await refreshResult(cause)
  }

  const requestReview = () =>
    run('Sending to the review queue…', async () => {
      const result = await apiRequest(endpoint + '/request-review', { token, method: 'POST' })
      showResult(result.verification)
    })

  return (
    <Dialog title="Create Member Account" onClose={onClose} busy={busy} className="id-check-dialog">
      <div className="mf id-check-wizard">
        <p className="form-help">Step {step} of 3</p>
        <h3 ref={heading} tabIndex={-1}>
          {
            ['Member details and photo ID', 'Compare live face with ID', 'Verification decision'][
              step - 1
            ]
          }
        </h3>
        {(issue || error) && (
          <p className="form-error" role="alert">
            {issue || error}
          </p>
        )}
        {working && (
          <div className="id-check-progress" role="status">
            <span>{working}</span>
            <progress aria-label={working} />
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
            {verification && <IdVerificationResult verification={verification} />}
            {canUpload && (
              <section className="id-check-upload mf" aria-label="Photo ID">
                <h4>Photo ID</h4>
                <p className="form-help">
                  FitPulse reads the ID and compares its portrait with a live webcam capture. Images
                  are discarded after processing. FitPulse keeps an encrypted ID number and a record
                  of the decision.
                </p>
                <label className="set id-check-consent">
                  <input
                    type="checkbox"
                    checked={consent}
                    disabled={busy || Boolean(verification)}
                  onChange={(event) => {
                    setConsent(event.target.checked)
                    if (!event.target.checked) setFile(null)
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
                <div
                  className="id-check-drop"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    if (consent && !busy && canUpload) selectFile(event.dataTransfer.files[0])
                  }}
                >
                  <label className="field">
                    Drop a photo here or choose a file
                    <input
                      type="file"
                      accept={memberIdImageTypes.join(',')}
                      disabled={!consent || busy || !canUpload}
                      onChange={(event) => {
                        selectFile(event.target.files[0])
                        event.target.value = ''
                      }}
                    />
                  </label>
                  <p className="form-help">
                    JPG or PNG, up to 5 MB. Show the face, text, and all four edges without glare.
                  </p>
                  {preview && <img src={preview} alt="Selected photo ID preview" />}
                </div>
                <p className="form-help">
                  {verification?.documentAttempts || 0} of {memberIdAttemptLimit} uploads used
                </p>
              </section>
            )}
            <div className="ma">
              <button className="btn ghost" type="button" disabled={busy} onClick={onClose}>
                Cancel
              </button>
              <button className="btn" type="submit" disabled={busy || (!readyToRead && !canResume)}>
                {canResume ? 'Continue verification' : 'Read ID and continue'}
              </button>
            </div>
          </form>
        )}
        {step === 2 && verification && (
          <div className="mf">
            <IdVerificationResult verification={verification} />
            <p className="form-help">
              Ask the member to face the camera and follow the live prompt. FitPulse will compare
              the capture with the selected ID.
            </p>
            <FaceCapture
              purpose="enrollment"
              actionLabel="Compare with photo ID"
              disabled={busy}
              getChallenge={() =>
                apiRequest(endpoint + '/face-challenge', { token, method: 'POST' })
              }
              onCaptured={submitFace}
              onCaptureError={reportCaptureError}
            />
            <div className="ma">
              <button
                className="btn ghost"
                type="button"
                disabled={busy}
                onClick={() => setStep(1)}
              >
                Back to member details and ID
              </button>
              <button className="btn ghost" type="button" disabled={busy} onClick={requestReview}>
                Request review
              </button>
            </div>
          </div>
        )}
        {step === 3 && verification && (
          <div className="mf">
            <IdVerificationResult verification={verification} />
            {fields && (
              <dl className="id-check-fields">
                {Object.entries(fieldLabels).map(([key, label]) => {
                  const { value, confidence } = fields[key]
                  return (
                    <div key={key}>
                      <dt>{label}</dt>
                      <dd>
                        {value
                          ? key === 'idNumber'
                            ? `•••• ${value.slice(-4)}`
                            : value
                          : 'Unreadable'}
                      </dd>
                      {value && <small>{confidence}% OCR confidence</small>}
                    </div>
                  )
                })}
              </dl>
            )}
            {isApproved(verification) && (
              <fieldset className="modal-fields mf" disabled={busy}>
                <label className="field">
                  Payment
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
                <label className="set">
                  Payment already received
                  <input
                    type="checkbox"
                    name="recordPayment"
                    checked={details.recordPayment}
                    onChange={changeField}
                  />
                </label>
                <p className="form-help">
                  Check payment only after receiving it. A temporary password will be shown once.
                </p>
              </fieldset>
            )}
            {!isApproved(verification) && (
              <>
                <p className="form-help">
                  {verification.attempts} of {memberIdAttemptLimit} face attempts used
                </p>
                {verification.status === 'needs_review' && (
                  <p className="form-help">
                    An administrator can open ID Reviews to check the original ID and member in
                    person.
                  </p>
                )}
                <div className="ma">
                  {verification.canScanFace && (
                    <button
                      type="button"
                      className="btn ghost"
                      disabled={busy}
                      onClick={() => {
                        setIssue('')
                        setStep(2)
                      }}
                    >
                      Start face scan
                    </button>
                  )}
                  {verification.documentAttempts > 0 &&
                    verification.status !== 'needs_review' &&
                    !verification.processing && (
                      <button
                        type="button"
                        className="btn ghost"
                        disabled={busy}
                        onClick={requestReview}
                      >
                        Request review
                      </button>
                    )}
                  <button
                    type="button"
                    className="btn ghost"
                    disabled={busy}
                    onClick={() => refreshResult()}
                  >
                    Refresh decision
                  </button>
                </div>
              </>
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
                {canUpload ? 'Back to member details and ID' : 'Member details'}
              </button>
              <button
                className="btn"
                type="button"
                disabled={busy || !isApproved(verification)}
                onClick={() => onCreate({ ...details, verificationId: verification.id })}
              >
                Create verified account
              </button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
