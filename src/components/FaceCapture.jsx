import { useEffect, useId, useRef, useState } from 'react'
import { createFaceApiLoader } from '../utils/faceApi'
import './FaceCapture.css'

const loadFaceApi = createFaceApiLoader({
  importLibrary: () => import('face-api.js'),
  modelsUrl: `${import.meta.env.BASE_URL}models/face-api`
})

export default function FaceCapture({
  onCaptured,
  onReset,
  purpose = 'verification',
  disabled = false,
  actionLabel = 'Capture face'
}) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const operationRef = useRef(0)
  const statusId = useId()
  const [cameraReady, setCameraReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Start the camera, then center one face in the frame.')
  const [error, setError] = useState('')
  const [needsReload, setNeedsReload] = useState(false)
  const [phase, setPhase] = useState('idle')
  const [showTips, setShowTips] = useState(false)
  const [motionDetected, setMotionDetected] = useState(false)
  const [faceInFrame, setFaceInFrame] = useState(false)
  const canCapture = cameraReady && motionDetected && faceInFrame

  useEffect(
    () => () => {
      operationRef.current += 1
      streamRef.current?.getTracks().forEach((track) => track.stop())
    },
    []
  )

  useEffect(() => {
    if (!cameraReady || busy || disabled || phase === 'success') return undefined

    let stopped = false
    let detecting = false
    let previousFrame = null
    let motionTimeout
    const canvas = document.createElement('canvas')
    canvas.width = 96
    canvas.height = 72
    const context = canvas.getContext('2d', { willReadFrequently: true })
    let faceapi

    const monitor = async () => {
      if (stopped || detecting || !videoRef.current || videoRef.current.readyState < 2) return
      detecting = true
      try {
        faceapi ||= await loadFaceApi()
        if (stopped) return

        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        const frame = context.getImageData(0, 0, canvas.width, canvas.height).data
        const faces = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.55 })
        )
        if (stopped) return
        const hasOneFace = faces.length === 1
        setFaceInFrame(hasOneFace)

        if (previousFrame) {
          const face = hasOneFace ? faces[0].box : null
          const scaleX = canvas.width / videoRef.current.videoWidth
          const scaleY = canvas.height / videoRef.current.videoHeight
          const left = face ? Math.max(0, Math.floor(face.x * scaleX)) : 0
          const top = face ? Math.max(0, Math.floor(face.y * scaleY)) : 0
          const right = face
            ? Math.min(canvas.width, Math.ceil((face.x + face.width) * scaleX))
            : canvas.width
          const bottom = face
            ? Math.min(canvas.height, Math.ceil((face.y + face.height) * scaleY))
            : canvas.height
          let changedPixels = 0
          let totalPixels = 0
          for (let y = top; y < bottom; y += 1) {
            for (let x = left; x < right; x += 1) {
              const index = (y * canvas.width + x) * 4
              const difference = Math.max(
                Math.abs(frame[index] - previousFrame[index]),
                Math.abs(frame[index + 1] - previousFrame[index + 1]),
                Math.abs(frame[index + 2] - previousFrame[index + 2])
              )
              if (difference > 18) changedPixels += 1
              totalPixels += 1
            }
          }
          if (totalPixels && changedPixels / totalPixels > 0.008) {
            setMotionDetected(true)
            clearTimeout(motionTimeout)
            motionTimeout = setTimeout(() => setMotionDetected(false), 1400)
          }
        }
        previousFrame = frame
      } catch {
        // The explicit capture action reports model or camera errors to the user.
      } finally {
        detecting = false
      }
    }

    const interval = window.setInterval(monitor, 180)
    monitor()
    return () => {
      stopped = true
      window.clearInterval(interval)
      clearTimeout(motionTimeout)
    }
  }, [cameraReady, busy, disabled, phase])

  const startCamera = async () => {
    if (busy || disabled) return
    onReset?.()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraReady(false)
    setMotionDetected(false)
    setFaceInFrame(false)
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      if (operation !== operationRef.current) return null
      setCameraReady(true)
      setPhase('ready')
      setMessage('Camera ready. Face forward with good lighting.')
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
    if (busy || disabled || !cameraReady) return
    onReset?.()
    const operation = ++operationRef.current
    setBusy(true)
    setPhase('scanning')
    setMessage('Finding your face. Look straight at the camera and hold still.')
    setError('')
    setNeedsReload(false)
    try {
      const faceapi = await loadFaceApi()
      if (operation !== operationRef.current) return
      if (!videoRef.current || videoRef.current.readyState < 2)
        throw new Error('Wait for the camera image before capturing.')
      const detections = await faceapi
        .detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.55 })
        )
        .withFaceLandmarks(true)
        .withFaceDescriptors()
      if (detections.length !== 1)
        throw new Error(
          detections.length
            ? 'Only one face should be visible.'
            : 'No face found. Adjust the lighting and try again.'
        )
      if (operation !== operationRef.current) return
      setPhase('verifying')
      setMessage(
        purpose === 'enrollment'
          ? 'Preparing your face capture…'
          : 'Face captured. Checking your details…'
      )
      const result = await onCaptured(Array.from(detections[0].descriptor))
      if (result === false) throw new Error('The face check was not completed. Please try again.')
      if (operation !== operationRef.current) return
      setPhase('success')
      setMessage(
        purpose === 'enrollment'
          ? 'Face captured. Select Save to finish setup.'
          : 'Face verification complete.'
      )
    } catch (cause) {
      if (operation !== operationRef.current) return
      setPhase('error')
      setNeedsReload(cause.code === 'FACE_LIBRARY_LOAD_FAILED')
      setError(cause.message || 'Could not capture or verify the face. Please try again.')
      setMessage('')
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
  const currentStep =
    phase === 'success' ? 3 : ['scanning', 'verifying'].includes(phase) ? 2 : cameraReady ? 1 : 0

  return (
    <div className={`face-capture is-${phase}`} aria-busy={busy || disabled}>
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
                  disabled ||
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
                <small>
                  {index < currentStep
                    ? 'Done'
                    : index === currentStep
                      ? 'Current step'
                      : 'Up next'}
                </small>
              </button>
            </li>
          )
        )}
      </ol>
      <div className="face-viewport">
        <video ref={videoRef} autoPlay muted playsInline aria-label="Face camera preview" />
        {cameraReady && !busy && (
          <div className="face-live-status" aria-live="polite">
            <span className={motionDetected ? 'is-detected' : ''}>
              <i /> {motionDetected ? 'Movement detected' : 'Motion detector on'}
            </span>
            <span className={faceInFrame ? 'is-detected' : ''}>
              <i /> {faceInFrame ? 'Face in frame' : 'Looking for one face'}
            </span>
          </div>
        )}
        <div className="face-guide" aria-hidden="true">
          <span />
        </div>
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
        {busy && (
          <div className="face-processing">
            <span className="face-spinner" aria-hidden="true" />
            <b>
              {phase === 'scanning'
                ? 'Scanning your face'
                : phase === 'verifying'
                  ? 'Verifying'
                  : 'Preparing camera'}
            </b>
          </div>
        )}
        {cameraReady && !busy && (
          <span className="face-camera-badge">
            <i />
            Camera on
          </span>
        )}
      </div>
      <p id={statusId} className="face-status" role="status" aria-live="polite">
        {message || 'Make an adjustment below, then try again.'}
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="face-capture-actions">
        {needsReload ? (
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
            {busy ? 'Getting ready…' : error ? 'Try camera again' : 'Start camera'}
          </button>
        ) : canCapture ? (
          <button className="btn" type="button" disabled={busy || disabled} onClick={capture}>
            {busy ? 'Checking your face…' : actionLabel}
          </button>
        ) : (
          <p className="face-capture-requirements" role="status">
            Move in front of the camera and keep one face in frame to continue.
          </p>
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
      <details className="face-privacy">
        <summary>How your face data is used</summary>
        <p>
          Your camera image stays in this browser. We turn your facial features into a set of
          numbers to check for a match. During setup, these numbers are sent to FitPulse and stored
          with encryption to protect them. Ask gym staff if you want your saved face data removed.
        </p>
        <p>
          A face match can make mistakes and cannot reliably tell a live person from a photo. Staff
          must still check your photo ID during setup.
        </p>
      </details>
    </div>
  )
}
