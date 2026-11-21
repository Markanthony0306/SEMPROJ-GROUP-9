import { Icon } from '../DashboardShell'
import { filterMemberRecords } from '../../utils/membership'
import StatCard from './StatCard'
import SectionHeader from './SectionHeader'
import MemberRow from './MemberRow'
import ActivityRow from './ActivityRow'

// Admin and member screens consume the same records and dashboard actions as desktop.
export function MobileOverview({
  stats,
  expiring,
  date,
  onMember,
  onExpiring,
  rows,
  onActivities,
  loading
}) {
  return (
    <>
      <section className="fitpulse-stat-grid" aria-label="Overview totals">
        {stats.map(([label, value, icon]) => (
          <StatCard
            key={label}
            label={label}
            value={loading ? '—' : value}
            icon={<Icon name={icon} size={20} />}
          />
        ))}
      </section>
      {expiring && (
        <section>
          <SectionHeader title="Expiring soon" onViewAll={onExpiring} />
          <ul className="fitpulse-rows">
            {expiring.length
              ? expiring
                  .slice(0, 3)
                  .map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      expiring
                      date={date}
                      onSelect={onMember}
                    />
                  ))
              : !loading && <li className="fitpulse-empty">No memberships expiring soon.</li>}
          </ul>
        </section>
      )}
      <section>
        <SectionHeader title="Recent activity" onViewAll={onActivities} />
        <ActivityList rows={rows.slice(0, 4)} loading={loading} />
      </section>
    </>
  )
}

export function MobileMembers({
  members,
  expiring,
  date,
  query,
  setQuery,
  onMember,
  filter,
  setFilter,
  loading
}) {
  const expiringIds = new Set(expiring.map((member) => member.id))
  const records = filterMemberRecords(filter ? expiring : members, query)
  return (
    <>
      <label className="fitpulse-search">
        <Icon name="search" />
        <input
          type="search"
          aria-label="Search members"
          placeholder="Search members"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="fitpulse-screen-actions">
        <button
          type="button"
          className="btn ghost fitpulse-secondary"
          aria-pressed={!filter}
          onClick={() => setFilter(false)}
        >
          All members
        </button>
        <button
          type="button"
          className="btn ghost fitpulse-secondary"
          aria-pressed={filter}
          onClick={() => setFilter(true)}
        >
          Expiring soon
        </button>
      </div>
      <ul className="fitpulse-rows">
        {records.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            date={date}
            expiring={expiringIds.has(member.id)}
            onSelect={onMember}
          />
        ))}
        {!loading && !records.length && <li className="fitpulse-empty">No matching members.</li>}
      </ul>
    </>
  )
}

function ActivityList({ rows, loading }) {
  return (
    <ul className="fitpulse-rows">
      {rows.map((row) => (
        <ActivityRow key={row.id} row={row} Icon={Icon} />
      ))}
      {!loading && !rows.length && <li className="fitpulse-empty">No activity recorded yet.</li>}
    </ul>
  )
}

export function MobileActivities({ rows, loading, reminderError, select }) {
  return (
    <>
      <div className="fitpulse-screen-actions">
        <button className="btn ghost fitpulse-secondary" type="button" onClick={() => select('Attendance')}>
          Attendance
        </button>
        <button className="btn ghost fitpulse-secondary" type="button" onClick={() => select('Payments')}>
          Payments
        </button>
      </div>
      {reminderError && (
        <p className="fitpulse-empty" role="status">
          {reminderError}
        </p>
      )}
      <ActivityList rows={rows} loading={loading} />
    </>
  )
}
