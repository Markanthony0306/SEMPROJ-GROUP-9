import { useRef, useState } from 'react'
import { formatDate } from '../../shared/formatDate.js'
import { MEMBER_TERMS_VERSION } from '../../shared/memberTerms.js'
import { apiRequest } from '../utils/api'
import Dialog from './Dialog'

const sections = [
  ['Acceptance of Terms', 'These terms apply to your FitPulse membership and use of the gym. By accepting them, you agree to follow these terms and the rules communicated by gym staff.'],
  ['Membership and Account', 'Provide accurate account information and keep it current. Your membership, password, and QR pass are for your own use. Contact the front desk if you suspect someone has used your account.'],
  ['Payments (Cash and GCash) and Membership Validity', 'FitPulse accepts cash and GCash. Keep proof of payment and report any discrepancy to the front desk. Your membership is valid for the start and end dates shown in your account. Renew it to continue using facilities after it expires.'],
  ['Facial Recognition and Personal Data (Privacy)', 'FitPulse uses facial recognition to verify your identity when you sign in. The sign-in images are processed for verification. FitPulse keeps a facial template for future checks. Contact the front desk to ask how your data is handled or to submit a privacy request.'],
  ['Use of Facilities and Equipment', 'Follow posted instructions and directions from gym staff. Use equipment safely, return it after use, and report damaged equipment or injuries immediately.'],
  ['Code of Conduct', 'Treat staff and other members with respect. Harassment, threats, and conduct that endangers others are prohibited. Respect other members’ privacy.'],
  ['Suspension and Termination', 'FitPulse may suspend or end access for serious or repeated violations of these terms or for conduct that puts people or property at risk. Contact the front desk with questions about a decision or your membership status.'],
  ['Changes to the Terms', 'FitPulse may update these terms. The updated terms will show a new effective date. Review and accept the current terms when prompted to continue signing in.'],
  ['Contact Information', 'Contact the FitPulse Gym front desk for membership, payment, account, or privacy questions.']
]

export default function MemberTerms({ ticket, onAccepted, onCancel }) {
  const [readToEnd, setReadToEnd] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)

  async function continueToVerification(event) {
    event.preventDefault()
    if (!readToEnd || !accepted || submitting.current) return
    submitting.current = true
    setBusy(true)
    setError('')
    try {
      const result = await apiRequest('/auth/member-terms', {
        method: 'POST',
        body: JSON.stringify({ termsTicket: ticket, accepted, version: MEMBER_TERMS_VERSION })
      })
      if (!result.challenge) throw new Error('Unable to start facial verification. Please sign in again.')
      onAccepted(result.challenge)
    } catch (cause) {
      setError(cause.code === 'INVALID_VERIFICATION'
        ? 'This sign-in step expired. Return to login and enter your credentials again.'
        : cause.message)
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return (
    <Dialog title="Member Terms and Conditions" onClose={onCancel} busy={busy}>
      <form className="member-terms" onSubmit={continueToVerification}>
        <p className="modal-copy" id="member-terms-instructions">
          Effective date <time dateTime={MEMBER_TERMS_VERSION}>{formatDate(MEMBER_TERMS_VERSION)}</time>.
          {' '}Scroll to the end before accepting.
        </p>
        <div
          className="member-terms-scroll clay-in"
          role="region"
          aria-label="Terms and Conditions text"
          aria-describedby="member-terms-instructions"
          tabIndex={0}
          data-autofocus
          onScroll={({ currentTarget }) => {
            if (currentTarget.scrollHeight - currentTarget.clientHeight - currentTarget.scrollTop <= 2)
              setReadToEnd(true)
          }}
        >
          <ol>
            {sections.map(([title, text]) => (
              <li key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
        <label className="member-terms-accept">
          <input type="checkbox" disabled={!readToEnd || busy} checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)} />
          I have read and accept the Terms and Conditions.
        </label>
        {error && <p className="reset-error" role="alert">{error}</p>}
        <div className="ma">
          <button className="btn ghost cancel-button" type="button" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button className="btn" type="submit" disabled={!readToEnd || !accepted || busy}>
            {busy ? 'Continuing…' : 'Continue to facial verification'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
