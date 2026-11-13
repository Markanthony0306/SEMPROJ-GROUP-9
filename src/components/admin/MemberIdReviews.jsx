import { useEffect, useState } from 'react'
import { memberIdTypes } from '../../../shared/memberIdTypes'
import { apiRequest } from '../../utils/api'
import Dialog from '../Dialog'
import Spinner from '../Spinner'
import {
  idVerificationError,
  idVerificationLabels,
  idVerificationPath,
  IdVerificationResult
} from './MemberIdWizard'

function ReviewDecision({ verification, onDecision, busy, submitting }) {
  const [decision, setDecision] = useState('approve')
  const [noExpiry, setNoExpiry] = useState(false)
  const mayHaveNoExpiry = ['national_id', 'student_id'].includes(verification.idType)

  return (
    <form
      className="mf"
      onSubmit={(event) => {
        event.preventDefault()
        const values = Object.fromEntries(new FormData(event.currentTarget))
        onDecision({
          ...values,
          decision,
          inspected: values.inspected === 'on',
          noExpiry: decision === 'approve' && noExpiry
        })
      }}
    >
      <fieldset className="modal-fields mf" disabled={busy}>
        <label className="field">
          Decision
          <select
            className="clay-in"
            value={decision}
            onChange={(event) => setDecision(event.target.value)}
          >
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
          </select>
        </label>
        {decision === 'approve' && (
          <>
            <p className="form-help">
              Inspect the original ID with the member present before approving this submission.
            </p>
            <label className="field">
              ID number as printed
              <input
                className="clay-in"
                name="idNumber"
                maxLength={55}
                autoComplete="off"
                required
              />
            </label>
            {verification.idType === 'student_id' && (
              <label className="field">
                Issuing school
                <input className="clay-in" name="issuer" maxLength={120} required />
              </label>
            )}
            <label className="field">
              Expiry date
              <input
                className="clay-in"
                name="expiryDate"
                type="date"
                disabled={noExpiry}
                required={!noExpiry}
              />
            </label>
            {mayHaveNoExpiry && (
              <label className="set id-check-consent">
                <input
                  type="checkbox"
                  checked={noExpiry}
                  onChange={(event) => setNoExpiry(event.target.checked)}
                />
                <span>I confirmed this document has no expiry date.</span>
              </label>
            )}
            <label className="set id-check-consent">
              <input type="checkbox" name="inspected" required />
              <span>
                I checked the original ID, its validity, the member’s name, and their face in
                person.
              </span>
            </label>
          </>
        )}
        <label className="field">
          Review notes
          <textarea
            className="clay-in"
            name="notes"
            rows={3}
            maxLength={600}
            placeholder="Explain your decision without including ID numbers or birth dates."
            required
          />
        </label>
        <button className="btn" type="submit" disabled={busy}>
          {submitting && <Spinner />}
          {submitting ? 'Saving decision…' : 'Save decision'}
        </button>
      </fieldset>
    </form>
  )
}

