import { useEffect, useId, useRef, useState } from 'react'
import { createFaceApiLoader } from '../utils/faceApi'
import {
  canReadFaceFrame, captureLiveFace, createCameraFaceScanner, faceStepLabels, FACE_SCAN_INTERVAL_MS
} from '../utils/captureLiveFace'
import { FACE_BLINK_COUNT } from '../../shared/faceLiveness.js'
import Spinner from './Spinner'
import './FaceCapture.css'

const loadFaceApi = createFaceApiLoader({
  importLibrary: () => import('face-api.js'),
  modelsUrl: `${import.meta.env.BASE_URL}models/face-api`
})

export function preloadFaceCapture() {
  // Camera setup still reports any load error and can retry.
  void loadFaceApi().catch(() => {})
}

export default function FaceCapture({
  onCaptured,
  onCaptureError,
  getChallenge,
  onReset,
  onCloseUp,
  purpose = 'verification',
  singleUseChallenge = false,
  closeShot = false,
  disabled = false,
  actionLabel = 'Capture face'
}) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const operationRef = useRef(0)
  const previewRef = useRef(null)
  const statusId = useId()
  const [cameraReady, setCameraReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Center one face in the guide.')
  const [error, setError] = useState('')
  const [needsReload, setNeedsReload] = useState(false)
  const [phase, setPhase] = useState('idle')
  const [showTips, setShowTips] = useState(false)
  const [position, setPosition] = useState(null)
  const [progress, setProgress] = useState(null)
  const [challengeUsed, setChallengeUsed] = useState(false)
  const canCapture = cameraReady && !challengeUsed && position?.guide === 'ready'

  useEffect(preloadFaceCapture, [])

  useEffect(
    () => () => {
      operationRef.current += 1
      streamRef.current?.getTracks().forEach((track) => track.stop())
    },
    []
  )

  useEffect(() => {
    if (!cameraReady || busy || disabled || challengeUsed || phase === 'success') return undefined

    let stopped = false
    let timer
    let scan
    const operation = operationRef.current
    const isCurrent = () => !stopped && operation === operationRef.current

    const monitor = async () => {
      if (!isCurrent()) return
      const started = performance.now()
      try {
        scan ||= createCameraFaceScanner(await loadFaceApi())
        await previewRef.current?.catch(() => {})
        if (!isCurrent()) return
        if (canReadFaceFrame(videoRef.current)) {
          const pending = scan(videoRef.current, true)
          previewRef.current = pending
          const { guide, message, box, points } = await pending.finally(() => {
            if (previewRef.current === pending) previewRef.current = null
          })
          if (isCurrent()) setPosition({ guide, message, box, points })
        } else {
          setPosition(null)
        }
      } catch (cause) {
        if (!isCurrent()) return
        setPosition(null)
        setError(cause.message || 'Could not read your camera. Restart it and try again.')
        return
      }
      if (isCurrent()) {
        const delay = Math.max(0, FACE_SCAN_INTERVAL_MS - (performance.now() - started))
        timer = window.setTimeout(monitor, delay)
      }
    }

    monitor()
    return () => {
      stopped = true
      window.clearTimeout(timer)
    }
  }, [cameraReady, busy, disabled, challengeUsed, phase])

  const startCamera = async () => {
    if (busy || disabled || challengeUsed) return
    onReset?.()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraReady(false)
    setPosition(null)
    setProgress(null)
    const operation = ++operationRef.current
    setBusy(true)
    setPhase('loading')
    setError('')
    setNeedsReload(false)
    setMessage('Getting your camera ready. This can take a moment the first time.')
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error('Camera access requires HTTPS or localhost in a supported browser.')
      const faceapi = await loadFaceApi()
      if (operation !== operationRef.current) return null
      setPhase('permission')
      setMessage('Allow camera access in your browser to continue.')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      if (operation !== operationRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return null
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = stream
      stream.getVideoTracks().forEach((track) => track.addEventListener('ended', () => {
        if (streamRef.current !== stream) return
        operationRef.current += 1
        streamRef.current = null
        setCameraReady(false)
        setPosition(null)
        setBusy(false)
        setPhase('error')
        setMessage('')
        setError('The camera disconnected. Restart your camera and try again.')
      }, { once: true }))
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      if (operation !== operationRef.current) return null
      setCameraReady(true)
      setPhase('ready')
      setMessage('Center one face in the guide, then continue.')
      return faceapi
    } catch (cause) {
      if (operation !== operationRef.current) return null
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setPhase('error')
      setNeedsReload(cause.code === 'FACE_LIBRARY_LOAD_FAILED')
      setError(
        cause.name === 'NotAllowedError'
          ? 'Camera permission is blocked. Allow it in your browser settings, then try again.'
          : cause.name === 'NotFoundError'
            ? 'No camera found. Connect a camera and try again.'
            : cause.message || 'Could not start the face camera.'
      )
      setMessage('')
      return null
    } finally {
      if (operation === operationRef.current) setBusy(false)
    }
  }

  const capture = async () => {
    if (busy || disabled || !canCapture) return
    onReset?.()
    const operation = ++operationRef.current
    setBusy(true)
    setPhase('scanning')
    setMessage('Reading your camera…')
    setError('')
    setProgress(null)
    setNeedsReload(false)
    let challenge
    let submitted = false
    try {
      const faceapi = await loadFaceApi()
      // A preview inference may still be finishing as capture takes over.
      await previewRef.current?.catch(() => {})
      if (operation !== operationRef.current) return
      if (!canReadFaceFrame(videoRef.current))
        throw new Error('Wait for the camera image before capturing.')
      const scan = createCameraFaceScanner(faceapi)
      challenge = await getChallenge()
      if (operation !== operationRef.current) return
      const frames = await captureLiveFace({
        video: videoRef.current,
        scan,
        actions: challenge.actions,
        closeShot,
        isCurrent: () => operation === operationRef.current,
        onPrompt: setMessage,
        onProgress: (next) => {
          setProgress(next)
          if (next.step === 'close') onCloseUp?.()
        },
        onPosition: ({ guide, message, box, points }) => setPosition({ guide, message, box, points })
      })
      if (!frames) return
      if (operation !== operationRef.current) return
      setPhase('verifying')
      setMessage(purpose === 'enrollment' ? 'Saving your face enrollment…' : 'Checking your face…')
      if (singleUseChallenge) setChallengeUsed(true)
      submitted = true
      const result = await onCaptured({ frames, challengeToken: challenge.challengeToken })
      if (operation !== operationRef.current) return
      if (result === false) {
        setPhase('ready')
        setMessage('')
        return
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setCameraReady(false)
      setPhase('success')
      setMessage(
        purpose === 'enrollment'
          ? 'Face enrollment saved.'
          : 'Face verification complete.'
      )
    } catch (cause) {
      if (operation !== operationRef.current) return
      setPhase('error')
      setNeedsReload(cause.code === 'FACE_LIBRARY_LOAD_FAILED')
      if (challenge && singleUseChallenge) {
        setChallengeUsed(true)
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        setCameraReady(false)
      }
      const detail = cause.message || 'Could not capture or verify the face. Please try again.'
      setError(!submitted && challenge && singleUseChallenge ? `${detail} Go back to password login to retry.` : detail)
      setMessage('')
      onCaptureError?.(cause, submitted ? undefined : challenge?.challengeToken)
    } finally {
      if (operation === operationRef.current) setBusy(false)
    }
  }

  const resetCapture = () => {
    onReset?.()
    setError('')
    setPhase('ready')
    setMessage('Center your face in the guide, then select Capture face.')
  }
  const readyToVerify = canCapture || ['scanning', 'verifying'].includes(phase)
  const currentStep = phase === 'success' ? 3 : readyToVerify ? 2 : cameraReady ? 1 : 0
  const livePosition = cameraReady && phase !== 'verifying' ? position : null

  return (
    <div className={`face-capture is-${phase}`} aria-busy={disabled || (busy && phase !== 'scanning')}>
      <ol className="face-steps" aria-label="Verification progress">
        {['Camera', 'Position face', purpose === 'enrollment' ? 'Capture' : 'Verify'].map(
          (step, index) => (
            <li
              key={step}
              className={index < currentStep ? 'complete' : index === currentStep ? 'current' : ''}
              aria-current={index === currentStep ? 'step' : undefined}
            >
              <button
                type="button"
                disabled={
                  busy ||
                  disabled || challengeUsed ||
                  (index > 0 && !cameraReady) ||
                  (index === 2 && !canCapture)
                }
                aria-describedby={statusId}
                onClick={index === 0 ? startCamera : index === 1 ? resetCapture : capture}
                title={
                  index === 0
                    ? 'Start or reconnect the camera'
                    : index === 1
                      ? 'Adjust your position'
                      : 'Capture and check your face'
                }
              >
                <i className="face-step-circle" aria-hidden="true">
                  {index < currentStep ? (
                    <svg className="face-step-check" viewBox="0 0 24 24" fill="none">
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </i>
                <span>{step}</span>
              </button>
            </li>
          )
        )}
      </ol>
      <div className="face-viewport" data-close-up={progress?.step === 'close' || undefined}>
        <video ref={videoRef} autoPlay muted playsInline aria-label="Face camera preview" />
        <div className="face-guide" data-position={livePosition?.guide} aria-hidden="true" />
        {livePosition?.box && (
          <div className="face-detection-box" style={livePosition.box} aria-hidden="true" />
        )}
        {livePosition?.points?.map((point, index) => (
          <span className="face-landmark" style={{ left: point.left, top: point.top }} key={index} aria-hidden="true" />
        ))}
        {livePosition && (
          <div className="face-live-status" data-position={livePosition.guide} role="status">
            <i aria-hidden="true" />
            <span>{livePosition.message}</span>
          </div>
        )}
        {!cameraReady && (
          <div className="face-placeholder" aria-hidden="true">
            <svg viewBox="0 0 80 80" fill="none">
              <rect x="6" y="6" width="68" height="68" rx="24" />
              <circle cx="40" cy="32" r="11" />
              <path d="M20 62c2-17 38-17 40 0" />
            </svg>
            <span>Your camera preview will appear here</span>
          </div>
        )}
        {busy && phase !== 'scanning' && (
          <div className="face-processing">
            <Spinner />
            <b>{phase === 'verifying' ? 'Processing capture' : 'Preparing camera'}</b>
          </div>
        )}
        {cameraReady && !busy && (
          <span className="face-camera-badge">
            <i />
            Camera on
          </span>
        )}
      </div>
      {progress && (
        <ol className="face-gesture-steps" aria-label="Live check progress">
          {['align', ...progress.actions].map((step, index, steps) => {
            const complete = progress.complete || index < steps.indexOf(progress.step)
            const current = step === progress.step
            return (
              <li key={step} aria-current={current ? 'step' : undefined}>
                {complete && <span className="face-gesture-check" aria-label="Completed">✓</span>}
                {step === 'blink' && (current || complete)
                  ? `Blink ${progress.blinks}/${FACE_BLINK_COUNT}`
                  : step === 'close' ? 'Move closer' : faceStepLabels[step]}
              </li>
            )
          })}
        </ol>
      )}
      <p id={statusId} className="face-status" role="status">{message}</p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="face-capture-actions">
        {challengeUsed ? null : needsReload ? (
          <button
            className="btn"
            type="button"
            disabled={busy || disabled}
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        ) : !cameraReady ? (
          <button
            className="btn ghost"
            type="button"
            disabled={busy || disabled}
            onClick={startCamera}
          >
            {busy ? 'Getting ready…' : phase === 'success' ? 'Capture again' : error ? 'Try camera again' : 'Start camera'}
          </button>
        ) : (
          <button className="btn" type="button" disabled={busy || disabled || !canCapture} onClick={capture}>
            {busy ? 'Checking your face…' : error ? 'Retry live check' : actionLabel}
          </button>
        )}
      </div>
      <button
        className="face-help-toggle"
        type="button"
        aria-expanded={showTips}
        onClick={() => setShowTips((value) => !value)}
      >
        {showTips ? 'Hide camera tips' : 'Need help getting a clear capture?'}
      </button>
      {showTips && (
        <ul className="face-tips">
          <li>Face a light source and remove anything covering your face.</li>
          <li>Keep one face inside the guide and hold the camera at eye level.</li>
          <li>If a sign-in check fails, return to password login and try again.</li>
        </ul>
      )}
      {purpose !== 'enrollment' && (
        <details className="face-privacy">
          <summary>How your face data is used</summary>
          <p>
            FitPulse checks camera frames on its server and discards them after processing.
            During setup, it stores an encrypted face template. You can ask the gym to remove it.
          </p>
          <p>Staff still check your photo ID during member setup.</p>
        </details>
      )}
    </div>
  )
}
