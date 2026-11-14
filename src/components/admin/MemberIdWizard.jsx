import { useEffect, useRef, useState } from 'react'
import { namesMatch } from '../../../shared/memberIdParsing.js'
import { memberIdTypes } from '../../../shared/memberIdTypes'
import { apiRequest } from '../../utils/api'
import { readMemberId } from '../../utils/readMemberId'
import Dialog from '../Dialog'
import FaceCapture from '../FaceCapture'
import Spinner from '../Spinner'
import MemberIdCamera from './MemberIdCamera'
import './MemberIdVerification.css'

const idVerificationPath = '/admin/id-verifications'
const stepTitles = [
  'Member details',
  'Scan front and back',
  'Review ID details',
  'Face check · Normal view',
  'Face check · Close-up'
]
const stepLabels = ['Details', 'ID scan', 'Review', 'Face', 'Close-up']
const reviewFields = [
  ['name', 'Full name'],
  ['idNumber', 'ID number'],
  ['birthDate', 'Birth date'],
  ['idType', 'ID type'],
  ['expiryDate', 'Expiry date'],
  ['address', 'Address']
]

function WizardFooter({ note, children }) {
  return (
    <div className="ma id-check-footer">
      {note && <p className="form-help">{note}</p>}
      {children}
    </div>
  )
}

function IdPreview({ file, label }) {
  const [preview, setPreview] = useState('')

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  return preview && <img src={preview} alt={label} />
}

