import { Icon } from '../DashboardShell'
import ActivityChart from '../ActivityChart'
import { membershipState } from '../../utils/membership'

export default function AdminDashboardSection({ currentUser, setModal, setSection, members, active, data, today, money, revenue, loading, expiredMembers, renewals, reminderList, date }) {
  return (
      <>
        <section className="card clay illustrated-heading dashboard-overview">
          <div>
            <span className="dashboard-eyebrow">YOUR GYM, AT A GLANCE</span>
            <h2>Let’s keep the momentum going.</h2>
            <p>
              Welcome back, {currentUser?.name?.split(' ')[0] || 'coach'}. Here’s how your community
              is moving.
            </p>
            <div className="dashboard-quick-actions">
              {currentUser?.role === 'admin' && (
                <button className="btn" type="button" onClick={() => setModal({ kind: 'create' })}>
                  <Icon name="users" size={16} />
                  Add a member
                </button>
              )}
              <button className="btn ghost" type="button" onClick={() => setSection('Reports')}>
                <Icon name="chart" size={16} />
                Explore reports
              </button>
            </div>
          </div>
        </section>
        <section className="grid admin-stats">
          {[
            ['Total Members', members.length, 'users', 'b1'],
            ['Active Memberships', active, 'card', 'b2'],
            [
              "Today's Check-ins",
              data.attendance.filter(
                (item) =>
                  new Date(item.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }) ===
                  today
              ).length,
              'qr',
              'b3'
            ],
            ['Payments recorded', money(revenue), 'wallet', 'b4']
          ].map(([label, value, icon, color]) => (
            <article className="stat clay" key={label}>
              <span className={`bub ${color}`}>
                <Icon name={icon} />
              </span>
              <div>
                <small>{label}</small>
                <b>{value}</b>
              </div>
            </article>
          ))}
        </section>
        <ActivityChart
          attendance={data.attendance}
          payments={data.payments}
          admin
          loading={loading}
        />
        <section className="grid g2">
          <article className="card clay">
            <div className="admin-card-heading">
              <h2>Membership overview</h2>
              <Icon name="card" />
            </div>
            <div className="admin-summary">
              <div>
                <span>Active memberships</span>
                <strong>{active}</strong>
              </div>
              <div>
                <span>Expired memberships</span>
                <strong>{expiredMembers.length}</strong>
              </div>
              <div>
                <span>Records needing review</span>
                <strong>{members.length - active - expiredMembers.length}</strong>
              </div>
              <div>
                <span>Renewals recorded</span>
                <strong>{renewals.length}</strong>
              </div>
            </div>
          </article>
          <article className="card clay">
            <div className="admin-card-heading">
              <h2>Membership reminders</h2>
              <span className="pill p-warn">{reminderList.length}</span>
            </div>
            {reminderList.length ? (
              <ul className="admin-list">
                {reminderList.slice(0, 4).map((member) => (
                  <li key={member.id}>
                    <div>
                      <strong>{member.name}</strong>
                      <small>
                        {membershipState(member).status === 'expired' ? 'Expired' : 'Expiring soon'}{' '}
                        &middot; {date(member.membershipEnd)}
                      </small>
                    </div>
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() => setModal({ kind: 'renew', member })}
                    >
                      Renew
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-empty">No memberships are due for a reminder.</p>
            )}
            <button
              className="admin-text-button"
              type="button"
              onClick={() => setSection('Notifications')}
            >
              View all reminders &rarr;
            </button>
          </article>
        </section>
      </>
  )
}
