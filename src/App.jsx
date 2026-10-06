import { useEffect, useState } from 'react'
import { useAuth } from './auth/AuthContext'
import HeartRateLoader from './components/HeartRateLoader'
import ProtectedRoute from './components/ProtectedRoute'
import { apiRequest } from './utils/api'
import AdminStaffPage from './pages/AdminStaffPage'
import ForgotPassword from './pages/ForgotPassword'
import Login from './pages/Login'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import UserPage from './pages/UserPage'
import './styles/landing_and_forms.css'
import './styles/admin_staff_page.css'

// Vite injects BASE_URL (with a trailing slash) when the app is hosted under a
// subpath such as GitHub Pages. Every generated link must respect it.
const HOME_URL = import.meta.env.BASE_URL || '/'

function initialState() {
  const pathname = window.location.pathname
  if (pathname.includes('reset-password')) return 'reset-password'
  if (pathname.includes('forgot-password')) return 'forgot-password'
  return sessionStorage.getItem('fitpulse-route') || 'login'
}

export default function App() {
  const { login, logout, user, token } = useAuth()
  const [route, setRoute] = useState(initialState)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Opening your dashboard')

  // Re-validate an existing session on startup so an expired token does not leave
  // the user inside a dashboard that can no longer reach the API.
  useEffect(() => {
    if (!token) return
    let cancelled = false
    apiRequest('/me', { token }).catch((error) => {
      if (!cancelled && error.kind !== 'network') logout()
    })
    return () => {
      cancelled = true
    }
  }, [token, logout])

  const navigate = (nextRoute) => {
    window.scrollTo(0, 0)
    const target =
      nextRoute === 'reset-password'
        ? `${HOME_URL}reset-password`
        : nextRoute === 'forgot-password'
          ? `${HOME_URL}forgot-password`
          : HOME_URL
    window.history.replaceState({}, '', target)
    sessionStorage.setItem('fitpulse-route', nextRoute)
    setRoute(nextRoute)
  }

  const handleLogin = (session) => {
    const account = session.user
    const destination = ['admin', 'staff'].includes(account.role) ? 'admin' : 'user'
    login(session)
    setLoadingMessage(
      destination === 'admin' ? 'Opening the staff dashboard' : 'Opening your member dashboard'
    )
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      navigate(destination)
    }, 1500)
  }

  const handleLogout = () => {
    logout()
    navigate('login')
  }

  const pages = {
    login: <Login navigate={navigate} onLogin={handleLogin} />,
    'forgot-password': <ForgotPassword navigate={navigate} />,
    'reset-password': <ResetPassword navigate={navigate} />,
    register: (
      <ProtectedRoute navigate={navigate} roles={['admin', 'staff']}>
        <Register navigate={navigate} />
      </ProtectedRoute>
    ),
    user: (
      <ProtectedRoute navigate={navigate} roles={['user', 'member']}>
        <UserPage user={user} onSignOut={handleLogout} />
      </ProtectedRoute>
    ),
    admin: (
      <ProtectedRoute navigate={navigate} roles={['admin', 'staff']}>
        <AdminStaffPage user={user} onSignOut={handleLogout} navigate={navigate} />
      </ProtectedRoute>
    )
  }

  return (
    <>
      {pages[route] || pages.login}
      {loading && <HeartRateLoader message={loadingMessage} />}
    </>
  )
}
