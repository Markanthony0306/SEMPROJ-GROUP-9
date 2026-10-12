import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'

export default function MemberQr({ onRefresh }) {
  const { token } = useAuth()
  const [qr, setQr] = useState(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const refresh = async () => {
    if (pending) return
    setPending(true)
    setError('')
    setQr(null)
    try {
      setQr(await apiRequest('/me/qr', { token }))
      setNow(Date.now())
      onRefresh?.()
    } catch (cause) {
      setError(cause.message)
    } finally {
      setPending(false)
    }
  }
  const seconds = qr ? Math.max(0, Math.ceil((qr.expiresAt - now) / 1000)) : 0
  return (
    <div className="member-qr-content">
      {qr && seconds > 0 ? (
        <>
          <img
            className="member-qr-image"
            src={qr.image}
            alt="Your temporary FitPulse entrance QR code"
          />
          <p>Expires in {seconds} seconds</p>
        </>
      ) : (
        <p>
          {qr
            ? 'This code expired. Generate a fresh code before scanning.'
            : 'Generate a code when you arrive at the gym.'}
        </p>
      )}
      <button className="btn" type="button" disabled={pending} onClick={refresh}>
        {pending ? 'Generating...' : qr ? 'Refresh QR code' : 'Generate QR code'}
      </button>
      {error && (
        <p className="photo-error" role="alert">
          {error}
        </p>
      )}
      <p className="member-caption">
        Hold the code in front of the ESP32-CAM entrance scanner. Each code can record one check-in.
      </p>
    </div>
  )
}
