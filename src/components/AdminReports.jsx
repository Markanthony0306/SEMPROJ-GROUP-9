import { useState } from 'react'
import DataTable from './DataTable'
import { REPORT_TYPES, buildReport } from '../utils/reports'
import { downloadCsvRows } from '../utils/paymentExport'

export default function AdminReports({ data }) {
  const [kind, setKind] = useState('active')
  const report = buildReport(kind, data)
  const title = REPORT_TYPES.find(([value]) => value === kind)[1]
  return (
    <article className="card clay">
      <h2>Reports</h2>
      <p className="form-help">Review stored records and download a CSV report.</p>
      <div className="report-toolbar">
        <label className="field">
          Report type
          <select
            className="clay-in"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            {REPORT_TYPES.map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="btn"
          type="button"
          disabled={!report.rows.length}
          onClick={() => downloadCsvRows(`fitpulse-${kind}`, report.headings, report.rows)}
        >
          Export CSV
        </button>
      </div>
      <DataTable key={kind} headings={report.headings} caption={title}>
        {report.rows.map((row, index) => (
          <tr key={`${kind}-${index}`}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>{cell}</td>
            ))}
          </tr>
        ))}
      </DataTable>
    </article>
  )
}
