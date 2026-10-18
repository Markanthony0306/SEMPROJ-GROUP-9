import { useEffect, useRef, useState } from 'react'
import './FaceCapture.css'

let faceApiPromise
let modelPromise

async function loadFaceApi() {
  faceApiPromise ||= import('face-api.js')
  const faceapi = await faceApiPromise
  modelPromise ||= Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(`${import.meta.env.BASE_URL}models/face-api`),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(`${import.meta.env.BASE_URL}models/face-api`),
    faceapi.nets.faceRecognitionNet.loadFromUri(`${import.meta.env.BASE_URL}models/face-api`)
  ])
  await modelPromise
  return faceapi
}

export default function FaceCapture({ onCaptured, disabled = false, actionLabel = 'Capture face' }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Start the camera, then center one face in the frame.')
  const [error, setError] = useState('')

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  const startCamera = async () => {
    setBusy(true)
    setError('')
    setMessage('Loading face models and requesting camera access…')
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error('Camera access requires HTTPS or localhost in a supported browser.')
      const faceapi = await loadFaceApi()
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraReady(true)
      setMessage('Camera ready. Face forward with good lighting.')
      return faceapi
    } catch (cause) {
      setError(cause.message || 'Could not start the face camera.')
      setMessage('')
      return null
    } finally {
      setBusy(false)
    }
  }

  const capture = async () => {
    if (busy || disabled) return
    setBusy(true)
    setError('')
    try {
      const faceapi = await loadFaceApi()
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
        throw new Error(detections.length ? 'Only one face should be visible.' : 'No face found. Adjust the lighting and try again.')
      setMessage('Face captured; preparing the face descriptor…')
      await onCaptured(Array.from(detections[0].descriptor))
      setMessage('Face descriptor captured.')
    } catch (cause) {
      setError(cause.message || 'Could not capture or verify the face. Please try again.')
      setMessage('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="face-capture">
      <video ref={videoRef} autoPlay muted playsInline aria-label="Face camera preview" />
      <p className="form-help" role="status">{message}</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="face-capture-actions">
        {!cameraReady ? (
          <button className="btn ghost" type="button" disabled={busy || disabled} onClick={startCamera}>
            {busy ? 'Starting camera…' : 'Start camera'}
          </button>
        ) : (
          <button className="btn" type="button" disabled={busy || disabled} onClick={capture}>
            {busy ? 'Please wait…' : actionLabel}
          </button>
        )}
      </div>
      <small>
        The camera image stays in this browser. A numeric face descriptor is sent to the API and encrypted before storage. Use HTTPS outside localhost.
      </small>
    </div>
  )
}
