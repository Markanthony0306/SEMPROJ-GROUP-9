import { useEffect, useRef, useState } from 'react'
import {
  createMemberIdFrameReader,
  loadMemberIdCamera,
  matchesOtherIdSide
} from '../../utils/memberIdCamera'
import './MemberIdCamera.css'

const FRAME_INTERVAL = 130
const STEADY_DURATION = 650
const STEADY_FRAMES = 4
const FRAME_TIMEOUT = 8000
const MOVEMENT_TOLERANCE = 0.018
const sideLabel = { front: 'Show the front of the ID.', back: 'Flip the ID and show the back.' }

function cameraError(cause) {
  if (cause.name === 'NotAllowedError' || cause.name === 'SecurityError')
    return 'Camera permission is blocked. Allow camera access in your browser settings, then retry.'
  if (cause.name === 'NotFoundError' || cause.name === 'NotReadableError')
    return 'Could not access a camera. Connect it or close any other app using it, then retry.'
  return cause.message || 'Could not start the ID camera. Try again.'
}

export default function MemberIdCamera({ side, onCapture, previousFingerprint, disabled = false }) {
  const video = useRef(null)
  const scan = useRef(null)
  const captureHandler = useRef(onCapture)
  const [retry, setRetry] = useState(0)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Opening camera…')
  const [outline, setOutline] = useState(null)

  useEffect(() => {
    captureHandler.current = onCapture
  }, [onCapture])

  useEffect(() => {
    scan.current = { side, previousFingerprint, captured: false, stable: null }
    setOutline(null)
    setStatus(sideLabel[side])
  }, [side, previousFingerprint, retry])

  useEffect(() => {
    if (disabled) return undefined

    const preview = video.current
    let active = true
    let stream
    let timer
    let removeEndedListeners
    let frameReader
    let lastFrame = -1
    let lastFrameAt = 0

    function stop() {
      active = false
      window.clearTimeout(timer)
      removeEndedListeners?.()
      stream?.getTracks().forEach((track) => track.stop())
      if (preview.srcObject === stream) preview.srcObject = null
    }

    function fail(message) {
      if (!active) return
      stop()
      setError(message)
      setOutline(null)
      setReady(false)
    }

    async function accept(current, next) {
      current.captured = true
      setStatus(`Capturing the ${current.side} of the ID…`)
      const blob = await frameReader.save(next.outline)
      if (!active || scan.current !== current) return
      if (!blob) throw new Error('Could not save the ID image. Retry the camera.')
      captureHandler.current(
        new File([blob], `${current.side}.jpg`, { type: 'image/jpeg' }),
        next.fingerprint
      )
    }

    async function inspect() {
      if (!active) return
      const now = performance.now()
      const current = scan.current
      try {
        if (preview.videoWidth && preview.readyState >= 2 && preview.currentTime !== lastFrame) {
          lastFrame = preview.currentTime
          lastFrameAt = now
          if (!current.captured) {
            const next = frameReader.read(preview)
            setOutline(
              next.outline
                ? { points: next.outline, ratio: preview.videoWidth / preview.videoHeight }
                : null
            )
            if (next.hint) {
              current.stable = null
              setStatus(next.hint)
            } else if (matchesOtherIdSide(next.fingerprint, current.previousFingerprint)) {
              current.stable = null
              setStatus(`Turn the ID over to show the ${current.side}.`)
            } else {
              const moved =
                !current.stable ||
                next.outline.some((point, index) => {
                  const previous = current.stable.points[index]
                  return Math.hypot(point.x - previous.x, point.y - previous.y) > MOVEMENT_TOLERANCE
                })
              if (moved) current.stable = { points: next.outline, since: now, frames: 0 }
              current.stable.frames += 1
              setStatus('Hold steady…')
              if (
                current.stable.frames >= STEADY_FRAMES &&
                now - current.stable.since >= STEADY_DURATION
              )
                await accept(current, next)
            }
          }
        } else if (now - lastFrameAt > FRAME_TIMEOUT) {
          fail('The camera stopped sending video. Reconnect it, then retry.')
          return
        }
      } catch {
        fail('Could not read the ID camera. Retry and hold the ID inside the guide.')
        return
      }
      if (active) timer = window.setTimeout(inspect, FRAME_INTERVAL)
    }

    async function start() {
      if (!active) return
      setError('')
      setReady(false)
      setStatus('Opening camera…')
      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error('Camera access requires HTTPS or localhost in a supported browser.')
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }
        })
        if (!active) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        const tracks = stream.getVideoTracks()
        const onEnded = () => fail('The camera disconnected. Reconnect it, then retry.')
        tracks.forEach((track) => track.addEventListener('ended', onEnded))
        removeEndedListeners = () =>
          tracks.forEach((track) => track.removeEventListener('ended', onEnded))
        preview.srcObject = stream
        await preview.play()
        if (!active) return
        setReady(true)
        setStatus('Preparing automatic ID capture…')
        const tools = await loadMemberIdCamera()
        if (!active) return
        frameReader = createMemberIdFrameReader(tools)
        lastFrameAt = performance.now()
        setStatus(sideLabel[scan.current.side])
        void inspect()
      } catch (cause) {
        fail(cameraError(cause))
      }
    }

    // The deferred start avoids duplicate permission requests during Strict Mode setup.
    void Promise.resolve().then(start)
    return stop
  }, [disabled, retry])

  return (
    <div className="id-check-camera-capture">
      <div className="id-check-camera">
        {ready && !disabled && (
          <span className="id-check-live">Live · {side === 'front' ? 'Front' : 'Back'} of ID</span>
        )}
        <video
          ref={video}
          muted
          playsInline
          hidden={!ready || disabled}
          aria-label="Live ID camera"
        />
        {outline && !disabled ? (
          <svg
            className="id-check-camera-outline"
            viewBox={`0 0 ${outline.ratio} 1`}
            aria-hidden="true"
          >
            <polygon
              points={outline.points.map(({ x, y }) => `${x * outline.ratio},${y}`).join(' ')}
            />
          </svg>
        ) : (
          <div className="id-check-camera-guide" aria-hidden="true" />
        )}
        <p role="status">{error ? 'Camera unavailable' : disabled ? 'Reading the ID…' : status}</p>
      </div>
      {error && (
        <div className="id-check-camera-error">
          <p className="form-error" role="alert">
            {error}
          </p>
          <button
            type="button"
            className="btn ghost"
            disabled={disabled}
            onClick={() => setRetry((value) => value + 1)}
          >
            Retry camera
          </button>
        </div>
      )}
    </div>
  )
}
