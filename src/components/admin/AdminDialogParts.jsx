import Dialog from '../Dialog'

export function Modal({ title, children, onClose, busy, error, className, invalidField }) {
  // Dialog handles mobile focus without adding a second form or submit path.
  return (
    <Dialog title={title} onClose={onClose} busy={busy} className={className} invalidField={invalidField}>
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
