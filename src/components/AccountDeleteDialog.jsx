import { useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'
import Dialog from './Dialog'
import Spinner from './Spinner'

export default function AccountDeleteDialog({ account, onClose, onDeleted }) {
  const { token } = useAuth()
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const actionLock = useRef(false)
  const confirmed = confirmation.trim() === 'DELETE'

  const close = () => {
    setConfirmation('')
    onClose()
  }

  const remove = async (value) => {
    const typedConfirmation = value.trim()
    if (actionLock.current || typedConfirmation !== 'DELETE') return
    actionLock.current = true
    setBusy(true)
    setError('')
    try {
      await apiRequest(`/admin/members/${account.id}`, {
        token,
        method: 'DELETE',
        body: JSON.stringify({ confirmation: typedConfirmation })
      })
    } catch (cause) {
      setError(cause.message || 'Unable to delete the account. Please try again.')
      actionLock.current = false
      setBusy(false)
      return
    }
    // Report success separately from refreshing the view: a failed refresh
    // must not invite the user to repeat an already completed deletion.
    onDeleted()
  }

  return (
    <Dialog
      title="Delete member account?"
      busy={busy}
      onClose={close}
      className="account-delete-dialog"
    >
      <form
        className="mf"
        onSubmit={(event) => {
          event.preventDefault()
          if (error) void remove(confirmation)
        }}
      >
        <p className="modal-copy">
          Permanently delete <strong>{account.name}</strong> ({account.email}), including the login,
          profile photos, saved face data, membership, payments, and attendance history. This cannot
          be undone.
        </p>
        <label className="field">
          Type DELETE to delete immediately
          <input
            className="clay-in"
            name="confirmation"
            value={confirmation}
            onChange={(event) => {
              const value = event.target.value
              setConfirmation(value)
              setError('')
              if (!event.nativeEvent.isComposing) void remove(value)
            }}
            onCompositionEnd={(event) => void remove(event.currentTarget.value)}
            autoComplete="off"
            spellCheck={false}
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
          <button className="btn ghost cancel-button" type="button" disabled={busy} onClick={close}>
            Cancel
          </button>
          {busy && (
            <span className="loading-inline" role="status">
              <Spinner /> Deleting account…
            </span>
          )}
          {error && (
            <button className="btn danger" type="submit" disabled={!confirmed}>
              Retry deletion
            </button>
          )}
        </div>
      </form>
    </Dialog>
  )
}