export default function MemberIdWizard({
  token,
  plans,
  planOptionLabel,
  pending,
  error,
  onClose,
  onCreate
}) {
  const [step, setStep] = useState(1)
  const [scanSide, setScanSide] = useState('front')
  const [details, setDetails] = useState({
    name: '',
    email: '',
    phone: '',
    plan: '',
    method: 'Cash',
    recordPayment: false
  })
  const [idType, setIdType] = useState('')
  const [consent, setConsent] = useState(false)
  const [captures, setCaptures] = useState({})
  const [review, setReview] = useState({})
  const [reviewEdits, setReviewEdits] = useState({})
  const [readerIssue, setReaderIssue] = useState('')
  const [working, setWorking] = useState('')
  const [faceSaved, setFaceSaved] = useState(false)
  const [issue, setIssue] = useState('')
  const verificationId = useRef(null)
  const heading = useRef(null)
  const actionLock = useRef(false)
  const busy = pending || Boolean(working)

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
      setIssue(cause.message)
    } finally {
      setWorking('')
      actionLock.current = false
    }
  }

  function discardDraft() {
    const id = verificationId.current
    verificationId.current = null
    if (id)
      void apiRequest(`${idVerificationPath}/${id}/draft`, { token, method: 'DELETE' }).catch(
        () => {}
      )
  }

  function closeWizard() {
    discardDraft()
    onClose()
  }

  function chooseId(event) {
    event.preventDefault()
    if (!consent || !idType) return
    discardDraft()
    setCaptures({})
    setReview({})
    setReviewEdits({})
    setReaderIssue('')
    setIssue('')
    setScanSide('front')
    setStep(2)
  }

  async function readCaptures(next) {
    await run('Reading both sides in your browser…', async () => {
      setReaderIssue('')
      try {
        setReview(await readMemberId(idType, next.front.file, next.back.file))
      } catch {
        setReview({})
        setReaderIssue(
          'The browser could not read this ID. Retry the reader or enter the details for review.'
        )
      }
      setStep(3)
    })
  }

  function captureSide(file, fingerprint) {
    const next = { ...captures, [scanSide]: { file, fingerprint } }
    setCaptures(next)
    if (next.front && next.back) void readCaptures(next)
    else setScanSide('back')
  }

  function rescanSide(side) {
    setCaptures((current) => ({ ...current, [side]: null }))
    setReviewEdits({})
    setIssue('')
    setScanSide(side)
    setStep(2)
  }

  function verifyDocument(event) {
    event.preventDefault()
    if (!captures.front || !captures.back) return
    void run('Verifying both sides of the ID…', async () => {
      if (!verificationId.current) {
        const result = await apiRequest(idVerificationPath, {
          token,
          method: 'POST',
          body: JSON.stringify({ ...details, consent: true })
        })
        verificationId.current = result.verification.id
      }
      const body = new FormData()
      body.append('front', captures.front.file)
      body.append('back', captures.back.file)
      await apiRequest(
        `${idVerificationPath}/${verificationId.current}/document?type=${encodeURIComponent(idType)}`,
        { token, method: 'POST', body }
      )
      setStep(4)
    })
  }

  const faceEndpoint = () => `${idVerificationPath}/${verificationId.current}/face`
  const finishCreation = () => onCreate({ ...details, verificationId: verificationId.current })

  async function submitFace(capture) {
    setWorking('Verifying the member’s face…')
    try {
      await apiRequest(faceEndpoint(), { token, method: 'POST', body: JSON.stringify(capture) })
      setFaceSaved(true)
      return await finishCreation()
    } finally {
      setWorking('')
    }
  }

  return (
    <Dialog
      title="Create member account"
      onClose={closeWizard}
      busy={busy}
      className="id-check-dialog"
    >
      <div className="mf id-check-wizard">
        <p className="form-help id-check-step">
          Step {step} of {stepTitles.length} · {stepTitles[step - 1]}
        </p>
        <ol className="id-check-steps" aria-label="Member creation progress">
          {stepLabels.map((label, index) => (
            <li
              key={label}
              className={index + 1 < step ? 'complete' : undefined}
              aria-current={index + 1 === step ? 'step' : undefined}
            >
              {label}
            </li>
          ))}
        </ol>
        <h3 ref={heading} tabIndex={-1}>
          {step === 2 ? 'Scan the member’s ID' : stepTitles[step - 1]}
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
          <form className="mf" onSubmit={chooseId}>
            <fieldset className="modal-fields id-check-member-details" disabled={busy}>
              <label className="field">
                Full name
                <input
                  className="clay-in"
                  name="name"
                  value={details.name}
                  onChange={changeField}
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
            <section className="mf" aria-label="Payment">
              <h4>Payment</h4>
              <fieldset
                className="id-check-payment-methods"
                aria-label="Payment method"
                disabled={busy}
              >
                {['Cash', 'GCash'].map((method) => (
                  <label key={method}>
                    <input
                      type="radio"
                      name="method"
                      value={method}
                      checked={details.method === method}
                      onChange={changeField}
                    />
                    <span>{method}</span>
                  </label>
                ))}
              </fieldset>
              <label className="set id-check-consent id-check-payment">
                <input
                  type="checkbox"
                  name="recordPayment"
                  checked={details.recordPayment}
                  onChange={changeField}
                />
                <span>
                  <strong>Payment received</strong>
                  <small>
                    Tick only after collecting it. A temporary password is shown once after
                    creation.
                  </small>
                </span>
              </label>
            </section>
            <h4>Identity check</h4>
            <label className="field">
              ID type
              <select
                className="clay-in"
                value={idType}
                onChange={(event) => {
                  setIdType(event.target.value)
                  setCaptures({})
                }}
                required
              >
                <option value="" disabled>
                  Choose ID type
                </option>
                {Object.entries(memberIdTypes).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="set id-check-consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => {
                  setConsent(event.target.checked)
                  if (!event.target.checked) {
                    discardDraft()
                    setCaptures({})
                  }
                }}
                required
              />
              <span>
                The member agrees to the ID and face check and to storage of their ID and face
                template for sign-in.
              </span>
            </label>
            <WizardFooter note="Fill in the required fields and accept consent to continue.">
              <button className="btn ghost cancel-button" type="button" onClick={closeWizard}>
                Cancel
              </button>
              <button
                className="btn"
                type="submit"
                disabled={
                  !details.name.trim() || !details.email || !details.plan || !consent || !idType
                }
              >
                Continue
              </button>
            </WizardFooter>
          </form>
        )}
        {step === 2 && (
          <section className="mf" aria-label="Live ID scanning">
            <MemberIdCamera
              side={scanSide}
              previousFingerprint={captures[scanSide === 'front' ? 'back' : 'front']?.fingerprint}
              disabled={busy}
              onCapture={captureSide}
            />
            <div className="id-check-slots" aria-label="ID photos" aria-live="polite">
              {['front', 'back'].map((side) => (
                <div className="id-check-photo-status" key={side}>
                  <span className={captures[side] ? 'is-complete' : ''} aria-hidden="true">
                    {captures[side] ? '✓' : ''}
                  </span>
                  <div>
                    <strong>{side === 'front' ? 'Front' : 'Back'} of ID</strong>
                    <small>
                      {captures[side]
                        ? 'Captured'
                        : side === scanSide
                          ? 'Ready to scan'
                          : 'Waiting'}
                    </small>
                  </div>
                </div>
              ))}
            </div>
            <WizardFooter
              note={
                idType === 'passport'
                  ? 'Use the passport photo page, then its reverse side.'
                  : 'The camera captures each side when the ID is steady and clear.'
              }
            >
              <button
                className="btn ghost cancel-button"
                type="button"
                disabled={busy}
                onClick={() => {
                  setStep(1)
                }}
              >
                Back
              </button>
            </WizardFooter>
          </section>
        )}
        {step === 3 && (
          <form className="mf" onSubmit={verifyDocument}>
            <div className="id-check-slots">
              {['front', 'back'].map((side) => (
                <figure className="id-check-review-photo" key={side}>
                  <figcaption>
                    {side === 'front' ? 'Front' : 'Back'}
                    <button
                      className="id-check-text-button"
                      type="button"
                      disabled={busy}
                      onClick={() => rescanSide(side)}
                      aria-label={`Rescan ${side} of ID`}
                    >
                      Rescan
                    </button>
                  </figcaption>
                  <IdPreview
                    file={captures[side]?.file}
                    label={side === 'front' ? 'Front of ID' : 'Back of ID'}
                  />
                </figure>
              ))}
            </div>
            {readerIssue && (
              <div className="id-check-progress">
                <p className="form-help" role="status">
                  {readerIssue}
                </p>
                <button
                  className="id-check-text-button"
                  type="button"
                  disabled={busy}
                  onClick={() => readCaptures(captures)}
                >
                  Retry reader
                </button>
              </div>
            )}
            <fieldset className="modal-fields id-check-details" disabled={busy}>
              {reviewFields.map(([key, label]) => (
                <label className="field" key={key}>
                  {label}
                  {key === 'idType' ? (
                    <input className="clay-in" value={memberIdTypes[idType]} readOnly />
                  ) : (
                    <input
                      className="clay-in"
                      value={reviewEdits[key] ?? review[key] ?? ''}
                      onChange={(event) => {
                        const value = event.target.value
                        setReviewEdits((current) => ({ ...current, [key]: value }))
                      }}
                      autoComplete="off"
                    />
                  )}
                </label>
              ))}
            </fieldset>
            {namesMatch(review.name, details.name) && (
              <p className="id-check-name-status">
                <span aria-hidden="true">✓</span> Name read from the ID matches the member details
              </p>
            )}
            <WizardFooter note="Check the fields against both photos. Your edits are for this review. FitPulse verifies the images separately.">
              <button
                className="btn ghost cancel-button"
                type="button"
                disabled={busy}
                onClick={() => rescanSide('back')}
              >
                Back
              </button>
              <button className="btn" type="submit" disabled={busy}>
                Continue to face check
              </button>
            </WizardFooter>
          </form>
        )}
        {step >= 4 && (
          <section className="mf" aria-label="Capture the member’s face">
            {faceSaved ? (
              <>
                <p role="status">{pending ? 'Creating member account…' : 'Face scan complete.'}</p>
                {!busy && (
                  <div className="ma">
                    <button
                      className="btn ghost cancel-button"
                      type="button"
                      onClick={() => {
                        setFaceSaved(false)
                        setStep(3)
                      }}
                    >
                      Back to ID details
                    </button>
                    <button className="btn" type="button" onClick={finishCreation}>
                      Retry account creation
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="form-help">
                  Center one face in the frame. Follow the live prompts at a normal distance, then
                  move closer when asked.
                </p>
                <FaceCapture
                  purpose="enrollment"
                  actionLabel="Start normal scan"
                  closeShot
                  onReset={() => setStep(4)}
                  onCloseUp={() => setStep(5)}
                  disabled={busy}
                  getChallenge={() =>
                    apiRequest(faceEndpoint() + '/challenge', { token, method: 'POST' })
                  }
                  onCaptured={submitFace}
                />
                <WizardFooter>
                  <button
                    className="btn ghost cancel-button"
                    type="button"
                    disabled={busy}
                    onClick={() => setStep(3)}
                  >
                    Back
                  </button>
                </WizardFooter>
              </>
            )}
          </section>
        )}
      </div>
    </Dialog>
  )
}
