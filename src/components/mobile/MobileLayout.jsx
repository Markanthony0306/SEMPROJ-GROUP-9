import { useEffect, useRef, useState } from 'react'
import { DashboardSheetContext } from '../Dialog'
import BottomNav from './BottomNav'
import BottomSheet from './BottomSheet'
import MoreRow from './MoreRow'
import './mobile.css'

const ADMIN_MORE = [
  ['Equipment', 'Equipment monitoring', 'dumbbell'],
  ['Reports', 'Reports', 'chart'],
  ['Notifications', 'Email reminders', 'mail'],
  ['Settings', 'Settings', 'sliders']
]
const MEMBER_MORE = [
  ['Notifications', 'Notifications', 'bell'],
  ['Settings', 'Settings', 'sliders']
]
const activitySections = ['Activities', 'Attendance', 'Payments']

// Section state stays in each dashboard, including the existing operations screens.
export default function MobileLayout({
  activeSection,
  onSectionChange,
  onSignOut,
  onCreateMember,
  role,
  className,
  loading,
  Brand,
  Icon,
  dark,
  toggle,
  children,
  content,
  dialogs,
  qr
}) {
  const [sheet, setSheet] = useState('')
  const scroller = useRef(null)
  const admin = role === 'admin'
  const activityTab = activitySections.includes(activeSection)
  const active =
    activeSection === 'My QR'
      ? 'Membership'
      : activityTab
        ? 'Activities'
        : ['Dashboard', 'Members', 'Membership'].includes(activeSection)
          ? activeSection
          : 'More'
  const title = activeSection === 'Dashboard' ? 'Overview' : activeSection
  const moreLinks = admin ? ADMIN_MORE : MEMBER_MORE

  useEffect(() => {
    scroller.current?.scrollTo(0, 0)
  }, [activeSection])

  return (
    <DashboardSheetContext.Provider value={true}>
      <div className={`app ${className} fitpulse-mobile`}>
        <header className="fitpulse-mobile-header">
          <div className="logo brand">
            <Brand />
          </div>
          <button
            type="button"
            className="ib fitpulse-icon-button"
            onClick={toggle}
            aria-label={dark ? 'Use light theme' : 'Use dark theme'}
          >
            <Icon name={dark ? 'sun' : 'moon'} />
          </button>
        </header>
        <main className="fitpulse-mobile-scroll" ref={scroller}>
          <div className="fitpulse-mobile-content" aria-busy={loading}>
            {((activityTab && activeSection !== 'Activities') ||
              (active === 'More' && activeSection !== 'More')) && (
              <button
                type="button"
                className="fitpulse-text-button"
                onClick={() => onSectionChange(active)}
              >
                ← {active}
              </button>
            )}
            <h1>{title}</h1>
            {children}
            {activeSection === 'More' ? (
              <div className="fitpulse-more-list">
                {moreLinks.map(([destination, label, icon]) => (
                  <MoreRow
                    key={destination}
                    icon={<Icon name={icon} />}
                    label={label}
                    onClick={() => onSectionChange(destination)}
                  />
                ))}
                <MoreRow
                  icon={<Icon name={dark ? 'sun' : 'moon'} />}
                  label="Dark mode"
                  role="switch"
                  aria-checked={dark}
                  trailing={dark ? 'On' : 'Off'}
                  onClick={toggle}
                />
                <MoreRow
                  icon={<Icon name="out" />}
                  label="Sign out"
                  trailing=""
                  onClick={() => setSheet('sign-out')}
                />
              </div>
            ) : (
              content
            )}
          </div>
        </main>
        <BottomNav
          active={active}
          select={onSectionChange}
          createMember={onCreateMember}
          showQr={() => setSheet('qr')}
          admin={admin}
          Icon={Icon}
        />
        {dialogs}
        {sheet === 'qr' && (
          <BottomSheet title="My QR" onClose={() => setSheet('')}>
            {qr}
          </BottomSheet>
        )}
        {sheet === 'sign-out' && (
          <BottomSheet title="Sign out?" onClose={() => setSheet('')}>
            <p className="modal-copy">Are you sure you want to sign out of FitPulse?</p>
            <div className="ma">
              <button className="btn ghost" type="button" onClick={() => setSheet('')}>
                Cancel
              </button>
              <button className="btn" type="button" onClick={onSignOut}>
                Sign out
              </button>
            </div>
          </BottomSheet>
        )}
      </div>
    </DashboardSheetContext.Provider>
  )
}
