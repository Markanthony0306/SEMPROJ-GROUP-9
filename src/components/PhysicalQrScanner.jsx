
import { useCallback, useEffect, useRef, useState } from 'react'

const SCAN_PAUSE_MS = 650
const RESET_GAP_MS = 1200
const MIN_TOKEN_LENGTH = 40
const MAX_TOKEN_LENGTH = 2048

function isFitPulseToken(value) {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)
}

export default function PhysicalQrScanner({ onScan }) {
  const bufferRef = useRef('')
  const timerRef = useRef(null)
  const lastKeyTimeRef = useRef(0)
  const processingRef = useRef(false)
  const onScanRef = useRef(onScan)

  const [feedback, setFeedback] = useState({
    status: 'ready',
    message: 'Scanner ready. Scan a FitPulse membership QR code.'
  })

  // Always use the latest attendance handler.
  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  const processScan = useCallback(async (rawToken) => {
    if (processingRef.current) return

    const qrToken = rawToken.trim()

    if (qrToken.length < MIN_TOKEN_LENGTH) return

    if (!isFitPulseToken(qrToken)) {
      setFeedback({
        status: 'error',
        message: 'Invalid QR code. Please scan a FitPulse membership QR.'
      })
      return
    }

    processingRef.current = true

    setFeedback({
      status: 'processing',
      message: 'Verifying member and recording attendance...'
    })

    try {
      const result = await onScanRef.current(qrToken)

      // Only report success after backend confirmation.
      if (result?.allowed !== true) {
        throw new Error(
          result?.message ||
          'Attendance was not confirmed by the server.'
        )
      }

      const message =
        result.code === 'ALREADY_RECORDED'
          ? 'This QR check-in was already recorded.'
          : `Attendance recorded successfully${result.memberName ? ` for ${result.memberName}` : ''}.`

      setFeedback({
        status: 'success',
        message
      })
    } catch (error) {
      setFeedback({
        status: 'error',
        message:
          error?.message ||
          'Unable to process attendance. Please try again.'
      })
    } finally {
      processingRef.current = false
    }
  }, [])

  useEffect(() => {
    function finishScan() {
      clearTimeout(timerRef.current)

      const token = bufferRef.current
      bufferRef.current = ''
      lastKeyTimeRef.current = 0

      if (token.length >= MIN_TOKEN_LENGTH) {
        void processScan(token)
      }
    }

    function handleKeyDown(event) {
      if (processingRef.current) return

      // Do not interfere with administrator shortcuts.
      if (event.ctrlKey || event.altKey || event.metaKey) return

      // Never capture text typed into other forms.
      const target = event.target
      if (
        target instanceof Element &&
        target.closest(
          'input, textarea, select, [contenteditable="true"], [role="textbox"]'
        )
      ) {
        return
      }

      // Support scanners configured to append Enter or Tab.
      if (event.key === 'Enter' || event.key === 'Tab') {
        if (bufferRef.current.length >= MIN_TOKEN_LENGTH) {
          event.preventDefault()
          finishScan()
        }
        return
      }

      // FitPulse QR JWTs contain only these characters.
      if (
        event.key.length !== 1 ||
        !/^[A-Za-z0-9._-]$/.test(event.key)
      ) {
        return
      }

      const now = Date.now()

      // Treat a long typing pause as a new scan.
      if (now - lastKeyTimeRef.current > RESET_GAP_MS) {
        bufferRef.current = ''
      }

      lastKeyTimeRef.current = now
      bufferRef.current += event.key

      if (bufferRef.current.length > MAX_TOKEN_LENGTH) {
        bufferRef.current = ''
        clearTimeout(timerRef.current)

        setFeedback({
          status: 'error',
          message: 'QR code is too long. Please scan again.'
        })
        return
      }

      // Also support scanners that do not append Enter.
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(
        finishScan,
        SCAN_PAUSE_MS
      )
    }

    window.addEventListener('keydown', handleKeyDown, true)

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
        true
      )

      clearTimeout(timerRef.current)
    }
  }, [processScan])

  const { status, message } = feedback

  return (
    <section
      className="physical-qr-scanner"
      aria-label="Physical QR scanner"
      style={{
        border: '1px solid rgba(148, 163, 184, 0.3)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16
      }}
    >
      <h3>GOOJPRT MP2300 QR Scanner</h3>

      <p>
        Keep this Attendance page active and place a
        member's FitPulse QR code in front of the scanner.
      </p>

      <div
        role="status"
        aria-live="polite"
        style={{
          padding: '14px 16px',
          borderRadius: 10,
          background:
            status === 'success'
              ? 'rgba(22, 163, 74, 0.12)'
              : status === 'error'
                ? 'rgba(220, 38, 38, 0.12)'
                : 'rgba(148, 163, 184, 0.12)',
          border:
            status === 'success'
              ? '1px solid #22c55e'
              : status === 'error'
                ? '1px solid #ef4444'
                : '1px solid rgba(148, 163, 184, 0.3)'
        }}
      >
        <strong>
          {status === 'ready' && 'Scanner Ready'}
          {status === 'processing' && 'Processing Scan...'}
          {status === 'success' && 'Scan Successful'}
          {status === 'error' && 'Scan Failed'}
        </strong>

        <p style={{ margin: '8px 0 0' }}>
          {message}
        </p>
      </div>

      <p style={{ fontSize: 12, opacity: 0.7 }}>
        No manual input required. Scans are submitted
        automatically.
      </p>
    </section>
  )
}
