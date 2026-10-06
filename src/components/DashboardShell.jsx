import { useMemo, useState } from 'react'

const ADMIN_LINKS = [
  'Dashboard',
  'Members',
  'Staff / Coaches',
  'Memberships',
  'Attendance',
  'Payments',
  'Create Account',
  'Profile / Account'
]
const MEMBER_LINKS = ['Dashboard', 'My Membership', 'My Attendance', 'My Profile']

// Shared dashboard navigation and utility controls for both allowed roles.
export default function DashboardShell({
  role,
  user,
  onSignOut,
  navigate,
  activeSection,
  onSectionChange,
  children
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [panel, setPanel] = useState('')
  const [query, setQuery] = useState('')
  const links = role === 'admin' ? ADMIN_LINKS : MEMBER_LINKS
  const initials = (user?.name || 'FitPulse')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
  const matches = useMemo(
    () => links.filter((link) => link.toLowerCase().includes(query.toLowerCase())),
    [links, query]
  )
  const selectSection = (section) => {
    setSidebarOpen(false)
    if (section === 'Create Account') return navigate?.('register')
    onSectionChange(section)
  }

  return (
    <main className="dashboard-shell">
      <aside className={sidebarOpen ? 'dashboard-sidebar open' : 'dashboard-sidebar'}>
        <p className="dashboard-logo">
          FIT<span>PULSE</span>
        </p>
        <nav>
          {links.map((link, index) => (
            <button
              className={activeSection === link ? 'active' : ''}
              key={link}
              onClick={() => selectSection(link)}
            >
              <span>{['D', 'M', 'C', 'S', 'A', 'P', '+', 'O'][index]}</span>
              {link}
            </button>
          ))}
        </nav>
        <button className="sidebar-signout" onClick={onSignOut}>
          Sign out
        </button>
      </aside>
      <section className="dashboard-content">
        <header className="dashboard-topbar">
          <button
            className="top-icon hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            Menu
          </button>
          <div className="top-actions">
            <button
              className="top-icon"
              onClick={() => setPanel(panel === 'search' ? '' : 'search')}
              aria-label="Search"
            >
              Search
            </button>
            <button
              className="top-icon"
              onClick={() => setPanel(panel === 'help' ? '' : 'help')}
              aria-label="Help"
            >
              ?
            </button>
            <button
              className="top-icon notification"
              onClick={() => setPanel(panel === 'notifications' ? '' : 'notifications')}
              aria-label="Notifications"
            >
              Bell
              {panel !== 'notifications' && <b>3</b>}
            </button>
            <button
              className="user-chip"
              onClick={() => selectSection(role === 'admin' ? 'Profile / Account' : 'My Profile')}
            >
              <span>{initials}</span>
              <div>
                <strong>{user?.name || 'FitPulse User'}</strong>
                <small>{role === 'admin' ? 'Administrator' : 'Member'}</small>
              </div>
            </button>
          </div>
        </header>
        {panel && (
          <section className="utility-panel" role="status">
            {panel === 'search' && (
              <>
                <label>
                  Search dashboard
                  <input
                    autoFocus
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Find a page"
                  />
                </label>
                <div>
                  {matches.map((match) => (
                    <button
                      key={match}
                      onClick={() => {
                        selectSection(match)
                        setPanel('')
                      }}
                    >
                      {match}
                    </button>
                  ))}
                </div>
              </>
            )}
            {panel === 'help' && (
              <>
                <strong>Need help?</strong>
                <p>
                  Use the sidebar to move between FitPulse tools. Contact your gym administrator for
                  account support.
                </p>
              </>
            )}
            {panel === 'notifications' && (
              <>
                <strong>Notifications</strong>
                <p>3 member renewals need review this week.</p>
                <p>Today has 67 recorded check-ins.</p>
              </>
            )}
          </section>
        )}
        {children}
      </section>
    </main>
  )
}
