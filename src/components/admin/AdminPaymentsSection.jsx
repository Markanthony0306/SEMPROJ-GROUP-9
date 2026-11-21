import DataTable from '../DataTable'
import { RecordDeleteButton } from '../RecordDeleteControls'
import { downloadPayments } from '../../utils/paymentExport'
import { Pill } from './AdminStaffDialogs'

export default function AdminPaymentsSection({ data, loading, pending, canDeleteHistory, setModal, setDeletion, money, date }) {
  return (
      <article className="card clay">
        <div className="record-section-heading">
          <h2>Payment History</h2>
          <div className="record-section-actions">
            <button
              className="btn ghost"
              type="button"
              disabled={!data.payments.length}
              onClick={() => downloadPayments(data.payments, { includeMember: true })}
            >
              Export CSV
            </button>
            <button className="btn" onClick={() => setModal({ kind: 'payment' })}>
              Record Payment
            </button>
            {canDeleteHistory && (
              <RecordDeleteButton
                all
                label="Clear all payment records"
                disabled={loading || pending || !data.payments.length}
                onClick={() =>
                  setDeletion({ all: true, category: 'payments', count: data.payments.length })
                }
              />
            )}
          </div>
        </div>
        <DataTable
          headings={[
            'Member',
            'Plan',
            'Payment',
            'Amount',
            'Method',
            'Date',
            ...(canDeleteHistory ? ['Actions'] : [])
          ]}
        >
          {data.payments.map((item) => (
            <tr key={item.id}>
              <td>{item.memberName}</td>
              <td>{item.plan || 'Not recorded'}</td>
              <td>{item.type || 'Membership'}</td>
              <td>{money(item.amount)}</td>
              <td>
                <Pill status={item.method} />
              </td>
              <td>{date(item.date)}</td>
              {canDeleteHistory && (
                <td className="acts">
                  <RecordDeleteButton
                    label={`Delete payment record for ${item.memberName}`}
                    disabled={loading || pending}
                    onClick={() =>
                      setDeletion({ category: 'payments', id: item.id, label: item.memberName })
                    }
                  />
                </td>
              )}
            </tr>
          ))}
        </DataTable>
      </article>
  )
}
