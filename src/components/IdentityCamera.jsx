import { useEffect, useRef, useState } from 'react'
import { apiRequest } from '../utils/api'
import './IdentityCamera.css'

// Live previews are sampled in memory. Nothing is stored, and server guidance
// never substitutes for final OCR, matching, or server-verified motion evidence.
function photograph(video, width = 640, quality = .76) {
  if (!video?.videoWidth || !video?.videoHeight) return null
  const canvas = document.createElement('canvas')
  canvas.width = Math.min(width, video.videoWidth)
  canvas.height = Math.round(video.videoHeight * canvas.width / video.videoWidth)
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)
}

function signature(video) {
  if (!video?.videoWidth) return null
  const canvas = document.createElement('canvas')
  canvas.width = 48
  canvas.height = 30
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(video, 0, 0, 48, 30)
  const pixels = ctx.getImageData(0, 0, 48, 30).data
  const result = new Float32Array(48 * 30)
  for (let i = 0; i < result.length; i++) result[i] = .299 * pixels[i * 4] + .587 * pixels[i * 4 + 1] + .114 * pixels[i * 4 + 2]
  return result
}

function changeFromPrevious(current, last) {
  if (!current || !last) return Infinity
  let change = 0
  for (let i = 0; i < current.length; i++) change += Math.abs(current[i] - last[i])
  return change / current.length
}

/** Live guidance is verified by the existing backend before automatic capture.
 * Auto-capture takes a photo once per mounted camera, after successive positive checks.
 * Back-side ID scanning requires a separate explicit action in CreateMemberSheet.
 */
