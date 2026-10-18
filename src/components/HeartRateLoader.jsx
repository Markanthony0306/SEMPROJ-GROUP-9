import { useEffect, useRef } from 'react'
import { createLoaderTimer, LOADER_DURATION_MS } from '../utils/loaderTiming'
import './HeartRateLoader.css'

export default function HeartRateLoader({ message = 'Getting things ready', onComplete }) {
  const timerRef = useRef(null)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])
  useEffect(() => {
    timerRef.current ||= createLoaderTimer(() => onCompleteRef.current?.())
    timerRef.current.start()
    return () => timerRef.current.stop()
  }, [])

  return (
    <div
      className="loading-overlay"
      style={{ '--loader-duration': `${LOADER_DURATION_MS}ms` }}
      role="status"
      aria-live="polite"
    >
      <div className="clay loading-card">
        <div className="loading-brand">
          Fit<span>Pulse</span>
          <i aria-hidden="true" />
        </div>
        <svg className="loading-pulse" viewBox="0 0 240 60" fill="none" aria-hidden="true">
          <path d="M0 30h55l12-12 14 29 19-44 19 54 17-27h104" />
        </svg>
        <strong>{message}</strong>
        <small>Your next session starts here.</small>
        <div className="loading-track" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  )
}
