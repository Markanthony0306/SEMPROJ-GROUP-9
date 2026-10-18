import { useMemo, useRef, useState } from 'react'
import DataTable from './DataTable'
import Dialog from './Dialog'
import ProfileAvatar from './ProfileAvatar'
import { Icon } from './DashboardShell'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'
import { REPORT_TYPES, buildReport } from '../utils/reports'
import { downloadCsvRows } from '../utils/paymentExport'

function localDateTime(value = new Date()) {
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function RecordForm({ kind, record, data, busy, onSubmit, onClose }) {
  const maintenance = kind === 'maintenance'
  const payment = kind === 'payments'
  return (
    <form className="mf" onSubmit={onSubmit}>
      <fieldset className="report-form-fields" disabled={busy}>
        {maintenance ? (
          <>
            <label className="field">
              Equipment
              <select
                className="clay-in"
                name="equipmentId"
                defaultValue={record?.equipmentId || ''}
                required
                data-autofocus
              >
                <option value="" disabled>
                  Choose equipment
                </option>
                {data.equipment.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Maintenance note
              <textarea
                className="clay-in"
                name="note"
                defaultValue={record?.note || ''}
                required
                maxLength={500}
                rows={4}
                placeholder="What was inspected, repaired, or replaced?"
              />
            </label>
          </>
        ) : (
          <>
            <label className="field">
              Member
              <select
                className="clay-in"
                name="memberId"
                defaultValue={record?.memberId || ''}
                disabled={Boolean(record)}
                required
                data-autofocus
              >
                <option value="" disabled>
                  Choose a member
                </option>
                {data.members
                  .filter((member) => ['user', 'member'].includes(member.role))
                  .map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} · {member.memberCode || member.id}
                    </option>
                  ))}
              </select>
            </label>
            {payment && (
              <div className="report-form-row">
                <label className="field">
                  Amount (PHP)
                  <input
                    className="clay-in"
                    type="number"
                    name="amount"
                    min="0.01"
                    max="100000000"
                    step="0.01"
                    required
                    defaultValue={record?.amount || ''}
                    placeholder="0.00"
                  />
                </label>
                <label className="field">
                  Payment method
                  <select className="clay-in" name="method" defaultValue={record?.method || 'Cash'}>
                    <option>Cash</option>
                    <option>GCash</option>
                  </select>
                </label>
              </div>
            )}
          </>
        )}
        <label className="field">
          Date and time (your local time)
          <input
            className="clay-in"
            type="datetime-local"
            name="date"
            required
            min="2000-01-01T00:00"
            max={localDateTime()}
            defaultValue={localDateTime(record?.date)}
          />
        </label>
        <p className="form-help">
          {payment
            ? 'This records money already received. It does not charge a member or extend their membership.'
            : maintenance
              ? 'This updates the maintenance history. Equipment condition is managed on the Equipment page.'
              : 'Staff entries must fall within the member’s active membership. Scanner details stay attached when correcting a record.'}
        </p>
        <div className="ma">
          <button className="btn ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" type="submit">
            {busy ? 'Saving…' : record ? 'Save changes' : 'Create record'}
          </button>
        </div>
      </fieldset>
    </form>
  )
}

