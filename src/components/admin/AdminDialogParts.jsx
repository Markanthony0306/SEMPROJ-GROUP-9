import Dialog from '../Dialog'

export function Modal({ title, children, onClose, busy, error, className, invalidField, dismissOnBackdrop, dismissOnEscape }) {
  // Dialog handles mobile focus without adding a second form or submit path.
  return (
    <Dialog
      title={title}
      onClose={onClose}
      busy={busy}
      className={className}
      invalidField={invalidField}
      dismissOnBackdrop={dismissOnBackdrop}
      dismissOnEscape={dismissOnEscape}
    >
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
