import { useState } from 'react'
import Dialog from './Dialog'
import IdentityCamera from './IdentityCamera'
import { apiRequest } from '../utils/api'
import './VerificationFlow.css'

const STAGES = [
  { id: 'right', title: 'Turn right' },
  { id: 'left', title: 'Turn left' },
  { id: 'front', title: 'Look forward' }
]

// Password is already checked by the backend; no login session exists before face validation.
export default function FacialLoginChallenge({ challenge, onVerified, onCancel }) {
  const [stage, setStage] = useState('right')
  const [frames, setFrames] = useState({})
  const [motion, setMotion] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const capture = async (image, evidence) => {
    setError('')
    if (stage === 'right' || stage === 'left') {
      if (!evidence?.neutral || !evidence?.turned) { setError('Complete the live movement before capturing.'); return }
      setMotion(old => ({ ...old, [stage]: evidence }))
      setFrames(old => ({ ...old, [stage]: image }))
      setStage(stage === 'right' ? 'left' : 'front')
      return
    }
    setBusy(true)
    try {
      const session = await apiRequest('/auth/face-login', {
        method: 'POST',
        body: JSON.stringify({ challenge, frames: { ...frames, front: image }, motion })
      })
      if (!session?.token || !session?.user) throw new Error('Facial login did not return a session.')
      onVerified(session)
    } catch (cause) {
      setError(cause.message || 'Facial verification failed.')
      setFrames({})
      setMotion({})
      setStage('right')
    } finally { setBusy(false) }
  }

  const activeIndex = STAGES.findIndex(item => item.id === stage)
  const instruction = stage === 'right'
    ? 'Fit your face inside the oval, turn RIGHT, and hold still for automatic capture.'
    : stage === 'left'
      ? 'Keep your face inside the oval, turn LEFT, and hold still for automatic capture.'
      : 'Look STRAIGHT at the camera for automatic final face matching.'
  return (
    <Dialog title="Facial Recognition Login Security" busy={busy} onClose={onCancel} className="fitpulse-face-login-dialog fp-verification-dialog">
      <p className="fp-verification-subtitle">Face check · Step {activeIndex + 1} of 3</p>
      <div className="fp-verification-progress" aria-label="Facial login steps">
        {STAGES.map(({ id, title }, i) => (
          <div key={id} className={`fp-verification-progress-item ${i === activeIndex ? 'is-current' : ''} ${i < activeIndex ? 'is-complete' : ''}`} aria-current={i === activeIndex ? 'step' : undefined}>
            <div className="fp-verification-track" /><span>{title}</span>
          </div>
        ))}
      </div>
      <div className="fp-verification-content">
        <h3>{STAGES[activeIndex].title}</h3>
        <p className="fp-verification-hint">Your face must match the registered member's facial template. Complete both head turns and a frontal capture.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <IdentityCamera key={stage} autoCapture disabled={busy} overlay="face" guide={{ type: 'face', stage, challenge, oppositeYaw: stage === 'left' ? motion.right?.yaw : undefined }} instruction={instruction} captureLabel={stage === 'front' ? 'Verify face and log in' : `Capture ${stage} turn`} onCapture={capture} />
        <div className="fp-verification-checks">
          <div className={frames.right ? 'done' : stage === 'right' ? 'current' : ''}>{frames.right ? '✓' : '○'} Right turn</div>
          <div className={frames.left ? 'done' : stage === 'left' ? 'current' : ''}>{frames.left ? '✓' : '○'} Left turn</div>
          <div className={stage === 'front' ? 'current' : ''}>○ Normal view</div>
        </div>
        <div className="fp-verification-footer">
          <p>All captures are checked by the server before sign-in.</p>
          <button className="btn ghost" type="button" disabled={busy} onClick={onCancel}>Cancel login</button>
          <button className="btn ghost" type="button" disabled={busy} onClick={() => { setStage('right'); setFrames({}); setMotion({}); setError('') }}>Restart scan</button>
        </div>
      </div>
    </Dialog>
  )
}
