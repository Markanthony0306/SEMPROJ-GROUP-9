import { useState } from 'react'

export default function Navbar({ route, navigate }) {
  const [open, setOpen] = useState(false)

  const go = (page) => {
    setOpen(false)
    navigate(page)
  }

  const scrollTo = (id) => {
    setOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className="navbar">
      <button className="logo-button" onClick={() => go('home')} aria-label="FitPulse home">
        <img src="/images/fitpulse.jpg" alt="FitPulse" />
      </button>
      <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
        ☰
      </button>
      <nav className={open ? 'nav-links open' : 'nav-links'}>
        <button className={route === 'home' ? 'active' : ''} onClick={() => go('home')}>
          Home
        </button>
        <button onClick={() => scrollTo('programs')}>Programs</button>
        <button onClick={() => scrollTo('coaching')}>Coaching</button>
        <button onClick={() => go('login')}>Log in</button>
        <button className="button small" onClick={() => go('register')}>
          Join now
        </button>
      </nav>
    </header>
  )
}
