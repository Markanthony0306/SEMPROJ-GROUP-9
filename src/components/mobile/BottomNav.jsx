// The primary action occupies the middle slot without changing the other tabs.
export default function BottomNav({ active, select, createMember, showQr, admin, Icon }) {
  const tabs = [
    ['Dashboard', 'Overview', 'home'],
    admin ? ['Members', 'Members', 'users'] : ['Membership', 'Membership', 'card'],
    null,
    ['Activities', 'Activities', 'chart'],
    ['More', 'More', 'menu']
  ]
  return (
    <nav className="fitpulse-bottom-nav" aria-label="Dashboard navigation">
      {tabs.map((tab) => {
        if (!tab) {
          return (
            <button
              key="primary"
              className="fitpulse-nav-primary"
              type="button"
              aria-label={admin ? 'Create a new member' : 'Open my QR'}
              onClick={admin ? createMember : showQr}
            >
              <span className="fitpulse-nav-primary-icon">
                <Icon name={admin ? 'plus' : 'qr'} size={30} strokeWidth={1.8} />
              </span>
              <span>{admin ? 'New member' : 'My QR'}</span>
            </button>
          )
        }
        const [destination, label, icon] = tab
        return (
          <button
            type="button"
            key={destination}
            aria-current={active === destination ? 'page' : undefined}
            onClick={() => select(destination)}
          >
            <Icon name={icon} size={22} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