export default function AdminReports({ data, onChanged, onMemberAction }) {
  const { token, role } = useAuth()
  const [kind, setKind] = useState('active')
  const [dialog, setDialog] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const actionLock = useRef(false)
  const reports = useMemo(
    () => Object.fromEntries(REPORT_TYPES.map(([value]) => [value, buildReport(value, data)])),
    [data]
  )
  const report = reports[kind]
  const title = REPORT_TYPES.find(([value]) => value === kind)[1]
  const membership = ['active', 'expired'].includes(kind)
  const collection = kind === 'renewals' ? 'payments' : kind
  const total = ['payments', 'renewals'].includes(kind)
    ? report.records.reduce((sum, row) => sum + Number(row.amount || 0), 0)
    : null
  const open = (mode, record, index) => {
    setError('')
    setDialog({ mode, record, index })
  }
  const save = async (event) => {
    event.preventDefault()
    if (actionLock.current) return
    actionLock.current = true
    setBusy(true)
    setError('')
    try {
      const deleting = dialog.mode === 'delete'
      const input = deleting ? null : Object.fromEntries(new FormData(event.currentTarget))
      if (input) input.date = new Date(input.date).toISOString()
      await apiRequest(
        `/admin/reports/${collection}${dialog.record ? `/${dialog.record.id}` : ''}`,
        {
          token,
          method: deleting ? 'DELETE' : dialog.record ? 'PATCH' : 'POST',
          ...(input ? { body: JSON.stringify(input) } : {})
        }
      )
      setDialog(null)
      const refreshed = await onChanged()
      setNotice(
        `${deleting ? 'Record deleted.' : 'Record saved.'} ${
          refreshed === false
            ? 'The refresh failed. Use Retry above to reload the latest records.'
            : 'Reports and dashboard totals have been refreshed.'
        }`
      )
    } catch (cause) {
      setError(cause.message || 'Unable to save this record. Please try again.')
    } finally {
      actionLock.current = false
      setBusy(false)
    }
  }
  return (
    <article className="card clay reports-card">
      <div className="report-heading">
        <div className="report-heading-actions">
          <button
            className="btn ghost"
            type="button"
            disabled={!report.rows.length}
            onClick={() => downloadCsvRows(`fitpulse-${kind}`, report.headings, report.rows)}
          >
            Export CSV
          </button>
          <button
            className="btn"
            type="button"
            disabled={busy}
            onClick={() =>
              membership
                ? onMemberAction('create')
                : kind === 'renewals'
                  ? open('renew')
                  : open('edit')
            }
          >
            +{' '}
            {membership
              ? 'Create account'
              : kind === 'renewals'
                ? 'Renew membership'
                : 'Add record'}
          </button>
        </div>
      </div>
      <div className="report-tabs" role="group" aria-label="Report type">
        {REPORT_TYPES.map(([value, label]) => (
          <button
            type="button"
            key={value}
            title={label}
            aria-pressed={kind === value}
            onClick={() => {
              setKind(value)
              setNotice('')
            }}
          >
            {
              {
                active: 'Active',
                expired: 'Expired',
                attendance: 'Attendance',
                payments: 'Payment',
                renewals: 'Renewal',
                maintenance: 'Maintenance'
              }[value]
            }
            <span>{reports[value].rows.length}</span>
          </button>
        ))}
      </div>
      {notice && (
        <p className="report-notice" role="status">
          {notice}
        </p>
      )}
      <DataTable key={kind} headings={[...report.headings, 'Actions']} caption={title}>
        {report.rows.map((row, index) => (
          <tr key={report.records[index].id}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>
                {cellIndex === 0 && collection !== 'maintenance' ? (
                  <div className="member-table-person">
                    <ProfileAvatar user={{ name: cell }} />
                    <span>{cell}</span>
                  </div>
                ) : (
                  cell
                )}
              </td>
            ))}
            <td className="acts">
              <button
                className="report-icon-button"
                type="button"
                title="View record"
                aria-label={`View ${row[0]} record`}
                onClick={() => open('view', report.records[index], index)}
              >
                <Icon name="eye" size={18} />
              </button>
              <button
                className="report-icon-button"
                type="button"
                title="Edit record"
                aria-label={`Edit ${row[0]} record`}
                onClick={() =>
                  membership
                    ? onMemberAction('edit', report.records[index])
                    : open('edit', report.records[index])
                }
              >
                <Icon name="edit" size={18} />
              </button>
              {!membership && role === 'admin' && (
                <button
                  className="report-icon-button is-danger"
                  type="button"
                  title="Delete record"
                  aria-label={`Delete ${row[0]} record`}
                  onClick={() => open('delete', report.records[index], index)}
                >
                  <Icon name="trash" size={18} />
                </button>
              )}
              {membership && (
                <button
                  className="btn sm"
                  type="button"
                  onClick={() => onMemberAction('renew', report.records[index])}
                >
                  Renew
                </button>
              )}
            </td>
          </tr>
        ))}
      </DataTable>
      <div className="report-total">
        <strong>
          {total === null
            ? `${report.rows.length} ${title.toLowerCase()}`
            : `Total: ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(total)}`}
        </strong>
        <small>
          {membership
            ? 'Membership reports reflect account and subscription records.'
            : 'Changes update the source records, including dashboard totals.'}
        </small>
      </div>
      {dialog && (
        <Dialog
          title={
            dialog.mode === 'delete'
              ? 'Delete this record?'
              : dialog.mode === 'view'
                ? title
                : dialog.mode === 'renew'
                  ? 'Renew a membership'
                  : dialog.record
                    ? 'Edit record'
                    : 'Add a record'
          }
          busy={busy}
          onClose={() => setDialog(null)}
        >
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {dialog.mode === 'view' ? (
            <>
              <dl className="report-record-details">
                {report.headings.map((heading, index) => (
                  <div key={heading}>
                    <dt>{heading}</dt>
                    <dd>{report.rows[dialog.index]?.[index]}</dd>
                  </div>
                ))}
              </dl>
              <div className="ma">
                <button className="btn" type="button" onClick={() => setDialog(null)}>
                  Close
                </button>
              </div>
            </>
          ) : dialog.mode === 'delete' ? (
            <form onSubmit={save}>
              <p className="modal-copy">
                Delete the{' '}
                {collection === 'payments'
                  ? 'payment'
                  : collection === 'attendance'
                    ? 'attendance entry'
                    : 'maintenance note'}{' '}
                for <strong>{report.rows[dialog.index]?.[0]}</strong>? This cannot be undone.
                {collection === 'payments' &&
                  ' Membership dates stay unchanged; recorded revenue will decrease.'}
              </p>
              <div className="ma">
                <button
                  className="btn ghost"
                  type="button"
                  disabled={busy}
                  onClick={() => setDialog(null)}
                >
                  Keep record
                </button>
                <button className="btn danger" type="submit" disabled={busy}>
                  {busy ? 'Deleting…' : 'Delete record'}
                </button>
              </div>
            </form>
          ) : dialog.mode === 'renew' ? (
            <form
              className="mf"
              onSubmit={(event) => {
                event.preventDefault()
                const member = data.members.find(
                  (item) => item.id === new FormData(event.currentTarget).get('memberId')
                )
                if (member) {
                  setDialog(null)
                  onMemberAction('renew', member)
                }
              }}
            >
              <label className="field">
                Member
                <select className="clay-in" name="memberId" required defaultValue="">
                  <option value="" disabled>
                    Choose a member
                  </option>
                  {data.members
                    .filter((member) => ['user', 'member'].includes(member.role))
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                </select>
              </label>
              <div className="ma">
                <button className="btn" type="submit">
                  Continue to renewal
                </button>
              </div>
            </form>
          ) : (
            <RecordForm
              kind={collection}
              record={dialog.record}
              data={data}
              busy={busy}
              onSubmit={save}
              onClose={() => setDialog(null)}
            />
          )}
        </Dialog>
      )}
    </article>
  )
}
