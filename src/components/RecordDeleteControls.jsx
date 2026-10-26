import { useId, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'
import Dialog from './Dialog'
import { Icon } from './DashboardShell'

const CATEGORIES = {
  notifications: {
    title: 'notification',
    effect:
      'Only your current alerts are dismissed. Members, equipment, and email delivery records are preserved.'
  },
  attendance: {
    title: 'attendance',
    effect: 'Attendance totals and charts will update.'
  },
  payments: {
    title: 'payment',
    effect: 'Recorded revenue will decrease. Membership dates stay unchanged.'
  },
  renewals: {
    title: 'renewal payment',
    effect: 'Only renewal payments are included. Membership dates stay unchanged.'
  },
  maintenance: {
    title: 'maintenance',
    effect: 'Equipment and its current condition stay unchanged.'
  }
}

export function RecordDeleteButton({ all = false, label, disabled = false, onClick }) {
  return (
    <button
      className={
        all ? 'btn report-clear-button' : 'report-icon-button is-danger record-delete-button'
      }
      type="button"
      title={label}
      aria-label={label}
      aria-haspopup="dialog"
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name={all ? 'clear-data' : 'delete-data'} size={all ? 21 : 19} />
      {all && <span>Clear all data</span>}
    </button>
  )
}

export default function RecordDeleteDialog({ target, onClose, onChanged, onNotice }) {
  const { token } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const confirmationHelpId = useId()
  const actionLock = useRef(false)
  const all = target.all === true
  const details = CATEGORIES[target.category]

  const remove = async (event) => {
    event.preventDefault()
    if (actionLock.current) return
    const confirmed = new FormData(event.currentTarget).get('confirmation')
    if (all && confirmed !== 'CLEAR') {
      setError('Type CLEAR exactly to enable clearing these records.')
      return
    }
    actionLock.current = true
    setBusy(true)
    setError('')
    try {
      const collection = target.category === 'renewals' ? 'payments' : target.category
      const base =
        target.category === 'notifications'
          ? '/admin/notifications'
          : `/admin/reports/${collection}`
      const result = await apiRequest(`${base}${all ? '' : `/${target.id}`}`, {
        token,
        method: 'DELETE',
        ...(all
          ? {
              body: JSON.stringify({
                category: target.category,
                group: target.group,
                confirmation: confirmed
              })
            }
          : {})
      })
      // A refresh failure must not suggest that a successful deletion failed.
      let refreshed = false
      try {
        refreshed = (await onChanged()) !== false
      } catch {
        refreshed = false
      }
      const message = all
        ? `${result.deleted} record${result.deleted === 1 ? '' : 's'} cleared.`
        : 'Record deleted.'
      onNotice(
        `${message} ${refreshed ? 'Records and totals refreshed.' : 'Refresh failed. Reload the page to see the latest records.'}`
      )
      onClose()
    } catch (cause) {
      setError(cause.message || 'Unable to delete records. Please try again.')
    } finally {
      actionLock.current = false
      setBusy(false)
    }
  }

  return (
    <Dialog
      title={
        all ? `Clear all ${target.scopeLabel || `${details.title} data`}?` : 'Delete this record?'
      }
      busy={busy}
      onClose={onClose}
    >
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <form className="mf" onSubmit={remove}>
        <p className="modal-copy">
          {all ? (
            <>
              Clear all <strong>{target.scopeLabel || `${details.title} records`}</strong>?
              Currently loaded: {target.count}. This includes every page and records hidden by
              search.
            </>
          ) : (
            <>
              Delete the {details.title} record for <strong>{target.label}</strong>?
            </>
          )}{' '}
          This cannot be undone. {details.effect}
          {all &&
            target.category !== 'notifications' &&
            ' You can cancel and export a CSV copy from Reports first.'}
        </p>
        {all && (
          <label className="field">
            Type CLEAR to confirm
            <input
              className="clay-in"
              name="confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
              pattern="CLEAR"
              aria-describedby={confirmationHelpId}
              autoComplete="off"
              spellCheck={false}
              disabled={busy}
              data-autofocus
            />
            <small id={confirmationHelpId} className="form-help">
              The clear button is enabled after you type CLEAR in capital letters.
            </small>
          </label>
        )}
        <div className="ma">
          <button className="btn ghost" type="button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn danger"
            type="submit"
            disabled={busy || (all && confirmation !== 'CLEAR')}
          >
            <Icon name={all ? 'clear-data' : 'delete-data'} size={19} />
            {busy ? 'Deleting…' : all ? 'Clear all data' : 'Delete record'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
