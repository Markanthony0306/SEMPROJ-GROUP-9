import { useState } from 'react'
import Dialog from './Dialog'

export default function PrivacyPolicy() {
  const [open, setOpen] = useState(false)

  return (
    <article className="card clay">
      <h2>Privacy Policy</h2>
      <button className="btn ghost" type="button" onClick={() => setOpen(true)}>
        Read privacy policy
      </button>
      {open && (
        <Dialog
          title="Privacy Policy"
          className="privacy-policy-dialog"
          onClose={() => setOpen(false)}
          focusClose
        >
          <div className="privacy-policy-copy" role="region" aria-label="Privacy policy text" tabIndex={0}>
            <h3>Data we collect</h3>
            <p>
              FitPulse records your name, email address, contact number, and profile photo if you
              provide one. For members, it also records membership details, gym visits and QR
              check-ins, and payment amounts, dates, and methods.
            </p>
            <h3>How we use it</h3>
            <p>
              We use this information to manage accounts and memberships, verify gym access,
              record payments, and send account and membership notices.
            </p>
            <h3>Member identity and face checks</h3>
            <p>
              FitPulse processes ID and camera images to verify a member’s identity. The verification
              service does not keep those images. FitPulse stores a facial template, a set of numbers
              derived from the member’s face, to verify future sign-ins.
            </p>
            <h3>Storage and access</h3>
            <p>
              Account and gym records are stored in Supabase. Supabase Auth hashes passwords.
              FitPulse limits access based on account permissions. Members can access their own
              records, and authorized gym administrators can access records they need to manage the gym.
            </p>
            <h3>Questions and requests</h3>
            <p>
              Contact the gym front desk or your FitPulse administrator for privacy questions or to
              request access to, correction of, or deletion of your personal information.
            </p>
          </div>
        </Dialog>
      )}
    </article>
  )
}
