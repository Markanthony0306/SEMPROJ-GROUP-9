import { useEffect, useRef } from 'react'
import { createLoaderTimer } from '../utils/loaderTiming'
import Spinner from './Spinner'
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
      role="status"
      aria-live="polite"
    >
      <div className="clay loading-card">
        <div className="loading-brand">
          Fit<span>Pulse</span>
          <i aria-hidden="true" />
        </div>
        <Spinner large />
        <strong>{message}</strong>
        <small>Your next session starts here.</small>
      </div>
    </div>
  )
}
