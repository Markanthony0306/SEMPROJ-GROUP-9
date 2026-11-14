import { useEffect, useId, useRef } from 'react'

export default function Dialog({
  title,
  children,
  onClose,
  busy = false,
  className = '',
  alert = false
}) {
  const titleId = useId()
  const dialogRef = useRef(null)
  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    dialog.querySelector('[data-autofocus]:not(:disabled)')?.focus()
    return () => dialog.close()
  }, [])
  return (
    <dialog
      className="modal experience-modal"
      ref={dialogRef}
      role={alert ? 'alertdialog' : 'dialog'}
      aria-labelledby={titleId}
      aria-modal="true"
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
      onMouseDown={(event) => !busy && event.target === event.currentTarget && onClose()}
    >
      <section className={`clay experience-dialog ${className}`}>
        <div className="mh">
          <h2 id={titleId}>{title}</h2>
          <button
            className="ib dialog-close"
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        {children}
      </section>
    </dialog>
  )
}