export default function IdentityCamera({ instruction, facingMode = 'user', onCapture, disabled = false, overlay = '', side = '', captureLabel = 'Capture photo', guide = null, autoCapture = false }) {
  const video = useRef(null)
  const stream = useRef(null)
  const motion = useRef({ neutral: null, turned: null, count: 0, yaw: null, lastSignature: null, steady: 0 })
  const captureSent = useRef(false)
  const onCaptureRef = useRef(onCapture)
  onCaptureRef.current = onCapture
  const autoCaptureRef = useRef(autoCapture)
  autoCaptureRef.current = autoCapture
  const [error, setError] = useState('')
  const [devices, setDevices] = useState([])
  const [deviceId, setDeviceId] = useState('')
  const [ready, setReady] = useState(false)
  const [liveReady, setLiveReady] = useState(false)
  const [liveMessage, setLiveMessage] = useState('Starting live image check…')

  useEffect(() => {
    let active = true
    setReady(false)
    setError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access needs HTTPS or localhost and a supported browser.')
      return
    }
    const start = async () => {
      try {
        const current = await navigator.mediaDevices.getUserMedia({ audio: false, video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } } })
        if (!active) { current.getTracks().forEach(t => t.stop()); return }
        stream.current = current
        if (video.current) {
          video.current.srcObject = current
          await video.current.play()
        }
        if (active) {
          setReady(true)
          const cameras = await navigator.mediaDevices.enumerateDevices()
          if (active) setDevices(cameras.filter(d => d.kind === 'videoinput'))
        }
      } catch {
        if (active) setError('Unable to access camera. Check browser permission and camera selection.')
      }
    }
    void start()
    return () => { active = false; stream.current?.getTracks().forEach(t => t.stop()); stream.current = null }
  }, [deviceId, facingMode])

  const guideType = guide?.type
  const guideStage = guide?.stage
  const guideTicket = guide?.ticket
  const guideChallenge = guide?.challenge
  const guideToken = guide?.token
  const oppositeYaw = guide?.oppositeYaw

  useEffect(() => { captureSent.current = false }, [guideType, guideStage, guideTicket, guideChallenge, deviceId])

  useEffect(() => {
    motion.current = { neutral: null, turned: null, count: 0, yaw: null, lastSignature: null, steady: 0 }
    setLiveReady(!guideType)
    setLiveMessage('Starting live image check…')
    if (!ready || !guideType || disabled) return

    let active = true
    let polling = false
    const endpoint = guideType === 'id'
      ? '/admin/identity/id-guidance'
      : guideChallenge ? '/auth/face-guidance' : '/admin/identity/face-guidance'

    const captureAutomatically = (evidence = null) => {
      if (!autoCaptureRef.current || captureSent.current || !active || disabled) return
      const image = photograph(video.current, 1280, .87)
      if (!image) return
      captureSent.current = true  // Prevent duplicate capture during async parent transitions.
      setLiveMessage('Captured automatically. Processing…')
      onCaptureRef.current(image, evidence)
    }

    const poll = async () => {
      if (!active || polling || captureSent.current || !video.current?.videoWidth) return
      polling = true
      const photo = photograph(video.current, 640, .72)
      if (!photo) { polling = false; return }
      try {
        const result = await apiRequest(endpoint, {
          ...(guideToken ? { token: guideToken } : {}),
          method: 'POST',
          body: JSON.stringify({ image: photo, ...(guideTicket ? { ticket: guideTicket } : {}), ...(guideChallenge ? { challenge: guideChallenge } : {}) })
        })
        if (!active) return
        const state = motion.current
        if (guideType === 'id') {
          const next = signature(video.current)
          const delta = changeFromPrevious(next, state.lastSignature)
          state.lastSignature = next
          state.steady = result.ready && delta < 7.5 ? state.steady + 1 : 0
          const stable = state.steady >= 2
          setLiveReady(stable)
          setLiveMessage(!result.ready ? result.message : stable ? 'All checks passed. Capturing automatically…' : 'Hold still… Checking focus and movement.')
          if (stable) captureAutomatically()
        } else if (!result.found || !Number.isFinite(result.yaw)) {
          state.count = 0
          setLiveReady(false)
          setLiveMessage(result.message || 'Move closer so your face is visible.')
        } else {
          const angle = result.yaw
          if (guideStage === 'front') {
            state.count = Math.abs(angle) < .15 ? state.count + 1 : 0
            setLiveReady(state.count >= 2)
            setLiveMessage(state.count >= 2 ? 'Face aligned. Capturing automatically…' : 'Look straight into the camera and hold still.')
            if (state.count >= 2) captureAutomatically()
          } else if (!state.neutral) {
            if (Math.abs(angle) < .13) {
              state.neutral = photo
              setLiveMessage(`Face centered. Now turn ${guideStage.toUpperCase()} slowly.`)
            } else setLiveMessage('Look straight at the camera first, then turn your head.')
          } else {
            const turned = Math.abs(angle) > .20
            const opposite = oppositeYaw == null || angle * oppositeYaw < 0
            if (turned && opposite) {
              state.count++
              state.turned = photo
              state.yaw = angle
              setLiveReady(state.count >= 2)
              setLiveMessage(state.count >= 2 ? 'Motion confirmed. Capturing automatically…' : 'Turn detected. Hold still…')
              if (state.count >= 2) captureAutomatically({ neutral: state.neutral, turned: state.turned, yaw: state.yaw })
            } else {
              state.count = 0
              state.turned = null
              setLiveReady(false)
              setLiveMessage(turned && !opposite ? 'Turn the opposite direction from your first scan.' : `Turn your head ${guideStage.toUpperCase()} and hold still.`)
            }
          }
        }
      } catch (cause) {
        if (active) {
          setLiveReady(false)
          setLiveMessage(cause?.message || 'Live check is unavailable. Please check the backend.')
        }
      } finally { polling = false }
    }
    void poll()
    const interval = setInterval(poll, 1150)
    return () => { active = false; clearInterval(interval) }
  }, [ready, disabled, guideType, guideStage, guideTicket, guideChallenge, guideToken, oppositeYaw])

  const capture = () => {
    if (!ready || disabled || captureSent.current || !video.current || (guideType && !liveReady)) return
    const photo = photograph(video.current, 1280, .87)
    if (!photo) return
    const evidence = guideType === 'face' && guideStage !== 'front'
      ? { neutral: motion.current.neutral, turned: motion.current.turned, yaw: motion.current.yaw }
      : null
    captureSent.current = true
    onCaptureRef.current(photo, evidence)
  }

  return (
    <div className={`fitpulse-identity-camera ${overlay ? `fp-camera-${overlay}` : ''}`}>
      {devices.length > 1 && (
        <label className="field">Camera
          <select className="clay-in" value={deviceId} onChange={event => setDeviceId(event.target.value)} disabled={disabled}>
            <option value="">Default camera</option>
            {devices.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>)}
          </select>
        </label>
      )}
      <div className="fp-camera-preview">
        <video ref={video} autoPlay muted playsInline style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : undefined }} aria-label="Live identity camera preview" />
        {overlay && (
          <div className="fp-camera-guides" aria-hidden="true">
            <div className="fp-camera-live"><span className="fp-live-dot" /> LIVE · {side ? `${side.toUpperCase()} of ID` : 'Face motion check'}</div>
            {overlay === 'id' ? <div className="fp-id-frame" /> : <div className="fp-face-oval" />}
            <p>{instruction}</p>
          </div>
        )}
      </div>
      {guideType && <div className={`fp-live-feedback ${liveReady ? 'is-ready' : ''}`} role="status" aria-live="polite"><span className="fp-live-pulse" />{liveMessage}</div>}
      {!overlay && <p className="form-help">{instruction}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {autoCapture ? (
        <p className="fp-auto-capture-status" role="status">
          {captureSent.current ? 'Photo captured automatically.' : 'Auto-capture is on. Follow the live instructions; no button press needed.'}
        </p>
      ) : (
        <button className="btn" type="button" disabled={!ready || disabled || captureSent.current || (Boolean(guideType) && !liveReady)} onClick={capture}>
          {!ready ? 'Starting camera…' : guideType && !liveReady ? 'Checking live view…' : captureLabel}
        </button>
      )}
    </div>
  )
}
