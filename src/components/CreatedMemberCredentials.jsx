export default function CreatedMemberCredentials({
  member,
  temporaryPassword,
  emailSent,
  onDismiss
}) {
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
        <div>
          <dt>Temporary password</dt>
          <dd>
            <code>{temporaryPassword}</code>
          </dd>
        </div>
      </dl>
      {emailSent && <p role="status">A welcome email with these sign-in details was sent.</p>}
      <p>The member must choose a new password before accessing their dashboard.</p>
      <button type="button" className="btn" onClick={onDismiss}>
        Done
      </button>
    </section>
  )
}
