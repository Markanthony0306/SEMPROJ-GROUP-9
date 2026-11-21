import { useContext, useEffect, useId, useRef, useState } from 'react'
import { memberIdTypes } from '../../../shared/memberIdTypes'
import { apiRequest } from '../../utils/api'
import Dialog, { DashboardSheetContext } from '../Dialog'
import FaceCapture from '../FaceCapture'
import Spinner from '../Spinner'
import { useGorilla } from '../gorilla/GorillaAssistant'
import MemberIdCamera from './MemberIdCamera'
import './MemberIdVerification.css'

const idVerificationPath = '/admin/id-verifications'
const stepTitles = [
  'Member details',
  'Scan front and back',
  'Verify ID',
  'Face check · Normal view',
  'Face check · Close-up'
]

function WizardFooter({ note, children }) {
  return (
    <div className="ma id-check-footer">
      {note && <p className="form-help">{note}</p>}
      {children}
    </div>
  )
}

export default function MemberIdWizard({
  token,
  plans,
  planOptionLabel,
  pending,
  error,
  fieldError,
  onClose,
  onCreate
}) {
  const mobile = useContext(DashboardSheetContext)
  const { notify } = useGorilla() || {}
  const [step, setStep] = useState(1)
  const [scanSide, setScanSide] = useState('front')
  const [details, setDetails] = useState({
    name: '',
    email: '',
    phone: '',
    plan: '',
    method: '',
    recordPayment: false
  })
  const [idType, setIdType] = useState('')
  const [consent, setConsent] = useState(false)
  const [captures, setCaptures] = useState({})
  const [working, setWorking] = useState('')
  const [faceSaved, setFaceSaved] = useState(false)
  const [issue, setIssue] = useState('')
  const [invalidField, setInvalidField] = useState(null)
  const [emailEdited, setEmailEdited] = useState(false)
  const emailErrorId = useId()
  const verificationId = useRef(null)
  const heading = useRef(null)
  const actionLock = useRef(false)
  const busy = pending || Boolean(working)
  const waitingForBack = scanSide === 'front' && Boolean(captures.front) && !captures.back
  const emailError = invalidField?.name === 'email'
    ? issue
    : fieldError?.name === 'email' && !emailEdited ? error : ''
  const generalError = (invalidField?.name !== 'email' && issue) ||
    (fieldError?.name !== 'email' && error)

  useEffect(() => {
    if (!(mobile && step === 1 && (fieldError || invalidField))) heading.current?.focus()
  }, [step, mobile, fieldError, invalidField])

  useEffect(() => {
    if (fieldError?.name === 'email' || (mobile && fieldError)) {
      setEmailEdited(false)
      setStep(1)
    }
  }, [mobile, fieldError])

  function changeField(event) {
    const { name, value, checked, type } = event.target
    setDetails((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    if (name === 'email') {
      setEmailEdited(true)
      if (invalidField?.name === 'email') {
        setIssue('')
        setInvalidField(null)
      }
    }
  }

  async function run(label, callback) {
    if (actionLock.current || busy) return
    actionLock.current = true
    setIssue('')
    setInvalidField(null)
    setWorking(label)
    try {
      return await callback()
    } catch (cause) {
      setIssue(cause.message)
      if (cause.field && (mobile || cause.field === 'email')) {
        setInvalidField({ name: cause.field })
        setStep(1)
      }
    } finally {
      setWorking('')
      actionLock.current = false
    }
  }

  function discardDraft(announce = false) {
    const id = verificationId.current
    verificationId.current = null
    if (!id) return
    void apiRequest(`${idVerificationPath}/${id}/draft`, { token, method: 'DELETE' }).then(() => {
      if (announce) notify?.({
        type: 'success', title: 'Draft discarded', message: 'The verification draft was deleted.'
      })
    }).catch((cause) => {
      if (announce) notify?.({
        type: 'error', title: 'Draft deletion failed', message: cause.message
      })
    })
  }

  function closeWizard() {
    discardDraft(true)
    onClose()
  }

  function chooseId(event) {
    event.preventDefault()
    if (!consent || !idType) return
    void run('Checking email domain…', async () => {
      await apiRequest('/admin/members/validate-email', {
        token,
        method: 'POST',
        body: JSON.stringify({ email: details.email })
      })
      discardDraft()
      setCaptures({})
      setFaceSaved(false)
      setScanSide('front')
      setStep(2)
    })
  }

  function captureSide(file, fingerprint) {
    const next = { ...captures, [scanSide]: { file, fingerprint } }
    setCaptures(next)
    if (next.front && next.back) void verifyDocument(next)
  }

  function rescanSide(side) {
    setCaptures((current) => ({ ...current, [side]: null }))
    setIssue('')
    setScanSide(side)
    setStep(2)
  }

  function verifyDocument(images) {
    if (!images.front || !images.back) return
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
      body.append('front', images.front.file)
      body.append('back', images.back.file)
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
      invalidField={step === 1 ? fieldError || invalidField : null}
    >
      <div className="mf id-check-wizard">
        <h3 ref={heading} tabIndex={-1}>
          {step === 2 ? 'Scan the member’s ID' : stepTitles[step - 1]}
        </h3>
        {generalError && (
          <p className="form-error" role="alert">
            {generalError}
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
                  pattern={mobile ? '.*\\S.*' : undefined}
                />
              </label>
              <label className="field">
                Contact number
                <input
                  className="clay-in"
                  name="phone"
                  type="tel"
                  placeholder="Optional"
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
                  placeholder={mobile ? 'john123@gmail.com' : undefined}
                  value={details.email}
                  onChange={changeField}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? emailErrorId : undefined}
                  required
                />
                {emailError && (
                  <span className="form-error" id={emailErrorId} role="alert">{emailError}</span>
                )}
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
                      required
                      checked={details.method === method}
                      onChange={changeField}
                    />
                    <span>{method}</span>
                  </label>
                ))}
              </fieldset>
              <p className="form-help">The temporary password is shown once after creation. Record payment separately after receiving it.</p>
            </section>
            <section className="mf id-check-section" aria-labelledby="member-id-type-heading">
              <h4 id="member-id-type-heading">Identity check</h4>
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
                  template for identity verification.
                </span>
              </label>
            </section>
            <WizardFooter note="Fill in the required fields and accept consent to continue.">
              <button className="btn ghost cancel-button" type="button" onClick={closeWizard}>
                Cancel
              </button>
              <button
                className="btn"
                type="submit"
                disabled={mobile ? busy : !details.name.trim() || !details.email || !details.plan || !consent || !idType}
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
              disabled={busy || waitingForBack || Boolean(captures.front && captures.back)}
              disabledStatus={working ? 'Verifying the ID…' : waitingForBack ? 'Front captured. Choose when to scan the back.' : 'ID photos captured'}
              onCapture={captureSide}
            />
            <div className="id-check-slots id-check-section" aria-label="ID photos" aria-live="polite">
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
            {waitingForBack && !busy && (
              <div className="ma id-check-footer">
                <button className="btn ghost" type="button" onClick={() => rescanSide('front')}>Rescan front</button>
                <button className="btn" type="button" onClick={() => setScanSide('back')}>Scan back</button>
              </div>
            )}
            {captures.front && captures.back && !busy && (
              <div className="ma id-check-footer">
                <button className="btn ghost" type="button" onClick={() => rescanSide('front')}>Rescan front</button>
                <button className="btn ghost" type="button" onClick={() => rescanSide('back')}>Rescan back</button>
                <button className="btn" type="button" onClick={() => verifyDocument(captures)}>Retry verification</button>
              </div>
            )}
            <WizardFooter
              note={
                idType === 'passport'
                  ? 'Use the passport photo page, then its reverse side.'
                  : 'The camera captures each side when the ID is steady and clear. Choose when to scan the back.'
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
        {step >= 4 && (
          <>
            <section className="mf" aria-labelledby="member-id-review-heading">
              <h4 id="member-id-review-heading">Review member details</h4>
              <dl className="id-check-review">
                <div><dt>Member name</dt><dd>{details.name}</dd></div>
                <div><dt>ID type</dt><dd>{memberIdTypes[idType]}</dd></div>
              </dl>
            </section>
            <section className="mf id-check-section" aria-label="Capture the member’s face">
              {faceSaved ? (
                <>
                  <p role="status">{pending ? 'Creating member account…' : 'Face scan complete.'}</p>
                  {!busy && (
                    <div className="ma id-check-footer">
                      <button
                        className="btn ghost cancel-button"
                        type="button"
                        onClick={() => {
                          setFaceSaved(false)
                          setStep(2)
                        }}
                      >
                        Back to ID scan
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
                      onClick={() => setStep(2)}
                    >
                      Back
                    </button>
                  </WizardFooter>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </Dialog>
  )
}
