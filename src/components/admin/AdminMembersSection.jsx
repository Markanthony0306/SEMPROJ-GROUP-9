import DataTable from '../DataTable'
import ProfileAvatar from '../ProfileAvatar'
import { RecordDeleteButton } from '../RecordDeleteControls'
import { Icon } from '../DashboardShell'
import { Pill, memberBadge } from './AdminStaffDialogs'

export default function AdminMembersSection({ query, setQuery, currentUser, setModal, members, pending, date }) {
  return (
      <article className="card clay">
        <h2>Member Records</h2>
        <div className="bar">
          <label className="sbox clay-in">
            Search{' '}
            <input
              value={query}
              placeholder="Name, member ID, email, or phone"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          {currentUser?.role === 'admin' && (
            <button className="btn" onClick={() => setModal({ kind: 'create' })}>
              Create Account
            </button>
          )}
        </div>

        <DataTable
          searchable={false}
          headings={['ID', 'Name', 'Contact', 'Plan', 'Expires', 'Status', 'Actions']}
        >
          {members
            .filter((member) =>
              `${member.name} ${member.memberCode || ''} ${member.id} ${member.email} ${member.phone || ''}`
                .toLowerCase()
                .includes(query.trim().toLowerCase())
            )
            .map((member) => (
              <tr key={member.id}>
                <td className="record-id">{member.memberCode || member.id}</td>
                <td>
                  <div className="member-table-person">
                    <ProfileAvatar user={member} memberId={member.id} />
                    <span>{member.name}</span>
                  </div>
                </td>
                <td>
                  <span>{member.email}</span>
                  <small className="table-secondary">{member.phone || 'No phone added'}</small>
                </td>
                <td>{member.plan}</td>
                <td>{date(member.membershipEnd)}</td>
                <td>
                  <Pill status={memberBadge(member)} />
                </td>
                <td className="acts member-record-actions">
                  <button
                    className="report-icon-button"
                    type="button"
                    aria-label={`View ${member.name}`}
                    onClick={() => setModal({ kind: 'view', member })}
                  >
                    <Icon name="eye" size={18} />
                  </button>
                  <button
                    className="report-icon-button"
                    type="button"
                    aria-label={`Edit ${member.name}`}
                    onClick={() => setModal({ kind: 'edit', member })}
                  >
                    <Icon name="edit" size={18} />
                  </button>


                  {currentUser?.role === 'admin' && (
                    member.status === 'active' ? (

                      <RecordDeleteButton
                        label={`Deactivate account for ${member.name}`}
                        disabled={pending}
                        onClick={() => setModal({ kind: 'deactivate-account', member })}
                      />

                    ) : (
                      <span className="pill p-warn">
                        {member.status}
                      </span>
                    )
                  )}


                </td>
              </tr>
            ))}
        </DataTable>
      </article>
  )
}
