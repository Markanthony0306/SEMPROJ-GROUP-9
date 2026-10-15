import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getMemberQr, readCachedMemberQr } from '../utils/memberQr'

export default function MemberQr({ member }) {
  const { token } = useAuth()
  const [qr, setQr] = useState(() => readCachedMemberQr(member))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const qrImageRef = useRef(null)
  useEffect(() => {
    let active = true
    const cached = readCachedMemberQr(member)
    setQr(cached)
    setError('')
    if (cached) {
      setPending(false)
      return () => { active = false }
    }
    setPending(true)
    getMemberQr(member, token)
      .then((result) => { if (active) setQr(result) })
      .catch((cause) => { if (active) setError(cause.message) })
      .finally(() => { if (active) setPending(false) })
    return () => { active = false }
  }, [token, member?.id, member?.membershipStart, member?.membershipEnd, member?.joined, member?.status])
  const daysLeft = qr ? Math.max(0, Math.ceil((qr.expiresAt - Date.now()) / 86400000)) : 0
  const expiryDate = qr ? new Date(qr.expiresAt).toLocaleDateString() : ''

  const downloadQrCard = () => {
    if (!qr) return

    const canvas = document.createElement('canvas')
    canvas.width = 720
    canvas.height = 1126
    const context = canvas.getContext('2d')
    if (!context) return

    const roundedRect = (x, y, width, height, radius, color) => {
      context.beginPath()
      context.roundRect(x, y, width, height, radius)
      context.fillStyle = color
      context.fill()
    }

    const gradient = context.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#003049')
    gradient.addColorStop(0.67, '#0d2b3e')
    gradient.addColorStop(1, '#f77f00')
    roundedRect(0, 0, canvas.width, canvas.height, 28, gradient)

    context.textAlign = 'center'
    context.fillStyle = '#fcbf49'
    context.font = '850 76px "Fredoka", "Baloo 2", Arial, sans-serif'
    context.fillText('FITPULSE', canvas.width / 2, 120)
    context.fillStyle = 'rgba(255,255,255,0.9)'
    context.font = '800 20px Arial, sans-serif'
    context.letterSpacing = '4px'
    context.fillText('MEMBER CHECK-IN', canvas.width / 2, 157)
    context.letterSpacing = '0px'

    roundedRect(80, 248, 560, 794, 36, '#ffffff')
    roundedRect(226, 274, 268, 42, 21, '#e7edf7')
    context.fillStyle = '#003049'
    context.font = '800 18px Arial, sans-serif'
    context.fillText('MEMBER CHECK-IN PASS', canvas.width / 2, 301)
    context.fillStyle = '#0d2b3e'
    context.font = '600 26px Arial, sans-serif'
    context.fillText(member?.name || 'FitPulse member', canvas.width / 2, 370, 510)

    const qrImage = qrImageRef.current
    if (!qrImage?.complete || !qrImage.naturalWidth) {
      setError('Please wait for the QR code to finish loading, then download it.')
      return
    }
    context.drawImage(qrImage, 160, 436, 400, 400)
    context.fillStyle = '#003049'
    context.font = '500 18px Arial, sans-serif'
    context.fillText(`Expires ${expiryDate} - ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`, canvas.width / 2, 907)

    context.shadowColor = 'rgba(35, 28, 70, 0.24)'
    context.shadowBlur = 12
    context.shadowOffsetY = 5
    const buttonGradient = context.createLinearGradient(218, 934, 502, 1010)
    buttonGradient.addColorStop(0, '#f77f00')
    buttonGradient.addColorStop(1, '#d62828')
    roundedRect(218, 934, 284, 76, 38, buttonGradient)
    context.shadowColor = 'transparent'
    context.shadowBlur = 0
    context.shadowOffsetY = 0
    context.fillStyle = '#ffffff'
    context.font = '700 20px Arial, sans-serif'
    context.fillText('Download QR code', canvas.width / 2, 982)

    context.fillStyle = 'rgba(255,255,255,0.9)'
    context.font = '800 16px Arial, sans-serif'
    context.letterSpacing = '2px'
    context.fillText('SHOW AT THE GYM ENTRANCE', canvas.width / 2, 1081)
    context.letterSpacing = '0px'

    const link = document.createElement('a')
    link.download = 'fitpulse-membership-qr.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="member-qr-content">
      {qr && daysLeft > 0 ? (
        <section className="member-qr-card" aria-label="FitPulse member pass">
          <header className="member-qr-card-header">
            <strong>FITPULSE</strong>
            <span>MEMBER CHECK-IN</span>
          </header>
          <div className="member-qr-card-panel">
            <span className="member-qr-card-tag">MEMBER CHECK-IN PASS</span>
            <strong className="member-qr-card-name">{member?.name || 'FitPulse member'}</strong>
            <img
              ref={qrImageRef}
              className="member-qr-image"
              src={qr.image}
              alt="Your FitPulse membership QR code"
            />
            <p className="member-qr-card-expiry">
              Expires {expiryDate} - {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
            </p>
            <button className="btn" type="button" onClick={downloadQrCard}>
              Download QR code
            </button>
          </div>
          <footer className="member-qr-card-footer">SHOW AT THE GYM ENTRANCE</footer>
        </section>
      ) : (
        <p>
          {qr
            ? 'This code expired. Renew your membership to get a new code.'
            : pending ? 'Generating your member QR code...' : 'Your QR code is unavailable.'}
        </p>
      )}
      {error && (
        <p className="photo-error" role="alert">
          {error}
        </p>
      )}
      <p className="member-caption">
        Hold the code in front of the ESP32-CAM entrance scanner. This code can be used for check-in during your membership.
      </p>
    </div>
  )
}
