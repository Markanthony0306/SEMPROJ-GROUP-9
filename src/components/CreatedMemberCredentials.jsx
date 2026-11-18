import { useState } from 'react'

export default function CreatedMemberCredentials({
  member,
  temporaryPassword,
  onDismiss,
  onFaceSetup,
  date
}) {
  const [copyStatus, setCopyStatus] = useState('')
  // The password stays only in this screen's state and the clipboard on request.
  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(temporaryPassword)
      setCopyStatus('Copied.')
    } catch {
      setCopyStatus('Could not copy. Select the password to copy it manually.')
    }
  }
  return (
    <section className="created-credentials" aria-label="New member sign-in details">
      <p>
        Give these details to {member.name}. The temporary password is shown only now and cannot be
        retrieved after you close this screen.
      </p>
      <dl>
        {member.memberCode && (
          <div>
            <dt>Member code</dt>
            <dd>{member.memberCode}</dd>
          </div>
        )}
        <div>
          <dt>Email</dt>
          <dd>{member.email}</dd>
        </div>
        {date && (
          <>
            <div><dt>Plan</dt><dd>{member.plan}</dd></div>
            <div><dt>Valid until (Manila)</dt><dd>{date(member.membershipEnd)}</dd></div>
          </>
        )}
        <div>
          <dt>Temporary password</dt>
          <dd>
            <code>{temporaryPassword}</code>
          </dd>
        </div>
      </dl>
      {date && (
        <>
          <button type="button" className="btn ghost" onClick={copyPassword}>Copy</button>
          {copyStatus && <p role="status">{copyStatus}</p>}
        </>
      )}
      <p>The member must choose a new password before accessing their dashboard.</p>
      <div className="ma">
        {onFaceSetup && (
          <button type="button" className="btn" onClick={onFaceSetup}>
            Face setup
          </button>
        )}
        <button type="button" className={onFaceSetup ? 'btn ghost' : 'btn'} onClick={onDismiss}>
          Done
        </button>
      </div>
    </section>
  )
}
