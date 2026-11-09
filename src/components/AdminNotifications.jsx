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
export default function AdminNotifications({
  state,
  canManage,
  busy,
  onDelete,
  onReview
}) {
  const membership = state.notifications.filter((item) => item.kind === 'membership')
  const equipment = state.notifications.filter((item) => item.kind === 'equipment')
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
