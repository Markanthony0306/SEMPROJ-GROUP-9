import { useState } from 'react'
const members = [
  ['Mia Cruz', 'FP-20483', '0917 555 0123', 'Active'],
  ['Carlos Reyes', 'FP-20451', '0917 555 0198', 'Active'],
  ['Angela Santos', 'FP-20396', '0917 555 0147', 'Expiring'],
  ['James Tan', 'FP-20318', '0917 555 0154', 'Expired']
]
const equipment = [
  ['Treadmill 01', 'Cardio', 'Good', 'Sep 16, 2026'],
  ['Bench Press 02', 'Strength', 'Needs Maintenance', 'Sep 24, 2026'],
  ['Dumbbell Rack', 'Free weights', 'Good', 'Sep 12, 2026'],
  ['Cable Machine', 'Strength', 'Out of Service', 'Sep 28, 2026']
]
export default function AdminStaffPage({ navigate }) {
  const [query, setQuery] = useState('')
  const [scan, setScan] = useState('')
  const [paid, setPaid] = useState(false)
  const shown = members.filter((m) => m.join(' ').toLowerCase().includes(query.toLowerCase()))
  return (
    <main className="admin portal">
      <header className="portal-header">
        <img src="/images/fitpulse.jpg" alt="FitPulse" />
        <div>
          <span className="online-dot" /> Staff console
        </div>
        <button onClick={() => navigate('home')}>Sign out</button>
      </header>
      <section className="admin-heading">
        <div>
          <p className="eyebrow">Operations overview</p>
          <h1>
            Good morning, <em>Coach.</em>
          </h1>
          <p>Here’s what’s happening at FitPulse today.</p>
        </div>
        <button className="button">+ Register member</button>
      </section>
      <section className="stats">
        <article>
          <span>◉</span>
          <p>Active members</p>
          <strong>248</strong>
          <small>+12 this month</small>
        </article>
        <article>
          <span>↗</span>
          <p>Today's check-ins</p>
          <strong>67</strong>
          <small>18% above Tuesday avg.</small>
        </article>
        <article>
          <span>⚡</span>
          <p>Expiring soon</p>
          <strong>14</strong>
          <small>Next 3–7 days</small>
        </article>
        <article>
          <span>₱</span>
          <p>Monthly revenue</p>
          <strong>₱186k</strong>
          <small>90% of target</small>
        </article>
      </section>
      <section className="admin-grid">
        <article className="card scanner">
          <p className="eyebrow">QR attendance</p>
          <h2>Member check-in</h2>
          <div className={scan ? 'scan-view complete' : 'scan-view'}>
            <span>{scan ? '✓' : '⌗'}</span>
            <p>{scan ? 'Mia Cruz checked in' : 'Ready to scan'}</p>
          </div>
          <button className="button" onClick={() => setScan('Mia Cruz')}>
            {scan ? 'Scan another code' : 'Simulate QR scan'}
          </button>
        </article>
        <article className="card payment">
          <p className="eyebrow">Payment recording</p>
          <h2>Log a payment</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setPaid(true)
            }}
          >
            <select defaultValue="">
              <option value="" disabled>
                Select member
              </option>
              <option>Mia Cruz · FP-20483</option>
              <option>Carlos Reyes · FP-20451</option>
            </select>
            <div>
              <input required placeholder="Amount (₱)" type="number" />
              <select>
                <option>GCash</option>
                <option>Cash</option>
              </select>
            </div>
            <select>
              <option>Unlimited Monthly</option>
              <option>Student Plan</option>
            </select>
            <button className="button">Record payment</button>
          </form>
          {paid && <p className="success-message">Payment recorded successfully.</p>}
        </article>
        <article className="card reminders">
          <p className="eyebrow">Automated reminders</p>
          <h2>Renewal queue</h2>
          <strong>14 members</strong>
          <p>have memberships expiring in the next 3–7 days.</p>
          <button>✉ Send email reminders</button>
          <small>Last sent today at 8:00 AM</small>
        </article>
      </section>
      <section className="card members-card">
        <div className="card-title">
          <div>
            <p className="eyebrow">Member management</p>
            <h2>Members directory</h2>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, ID, or contact"
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Member ID</th>
                <th>Contact</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map(([name, id, contact, status]) => (
                <tr key={id}>
                  <td>
                    <strong>{name}</strong>
                  </td>
                  <td>{id}</td>
                  <td>{contact}</td>
                  <td>
                    <span
                      className={
                        'status ' +
                        (status === 'Active' ? 'good' : status === 'Expired' ? 'bad' : 'warn')
                      }
                    >
                      {status}
                    </span>
                  </td>
                  <td>
                    <button>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card equipment-card">
        <div className="card-title">
          <div>
            <p className="eyebrow">Equipment monitoring</p>
            <h2>Maintenance board</h2>
          </div>
          <button>+ Add equipment</button>
        </div>
        <div className="equipment-grid">
          {equipment.map(([item, category, status, date]) => (
            <article key={item}>
              <span className={'equipment-icon ' + status.replaceAll(' ', '-')}>●</span>
              <h3>{item}</h3>
              <p>{category}</p>
              <span
                className={
                  'status ' +
                  (status === 'Good' ? 'good' : status === 'Needs Maintenance' ? 'warn' : 'bad')
                }
              >
                {status}
              </span>
              <small>Inspected {date}</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
