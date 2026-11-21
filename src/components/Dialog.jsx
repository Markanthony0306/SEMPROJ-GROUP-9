import { createContext, useContext, useEffect, useId, useRef } from 'react'

export const DashboardSheetContext = createContext(false)

function flagField(field) {
  if (!field) return
  field.setAttribute('aria-invalid', 'true')
  field.focus()
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    field.animate(
      [{ translate: '0' }, { translate: '-5px' }, { translate: '5px' }, { translate: '0' }],
      { duration: 220 }
    )
}

export default function Dialog({
  title,
  children,
  onClose,
  busy = false,
  className = '',
  alert = false,
  sheet = false,
  invalidField
}) {
  const mobileDashboard = useContext(DashboardSheetContext)
  const bottomSheet = mobileDashboard || sheet
  const titleId = useId()
  const dialogRef = useRef(null)
  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    window.dispatchEvent(new Event('fitpulse:dialog-change'))
    dialog.querySelector('[data-autofocus]:not(:disabled)')?.focus()
    return () => {
      dialog.close()
      window.dispatchEvent(new Event('fitpulse:dialog-change'))
    }
  }, [bottomSheet])
  useEffect(() => {
    if (!bottomSheet || busy || !invalidField) return
    const fields = Array.from(dialogRef.current.querySelectorAll('input[name], select[name]'))
    flagField(fields.find((field) => field.name === invalidField.name))
  }, [bottomSheet, busy, invalidField])
  return (
    <dialog
      className={`modal experience-modal${bottomSheet ? ' fitpulse-bottom-sheet' : ''}`}
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
      onInvalidCapture={bottomSheet ? (event) => {
        const field = event.target
        if (field.form?.querySelector('input:invalid, select:invalid, textarea:invalid') === field)
          flagField(field)
      } : undefined}
      onChangeCapture={bottomSheet ? (event) => event.target.removeAttribute('aria-invalid') : undefined}
    >
      <section className={`clay experience-dialog ${className}`}>
        <div className="mh">
          <h2 id={titleId}>{title}</h2>
          <button
            className="ib dialog-close"
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={bottomSheet ? 'Close' : 'Close dialog'}
          >
            ×
          </button>
        </div>
        {children}
      </section>
    </dialog>
  )
}
