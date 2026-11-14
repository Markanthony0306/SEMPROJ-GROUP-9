import { useState } from 'react'
import Dialog from '../Dialog'
import FaceCapture from '../FaceCapture'

export function Modal({ title, children, onClose, busy, error, className }) {
  return (
    <Dialog title={title} onClose={onClose} busy={busy} className={className}>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {busy && (
        <p className="form-help" role="status">
          Saving...
        </p>
      )}
      <fieldset className="modal-fields" disabled={busy}>
        {children}
      </fieldset>
    </Dialog>
  )
}

export function FaceEnrollmentForm({ selfEnrollment, onEnroll, getChallenge, busy }) {
  const [consent, setConsent] = useState(false)
  const [idChecked, setIdChecked] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')

  return (
    <div className="mf face-enrollment-form">
      <section className="face-enrollment-terms" aria-labelledby="face-terms-title">
        <h3 id="face-terms-title">Face verification terms</h3>
        <p>Please read these terms before agreeing to face enrollment:</p>
        <ul>
          <li>
            FitPulse uses your face to verify your identity when you sign in and to check for
            duplicate enrollments.
          </li>
          <li>
            Three camera frames are sent to the server for each live check and discarded after
            processing. An encrypted face template is stored for future verification.
          </li>
          <li>
            Face enrollment is optional. You can withdraw your consent and ask the gym to remove
            your face template.
          </li>
        </ul>
        {!selfEnrollment && (
          <p>Staff must explain these terms and obtain the member's agreement before continuing.</p>
        )}
      </section>
      {!selfEnrollment && (
        <label className="set">
          <input type="checkbox" checked={idChecked} onChange={(event) => setIdChecked(event.target.checked)} />
          <span>I checked the member's photo ID.</span>
        </label>
      )}
      <label className="set">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
        <span>
          {selfEnrollment
            ? 'I have read and agree to the face verification terms.'
            : 'The member has agreed to the face verification terms.'}
        </span>
      </label>
      {selfEnrollment && (
        <label className="field">
          Current password
          <input
            className="clay-in"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>
      )}
      <FaceCapture
        getChallenge={getChallenge}
        onCaptured={(capture) => onEnroll({ ...capture, consent, idChecked, currentPassword })}
        purpose="enrollment"
        disabled={busy || !consent || (selfEnrollment ? !currentPassword : !idChecked)}
        actionLabel="Capture and save"
      />
    </div>
  )
}

