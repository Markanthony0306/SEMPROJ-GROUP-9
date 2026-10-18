import { useEffect, useId, useRef } from 'react'

export default function Dialog({ title, children, onClose, busy = false, className = '' }) {
  const titleId = useId()
  const dialogRef = useRef(null)
  useEffect(() => {
    const previousFocus = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const dialog = dialogRef.current
    const autofocus = dialog?.querySelector('[data-autofocus]:not(:disabled)')
    const firstControl =
      autofocus ||
      dialog?.querySelector('input:not(:disabled), select:not(:disabled), button:not(:disabled)')
    firstControl?.focus()
    return () => {
      document.body.style.overflow = overflow
      previousFocus?.focus()
    }
  }, [title])
  const onKeyDown = (event) => {
    if (event.key === 'Escape' && !busy) onClose()
    if (event.key !== 'Tab') return
    const controls = [
      ...dialogRef.current.querySelectorAll('button, input, select, textarea, a[href]')
    ].filter(
      (element) => !element.disabled && element.tabIndex !== -1 && element.getClientRects().length
    )
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (!first) {
      event.preventDefault()
      return
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
  return (
    <div
      className="modal show experience-modal"
      onMouseDown={(event) => !busy && event.target === event.currentTarget && onClose()}
    >
      <section
        className={`clay experience-dialog ${className}`}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={busy}
        onKeyDown={onKeyDown}
        tabIndex={-1}
      >
        <div className="mh">
          <h2 id={titleId}>{title}</h2>
          <button
            className="ib sm"
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
    </div>
  )
}
