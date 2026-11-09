import { useEffect, useState } from 'react'
import { memberIdTypes } from '../../../shared/memberIdTypes'
import { apiRequest } from '../../utils/api'
import Dialog from '../Dialog'
import {
  idVerificationError,
  idVerificationLabels,
  idVerificationPath,
  IdVerificationResult
} from './MemberIdWizard'

function ReviewDecision({ verification, onDecision, busy }) {
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
              Inspect the original ID with the member present. FitPulse discards uploaded images.
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
          Save decision
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
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
    setSaving(true)
    setError('')
    try {
      const result = await apiRequest(`${idVerificationPath}/${selected.id}/review`, {
        token,
        method: 'POST',
        body: JSON.stringify(values)
      })
      setSelected(result.verification)
      setRefresh((value) => value + 1)
    } catch (cause) {
      setError(idVerificationError(cause))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog title="ID Reviews" onClose={onClose} busy={saving} className="id-check-dialog">
      <div className="mf id-check-wizard">
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
            <p className="form-help">
              {selected.documentAttempts} uploads · {selected.attempts} face attempts
            </p>
            {isAdmin &&
              !selected.processing &&
              ['needs_review', 'rejected'].includes(selected.status) && (
                <ReviewDecision
                  key={selected.id}
                  verification={selected}
                  onDecision={saveDecision}
                  busy={saving}
                />
              )}
            <div className="ma">
              <button
                className="btn ghost"
                type="button"
                disabled={saving}
                onClick={() => setSelected(null)}
              >
                Back to list
              </button>
              <button
                className="btn"
                type="button"
                disabled={saving}
                onClick={() => onResume(selected)}
              >
                {['approved', 'verified'].includes(selected.status)
                  ? 'Finish creating account'
                  : 'Open verification'}
              </button>
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
              <p role="status">Loading verifications…</p>
            ) : error ? null : cases.length ? (
              <ul className="id-check-queue">
                {cases.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <small>{idVerificationLabels[item.status]}</small>
                    </div>
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() => setSelected(item)}
                      aria-label={`View verification for ${item.name}`}
                    >
                      View
                    </button>
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
