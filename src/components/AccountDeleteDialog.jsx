
import { useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'
import Dialog from './Dialog'

export default function AccountDeleteDialog({ account, onClose, onDeactivated }) {
  const { token } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const actionLock = useRef(false)

  const deactivate = async (event) => {
    event.preventDefault()
    if (actionLock.current) return

    const values = new FormData(event.currentTarget)

    if (values.get('confirmation') !== 'DEACTIVATE') {
      setError('Type DEACTIVATE to confirm account deactivation.')
      return
    }

    actionLock.current = true
    setBusy(true)
    setError('')

    try {
      await apiRequest(`/admin/members/${account.id}/deactivate`, {
        token,
        method: 'POST',
        body: JSON.stringify({
          confirmation: values.get('confirmation'),
          currentPassword: values.get('currentPassword')
        })
      })
    } catch (cause) {
      setError(
        cause.message || 'Unable to deactivate the account. Please try again.'
      )
      actionLock.current = false
      setBusy(false)
      return
    }

    // Deactivation succeeded; refreshing must not repeat the action.
    onDeactivated()
  }

  return (
    <Dialog
      title="Deactivate member account?"
      busy={busy}
      onClose={onClose}
    >
      <form className="mf" onSubmit={deactivate}>
        <p className="modal-copy">
          Deactivate <strong>{account.name}</strong> ({account.email}).
          This will prevent the member from logging in or recording attendance.
          Their profile, membership, payments, and attendance history will be preserved.
        </p>

        <label className="field">
          Your current password
          <input
            className="clay-in"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            disabled={busy}
            data-autofocus
          />
        </label>

        <label className="field">
          Type DEACTIVATE to confirm
          <input
            className="clay-in"
            name="confirmation"
            autoComplete="off"
            spellCheck={false}
            pattern="DEACTIVATE"
            required
            disabled={busy}
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="ma">
          <button
            className="btn ghost"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="btn danger"
            type="submit"
            disabled={busy}
          >
            {busy ? 'Deactivating...' : 'Deactivate account'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
