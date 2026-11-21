import { useEffect, useRef, useState } from 'react'

export default function WebcamQrScanner({ onScan }) {
  const videoRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!scanning) return undefined
    let stopped = false
    let stream
    let timer
    const stop = () => {
      stopped = true
      clearTimeout(timer)
      stream?.getTracks().forEach((track) => track.stop())
    }
    const fail = (cause) => {
      if (stopped) return
      stop()
      setError(cause.name === 'NotAllowedError' ? 'Allow camera access, then try again.' : cause.message)
      setScanning(false)
    }
    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error('Camera access requires HTTPS or localhost.')
      const Detector = globalThis.BarcodeDetector
      if (!Detector || !(await Detector.getSupportedFormats()).includes('qr_code'))
        throw new Error('This browser cannot decode QR codes with a webcam. Use the entrance scanner or a browser with QR camera support.')
      if (stopped) return
      const detector = new Detector({ formats: ['qr_code'] })
      const camera = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } }
      })
      if (stopped) {
        camera.getTracks().forEach((track) => track.stop())
        return
      }
      stream = camera
      const video = videoRef.current
      video.srcObject = stream
      await video.play()
      const scan = async () => {
        if (stopped) return
        const codes = video.readyState >= 2 ? await detector.detect(video) : []
        if (stopped) return
        if (codes.length === 1 && codes[0].rawValue) {
          stop()
          setScanning(false)
          onScan(codes[0].rawValue)
          return
        }
        timer = setTimeout(() => void scan().catch(fail), 180)
      }
      await scan()
    }
    void start().catch(fail)
    return stop
  }, [scanning, onScan])

  return (
    <section className="webcam-qr" aria-label="Webcam QR scanner">
      <button
        className="btn ghost"
        type="button"
        onClick={() => {
          setError('')
          setScanning(!scanning)
        }}
      >
        {scanning ? 'Stop camera' : 'Scan QR with webcam'}
      </button>
      {scanning && (
        <>
          <video ref={videoRef} muted playsInline aria-label="QR camera preview" />
          <p role="status">Show one member QR code to the camera.</p>
        </>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  )
}
