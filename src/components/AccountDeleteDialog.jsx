import { useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'
import Dialog from './Dialog'

export default function AccountDeleteDialog({ account, self = false, onClose, onDeleted }) {
  const { token } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const actionLock = useRef(false)

  const remove = async (event) => {
    event.preventDefault()
    if (actionLock.current) return
    const values = new FormData(event.currentTarget)
    if (values.get('confirmation') !== 'DELETE') {
      setError('Type DELETE to confirm account deletion.')
      return
    }
    actionLock.current = true
    setBusy(true)
    setError('')
    try {
      await apiRequest(self ? '/profile' : `/admin/members/${account.id}`, {
        token,
        method: 'DELETE',
        body: JSON.stringify({
          confirmation: values.get('confirmation'),
          currentPassword: values.get('currentPassword')
        })
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
      title={self ? 'Delete your account?' : 'Delete member account?'}
      busy={busy}
      onClose={onClose}
    >
      <form className="mf" onSubmit={remove}>
        <p className="modal-copy">
          Permanently delete <strong>{account.name}</strong> ({account.email}), including the login,
          profile photos, saved face data, membership, payments, and attendance history. This cannot
          be undone. {self && 'You will be signed out and your gym pass will stop working.'}
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
          Type DELETE to confirm
          <input
            className="clay-in"
            name="confirmation"
            autoComplete="off"
            spellCheck={false}
            pattern="DELETE"
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
          <button className="btn ghost" type="button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button className="btn danger" type="submit" disabled={busy}>
            {busy ? 'Deleting...' : 'Delete account permanently'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