export default function MemberIdReviews({ token, isAdmin, onClose, onResume }) {
  const [page, setPage] = useState(0)
  const [cases, setCases] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [selected, setSelected] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [resetEmail, setResetEmail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    apiRequest(`${idVerificationPath}?page=${page}`, { token, signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return
        setCases(result.cases)
        setHasMore(result.hasMore)
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(idVerificationError(cause))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [page, refresh, token])

  async function saveDecision(values) {
    if (saving || !selected) return
    setSaving('review')
    setError('')
    setNotice('')
    try {
      const result = await apiRequest(`${idVerificationPath}/${selected.id}/review`, {
        token,
        method: 'POST',
        body: JSON.stringify(values)
      })
      setSelected(result.verification)
      setNotice(values.decision === 'reject' ? 'Rejection saved.' : 'Approval saved.')
      setRefresh((value) => value + 1)
    } catch (cause) {
      setError(idVerificationError(cause))
    } finally {
      setSaving('')
    }
  }

  function openReset(email = '') {
    setError('')
    setNotice('')
    setResetEmail(email)
  }

  async function resetAttempts(event) {
    event.preventDefault()
    if (saving || !isAdmin) return
    const email = new FormData(event.currentTarget).get('email')
    setSaving('reset')
    setError('')
    setNotice('')
    try {
      const result = await apiRequest(`${idVerificationPath}/reset-attempts`, {
        token,
        method: 'POST',
        body: JSON.stringify({ email })
      })
      setResetEmail(null)
      setSelected(null)
      setNotice(result.message || 'Rejected attempts reset.')
      setRefresh((value) => value + 1)
    } catch (cause) {
      setError(idVerificationError(cause))
    } finally {
      setSaving('')
    }
  }

  function openDelete(item) {
    setError('')
    setNotice('')
    setConfirmDelete(item)
  }

  function closeDelete() {
    setConfirmDelete(null)
    setError('')
  }

  async function deleteVerification() {
    if (saving || !isAdmin || !confirmDelete) return
    setSaving('delete')
    setError('')
    try {
      const result = await apiRequest(`${idVerificationPath}/${confirmDelete.id}`, {
        token,
        method: 'DELETE'
      })
      setSelected(null)
      setConfirmDelete(null)
      setCases((current) => current.filter((item) => item.id !== confirmDelete.id))
      setNotice(result.message || 'ID review and stored files deleted.')
      if (cases.length === 1 && page > 0) setPage((value) => value - 1)
      else setRefresh((value) => value + 1)
    } catch (cause) {
      setError(idVerificationError(cause))
    } finally {
      setSaving('')
    }
  }

  const busy = Boolean(saving)
  if (resetEmail !== null) {
    const closeReset = () => {
      setResetEmail(null)
      setError('')
    }
    return (
      <Dialog
        title="Reset rejected attempts"
        onClose={closeReset}
        busy={busy}
        className="id-check-dialog"
      >
        <form className="mf id-check-wizard" onSubmit={resetAttempts}>
          <p className="form-help">Enter the email used for the rejected submissions.</p>
          <label className="field">
            Email
            <input
              className="clay-in"
              type="email"
              name="email"
              autoComplete="email"
              defaultValue={resetEmail}
              required
              disabled={busy}
              data-autofocus
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="ma">
            <button
              className="btn ghost cancel-button"
              type="button"
              disabled={busy}
              onClick={closeReset}
            >
              Cancel
            </button>
            <button className="btn" type="submit" disabled={busy}>
              {busy && <Spinner />}
              {busy ? 'Resetting attempts…' : 'Reset rejected attempts'}
            </button>
          </div>
        </form>
      </Dialog>
    )
  }

  if (confirmDelete) {
    return (
      <Dialog
        title="Delete ID review?"
        onClose={closeDelete}
        busy={busy}
        className="id-check-dialog"
      >
        <div className="mf id-check-wizard">
          <p>
            Delete the ID review and stored ID files for <strong>{confirmDelete.name}</strong>? This
            action is permanent.
          </p>
          {confirmDelete.memberId && (
            <p className="form-help">Deleting this ID will block the member’s face sign-in.</p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="ma">
            <button
              className="btn ghost cancel-button"
              type="button"
              disabled={busy}
              onClick={closeDelete}
              data-autofocus
            >
              Cancel
            </button>
            <button
              className="btn danger"
              type="button"
              disabled={busy}
              onClick={deleteVerification}
            >
              {busy && <Spinner />}
              {busy ? 'Deleting review…' : 'Delete review'}
            </button>
          </div>
        </div>
      </Dialog>
    )
  }

  return (
    <Dialog title="ID Reviews" onClose={onClose} busy={busy} className="id-check-dialog">
      <div className="mf id-check-wizard">
        {notice && (
          <p className="id-check-notice" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {selected ? (
          <>
            <h3>{selected.name}</h3>
            <p className="form-help">
              {selected.email} · {memberIdTypes[selected.idType] || 'No ID uploaded'}
            </p>
            <IdVerificationResult verification={selected} />
            {selected.memberId && <p className="form-help">Linked to a member account.</p>}
            {isAdmin &&
              !selected.memberId &&
              selected.hasDocuments &&
              selected.remainingAttempts > 0 &&
              ['awaiting_face', 'needs_review'].includes(selected.status) && (
                <ReviewDecision
                  key={`${selected.id}:${selected.status}`}
                  verification={selected}
                  onDecision={saveDecision}
                  busy={busy}
                  submitting={saving === 'review'}
                />
              )}
            <div className="ma">
              <button
                className="btn ghost"
                type="button"
                disabled={busy}
                onClick={() => setSelected(null)}
              >
                Back to list
              </button>
              {isAdmin && selected.rejectedAttempts > 0 && (
                <button
                  className="btn ghost"
                  type="button"
                  disabled={busy}
                  onClick={() => openReset(selected.email)}
                >
                  Reset rejected attempts
                </button>
              )}
              {!selected.memberId && (
                <button
                  className="btn"
                  type="button"
                  disabled={busy}
                  onClick={() => onResume(selected)}
                >
                  {selected.faceEnrolled ? 'Finish creating account' : 'Open verification'}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="form-help">
              {isAdmin
                ? 'Open a submission to review its decision or finish the account.'
                : 'Check the status of your submissions.'}
            </p>
            {loading ? (
              <p className="id-check-progress" role="status">
                <Spinner /> Loading verifications…
              </p>
            ) : error ? null : cases.length ? (
              <ul className="id-check-queue">
                {cases.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <small>{idVerificationLabels[item.status]}</small>
                    </div>
                    <div className="id-check-queue-actions">
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() => {
                          setNotice('')
                          setSelected(item)
                        }}
                        aria-label={`View verification for ${item.name}`}
                      >
                        View
                      </button>
                      {isAdmin && (
                        <button
                          className="btn danger"
                          type="button"
                          onClick={() => openDelete(item)}
                          aria-label={`Delete verification for ${item.name}`}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="form-help">No open verifications on this page.</p>
            )}
            <div className="ma">
              <button
                className="btn ghost"
                type="button"
                disabled={loading}
                onClick={() => setRefresh((value) => value + 1)}
              >
                Refresh
              </button>
              {isAdmin && (
                <button
                  className="btn ghost"
                  type="button"
                  disabled={loading}
                  onClick={() => openReset()}
                >
                  Reset attempts by email
                </button>
              )}
              {page > 0 && (
                <button
                  className="btn ghost"
                  type="button"
                  disabled={loading}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
              )}
              {hasMore && (
                <button
                  className="btn ghost"
                  type="button"
                  disabled={loading}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}
