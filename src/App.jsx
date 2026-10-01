import { useEffect, useState } from 'react'
import { useAuth } from './auth/AuthContext'
import Footer from './components/Footer'
import HeartRateLoader from './components/HeartRateLoader'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import AdminStaffPage from './pages/AdminStaffPage'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import UserPage from './pages/UserPage'
import './styles/landing_and_forms.css'
import './styles/user_page.css'
import './styles/admin_staff_page.css'

export default function App() {
  const { login, logout, user } = useAuth()
  const [route, setRoute] = useState(() => sessionStorage.getItem('fitpulse-route') || 'home')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  const navigate = (nextRoute) => {
    window.scrollTo(0, 0)
    sessionStorage.setItem('fitpulse-route', nextRoute)
    setRoute(nextRoute)
  }

  const handleLogin = (sessionOrAccount) => {
    const account = sessionOrAccount.user || sessionOrAccount
    login(
      sessionOrAccount.user
        ? sessionOrAccount
        : { user: account, role: account.role, token: 'local-development-session' }
    )
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      navigate(['admin', 'staff'].includes(account.role) ? 'admin' : 'user')
    }, 1500)
  }

  const handleLogout = () => {
    logout()
    navigate('home')
  }

  const pages = {
    home: <Home navigate={navigate} />,
    login: <Login navigate={navigate} onLogin={handleLogin} />,
    register: <Register navigate={navigate} />,
    user: (
      <ProtectedRoute navigate={navigate} roles={['user']}>
        <UserPage user={user} onSignOut={handleLogout} />
      </ProtectedRoute>
    ),
    admin: (
      <ProtectedRoute navigate={navigate} roles={['admin', 'staff']}>
        <AdminStaffPage user={user} onSignOut={handleLogout} />
      </ProtectedRoute>
    )
  }

  return (
    <>
      {route === 'home' && <Navbar route={route} navigate={navigate} />}
      {pages[route] || pages.home}
      {route === 'home' && <Footer navigate={navigate} />}
      {loading && (
        <HeartRateLoader message={user ? 'Opening your dashboard' : 'Finding your rhythm'} />
      )}
    </>
  )
}
