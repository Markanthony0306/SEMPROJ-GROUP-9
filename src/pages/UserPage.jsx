import { useState } from 'react'
const attendance = ['Sep 29, 2026 · 6:42 PM', 'Sep 27, 2026 · 9:15 AM', 'Sep 25, 2026 · 6:31 PM']
const payments = [
  ['Sep 01, 2026', 'GCash', '₱1,500'],
  ['Aug 01, 2026', 'Cash', '₱1,500']
]
export default function UserPage({ navigate }) {
  const [checked, setChecked] = useState(false)
  return (
    <main className="portal">
      <header className="portal-header">
        <img src="/images/fitpulse.jpg" alt="FitPulse" />
        <div>
          <span className="online-dot" /> Member portal
        </div>
        <button onClick={() => navigate('home')}>Sign out</button>
      </header>
      <section className="portal-welcome">
        <div>
          <p className="eyebrow">Tuesday, September 30</p>
          <h1>
            Hey, Mia. <em>Let's move.</em>
          </h1>
          <p>Your consistency is your superpower. One more session closer.</p>
        </div>
        <div className="membership-chip">
          <span>● Active membership</span>
          <strong>28 days remaining</strong>
        </div>
      </section>
      <div className="expiry-alert">
        <span>⚡</span>
        <div>
          <strong>Your membership renews in 28 days.</strong>
          <p>Keep your streak going—renew before October 28, 2026.</p>
        </div>
        <button>Renew plan</button>
      </div>
      <section className="member-grid">
        <article className="profile-card card">
          <p className="eyebrow">Your profile</p>
          <div className="profile-name">
            <span>MC</span>
            <div>
              <h2>Mia Cruz</h2>
              <p>Member ID · FP-20483</p>
            </div>
          </div>
          <dl>
            <div>
              <dt>Plan</dt>
              <dd>Unlimited Monthly</dd>
            </div>
            <div>
              <dt>Started</dt>
              <dd>June 28, 2026</dd>
            </div>
            <div>
              <dt>Expires</dt>
              <dd>October 28, 2026</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd className="status good">Active</dd>
            </div>
          </dl>
        </article>
        <article className="qr-card card">
          <p className="eyebrow">Gym entry pass</p>
          <h2>Your check-in code</h2>
          <div className="qr">
            <div className="qr-mark">
              FP
              <br />
              <small>20483</small>
            </div>
          </div>
          <p>Present this code at the front desk.</p>
          <button className="button" onClick={() => setChecked(true)}>
            {checked ? '✓ Checked in today' : 'Simulate check-in'}
          </button>
        </article>
        <article className="quick-card card">
          <p className="eyebrow">This month</p>
          <strong>12</strong>
          <p>workouts completed</p>
          <div className="progress">
            <i />
          </div>
          <small>3 sessions to reach your goal</small>
        </article>
      </section>
      <section className="history-grid">
        <article className="card">
          <div className="card-title">
            <div>
              <p className="eyebrow">Attendance</p>
              <h2>Check-in history</h2>
            </div>
            <button>View all</button>
          </div>
          {attendance.map((date, i) => (
            <div className="list-row" key={date}>
              <span className="timeline-dot" />
              <div>
                <strong>Gym check-in</strong>
                <p>{date}</p>
              </div>
              <span className="status good">Complete</span>
            </div>
          ))}
        </article>
        <article className="card">
          <div className="card-title">
            <div>
              <p className="eyebrow">Payments</p>
              <h2>Payment history</h2>
            </div>
            <button>Download</button>
          </div>
          {payments.map(([date, method, amount]) => (
            <div className="list-row" key={date}>
              <div>
                <strong>{method} payment</strong>
                <p>{date} · Unlimited Monthly</p>
              </div>
              <strong>{amount}</strong>
            </div>
          ))}
        </article>
      </section>
    </main>
  )
}
