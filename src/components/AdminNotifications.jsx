import { Icon } from './DashboardShell'
import { RecordDeleteButton } from './RecordDeleteControls'

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : 'Not recorded'
const DELIVERY_LABELS = {
  sent: 'Email sent to mail server',
  failed: 'Email failed — retry needed',
  processing: 'Sending / waiting for confirmation',
  unconfirmed: 'Delivery confirmation missing — check mail provider',
  not_sent: 'Email not sent yet',
  disabled: 'Automatic emails disabled',
  unconfigured: 'SMTP not configured',
  unavailable: 'Delivery status unavailable'
}

export default function AdminNotifications({
  state,
  canManage,
  busy,
  onDelete,
  onCheck,
  onVerify,
  onReview
}) {
  const membership = state.notifications.filter((item) => item.kind === 'membership')
  const equipment = state.notifications.filter((item) => item.kind === 'equipment')
  const email = state.email || {}
  const clearButton = (group, items, scopeLabel) =>
    canManage && (
      <RecordDeleteButton
        all
        label={`Clear all ${scopeLabel}`}
        disabled={busy || !state.canDismiss || !items.length}
        onClick={() =>
          onDelete({ category: 'notifications', all: true, group, count: items.length, scopeLabel })
        }
      />
    )
  const deleteButton = (item) =>
    canManage && (
      <RecordDeleteButton
        label={`Delete notification for ${item.name}`}
        disabled={busy || !state.canDismiss}
        onClick={() => onDelete({ category: 'notifications', id: item.id, label: item.name })}
      />
    )
  return (
    <>
      <article className="card clay notification-email-summary">
        <div className="record-section-heading">
          <div>
            <h2>
              <Icon name="mail" /> Email delivery
            </h2>
            <p>Track expiry reminders and check the connection used by FitPulse.</p>
          </div>
          {canManage && (
            <div className="record-section-actions">
              <button
                className="btn ghost"
                type="button"
                disabled={busy || !email.configured}
                onClick={onVerify}
              >
                Check SMTP
              </button>
              <button
                className="btn"
                type="button"
                disabled={
                  busy ||
                  email.running ||
                  !email.configured ||
                  !email.enabled ||
                  !email.trackingReady
                }
                onClick={onCheck}
              >
                {busy || email.running ? 'Checking…' : 'Run reminders now'}
              </button>
            </div>
          )}
        </div>
        <div className="notification-system-status" role="status">
          <p>
            {typeof email.configured !== 'boolean'
              ? 'Email status is unavailable. Check that the updated API is running.'
              : !email.configured
                ? 'SMTP is not configured on the server.'
                : !email.enabled
                  ? 'Enable automatic email reminders in Settings → Gym Preferences.'
                  : 'Automatic expiry emails are enabled.'}
          </p>
          {email.lastCheckedAt && (
            <p>
              Last check: {formatDate(email.lastCheckedAt)}
              {email.lastCounts &&
                ` · ${email.lastCounts.sent} sent · ${email.lastCounts.failed} failed`}
            </p>
          )}
          {(email.issue || email.lastError) && (
            <p className="form-error">{email.issue || email.lastError}</p>
          )}
          {state.issue && <p className="form-error">{state.issue}</p>}
          <p className="form-help">
            “Sent” means the mail server accepted the email. Inbox delivery and spam filtering are
            handled by the mail provider. Automatic checks also run hourly while the API is running.
          </p>
        </div>
      </article>
      <section className="grid g2 notification-columns">
        <article className="card clay">
          <div className="record-section-heading">
            <h2>Membership reminders</h2>
            {clearButton('membership', membership, 'membership reminders')}
          </div>
          {membership.length ? (
            <ul className="admin-list notification-list">
              {membership.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.email}</small>
                    <small>
                      {item.type === 'expired' ? 'Expired' : 'Expiring soon'} ·{' '}
                      {formatDate(item.membershipEnd)}
                    </small>
                    <span className="notification-delivery" data-state={item.delivery.state}>
                      {DELIVERY_LABELS[item.delivery.state]}
                    </span>
                    {item.delivery.sentAt && (
                      <small>Sent: {formatDate(item.delivery.sentAt)}</small>
                    )}
                    {item.delivery.attemptedAt && (
                      <small>Last attempt: {formatDate(item.delivery.attemptedAt)}</small>
                    )}
                    {item.delivery.errorCode && (
                      <small>Mail error: {item.delivery.errorCode}</small>
                    )}
                  </div>
                  {deleteButton(item)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-empty">No membership reminders in your notification list.</p>
          )}
        </article>
        <article className="card clay">
          <div className="record-section-heading">
            <h2>Equipment inspection reminders</h2>
            {clearButton('equipment', equipment, 'equipment reminders')}
          </div>
          {equipment.length ? (
            <ul className="admin-list notification-list">
              {equipment.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>Last inspected: {formatDate(item.lastInspected)}</small>
                    <small>{item.condition}</small>
                  </div>
                  <div className="notification-row-actions">
                    <button className="btn ghost" type="button" onClick={onReview}>
                      Review
                    </button>
                    {deleteButton(item)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-empty">No equipment reminders in your notification list.</p>
          )}
        </article>
      </section>
    </>
  )
}
