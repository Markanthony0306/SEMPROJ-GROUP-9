import DataTable from '../DataTable'
import ProfileAvatar from '../ProfileAvatar'
import { RecordDeleteButton } from '../RecordDeleteControls'
import WebcamQrScanner from '../WebcamQrScanner'
import PhysicalQrScanner from '../PhysicalQrScanner'

export default function AdminAttendanceSection({ data, members, loading, pending, canDeleteHistory, setDeletion, scanQr, section, dateTime }) {
  return (
      <article className="card clay">
        <div className="record-section-heading">
          <div>
            <h2>Entrance check-ins</h2>
            <p>ESP32-CAM scans appear here automatically when members scan their QR passes.</p>
          </div>
          {canDeleteHistory && (
            <RecordDeleteButton
              all
              label="Clear all attendance records"
              disabled={loading || pending || !data.attendance.length}
              onClick={() =>
                setDeletion({ all: true, category: 'attendance', count: data.attendance.length })
              }
            />
          )}
        </div>

        {section === 'Attendance' && (
          <>
            <PhysicalQrScanner onScan={scanQr} />
            <WebcamQrScanner onScan={scanQr} />
          </>
        )}

        <DataTable
          headings={[
            'Member',
            'Date & Time',
            'Recorded by',
            ...(canDeleteHistory ? ['Actions'] : [])
          ]}
        >
          {data.attendance.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="member-table-person">
                  <ProfileAvatar
                    user={members.find((member) => member.id === item.memberId)}
                    memberId={item.memberId}
                  />
                  <span>{item.memberName}</span>
                </div>
              </td>
              <td>{dateTime(item.date)}</td>
              <td>{item.source || 'Staff'}</td>
              {canDeleteHistory && (
                <td className="acts">
                  <RecordDeleteButton
                    label={`Delete attendance record for ${item.memberName}`}
                    disabled={loading || pending}
                    onClick={() =>
                      setDeletion({ category: 'attendance', id: item.id, label: item.memberName })
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
