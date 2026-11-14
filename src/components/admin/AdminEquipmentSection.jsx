import DataTable from '../DataTable'
import { RecordDeleteButton } from '../RecordDeleteControls'
import EquipmentCategorySelect from '../EquipmentCategorySelect'
import { inspectionDue } from '../../utils/membership'

export default function AdminEquipmentSection({ data, loading, pending, act, setModal, canDeleteHistory, setDeletion, date }) {
  return (
      <>
        <article className="card clay">
          <div className="record-section-heading">
            <h2>Equipment Monitoring</h2>
            <button className="btn" onClick={() => setModal({ kind: 'equipment' })}>
              Add Equipment
            </button>
          </div>
          <DataTable headings={['Name', 'Category', 'Condition', 'Last inspection', 'Actions']}>
            {data.equipment.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>
                  <EquipmentCategorySelect
                    value={item.category || ''}
                    aria-label={`Category for ${item.name}`}
                    disabled={loading || pending}
                    onChange={(event) =>
                      act(
                        `/admin/equipment/${item.id}`,
                        {
                          method: 'PATCH',
                          body: JSON.stringify({ category: event.target.value })
                        },
                        'Category updated.'
                      )
                    }
                  />
                </td>
                <td>
                  <select
                    className="clay-in"
                    value={item.condition}
                    onChange={(event) =>
                      act(
                        `/admin/equipment/${item.id}`,
                        {
                          method: 'PATCH',
                          body: JSON.stringify({ condition: event.target.value })
                        },
                        'Condition updated.'
                      )
                    }
                  >
                    <option>Good</option>
                    <option>Needs Maintenance</option>
                    <option>Out of Service</option>
                  </select>
                </td>
                <td>
                  {date(item.lastInspected)}
                  {inspectionDue(item) && <small className="table-secondary">Inspection due</small>}
                </td>
                <td className="acts">
                  <button
                    className="btn sm"
                    type="button"
                    disabled={loading || pending}
                    onClick={() =>
                      act(
                        `/admin/equipment/${item.id}`,
                        { method: 'PATCH', body: JSON.stringify({ inspected: true }) },
                        'Inspection logged.'
                      )
                    }
                  >
                    Inspected
                  </button>
                  <button
                    className="btn sm ghost"
                    type="button"
                    disabled={loading || pending}
                    onClick={() => setModal({ kind: 'maintenance', item })}
                  >
                    Log repair
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        </article>
        <article className="card clay maintenance-log">
          <div className="record-section-heading">
            <h2>Maintenance & Repair Log</h2>
            {canDeleteHistory && (
              <RecordDeleteButton
                all
                label="Clear all maintenance records"
                disabled={loading || pending || !data.maintenance.length}
                onClick={() =>
                  setDeletion({
                    all: true,
                    category: 'maintenance',
                    count: data.maintenance.length
                  })
                }
              />
            )}
          </div>
          <DataTable
            headings={['Equipment', 'Note', 'Date', ...(canDeleteHistory ? ['Actions'] : [])]}
          >
            {data.maintenance.map((item) => (
              <tr key={item.id}>
                <td>{item.item}</td>
                <td>{item.note}</td>
                <td>{date(item.date)}</td>
                {canDeleteHistory && (
                  <td className="acts">
                    <RecordDeleteButton
                      label={`Delete maintenance record for ${item.item}`}
                      disabled={loading || pending}
                      onClick={() =>
                        setDeletion({ category: 'maintenance', id: item.id, label: item.item })
                      }
                    />
                  </td>
                )}
              </tr>
            ))}
          </DataTable>
        </article>
      </>
  )
}
