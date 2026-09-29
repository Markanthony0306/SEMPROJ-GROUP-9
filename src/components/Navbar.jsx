import { useState } from 'react'

export default function Navbar({ route, navigate }) {
  const [open, setOpen] = useState(false)

  const go = (page) => {
    setOpen(false)
    navigate(page)
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
        <a href="#programs" onClick={() => setOpen(false)}>
          Programs
        </a>
        <button onClick={() => go('login')}>Log in</button>
        <button className="button small" onClick={() => go('register')}>
          Join now
        </button>
      </nav>
    </header>
  )
}
