import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import UserPage from './pages/UserPage'
import AdminStaffPage from './pages/AdminStaffPage'
import HeartRateLoader from './components/HeartRateLoader'
import './styles/landing_and_forms.css'
import './styles/user_page.css'
import './styles/admin_staff_page.css'

export default function App() {
  const [route, setRoute] = useState(() => sessionStorage.getItem('fitpulse-route') || 'home')
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('fitpulse-session') || 'null'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  const navigate = (page) => {
    if (page === 'user' && currentUser?.role !== 'user') page = 'login'
    if (page === 'admin' && currentUser?.role !== 'admin') page = 'login'
    window.scrollTo(0, 0)
    sessionStorage.setItem('fitpulse-route', page)
    setRoute(page)
  }

  const login = (user) => {
    localStorage.setItem('fitpulse-session', JSON.stringify(user))
    setCurrentUser(user)
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      const dashboard = user.role === 'admin' ? 'admin' : 'user'
      window.scrollTo(0, 0)
      sessionStorage.setItem('fitpulse-route', dashboard)
      setRoute(dashboard)
    }, 1500)
  }

  const signOut = () => {
    localStorage.removeItem('fitpulse-session')
    setCurrentUser(null)
    navigate('home')
  }

  const pages = {
    home: <Home navigate={navigate} />,
    login: <Login navigate={navigate} onLogin={login} />,
    register: <Register navigate={navigate} />,
    user: <UserPage user={currentUser} onSignOut={signOut} />,
    admin: <AdminStaffPage user={currentUser} onSignOut={signOut} />
  }

  return (
    <>
      {route === 'home' && <Navbar route={route} navigate={navigate} />}
      {pages[route]}
      {route === 'home' && <Footer navigate={navigate} />}
      {loading && <HeartRateLoader message={currentUser ? 'Opening your dashboard' : 'Finding your rhythm'} />}
    </>
  )
}
