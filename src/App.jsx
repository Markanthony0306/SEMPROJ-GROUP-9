import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useAuth } from './auth/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import { apiRequest } from './utils/api'

const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'))
const AdminStaffPage = lazy(() => import('./pages/AdminStaffPage'))
const UserPage = lazy(() => import('./pages/UserPage'))
const NotFound = lazy(() => import('./pages/NotFound'))
const GorillaProvider = lazy(() => import('./components/gorilla/GorillaAssistant').then(({ GorillaProvider }) => ({ default: GorillaProvider })))

// Vite injects BASE_URL (with a trailing slash) when the app is hosted under a
// subpath such as GitHub Pages. Every generated link must respect it.
const HOME_URL = `${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/`
const routePaths = new Map([
  ['', 'login'], ['login', 'login'], ['forgot-password', 'forgot-password'],
  ['reset-password', 'reset-password'], ['register', 'register'], ['user', 'user'], ['admin', 'admin']
])

function readRoute() {
  const pathname = window.location.pathname
  if (pathname === HOME_URL.slice(0, -1)) return 'login'
  if (!pathname.startsWith(HOME_URL)) return 'not-found'
  const path = pathname.slice(HOME_URL.length).replace(/\/$/, '')
  if (!path) {
    const saved = sessionStorage.getItem('fitpulse-route')
    if (['admin', 'user', 'register'].includes(saved)) return saved
  }
  return routePaths.get(path) || 'not-found'
}

export default function App() {
  const { login, logout, user, token, role, memberLoginComplete } = useAuth()
  const [route, setRoute] = useState(readRoute)

  useEffect(() => {
    const onPopState = () => setRoute(readRoute())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Re-validate an existing session on startup so an expired token does not leave
  // the user inside a dashboard that can no longer reach the API.
  useEffect(() => {
    if (!token) return
    let cancelled = false
    apiRequest('/me', { token }).catch((error) => {
      if (!cancelled && [401, 403].includes(error.status)) logout()
    })
    return () => {
      cancelled = true
    }
  }, [token, logout])

  const navigate = useCallback((nextRoute) => {
    window.scrollTo(0, 0)
    const target = nextRoute === 'login' ? HOME_URL : `${HOME_URL}${nextRoute}`
    window.history.replaceState({}, '', target)
    sessionStorage.setItem('fitpulse-route', nextRoute)
    setRoute(nextRoute)
  }, [])

  const handleLogin = (session) => {
    const account = session.user
    const destination = account.role === 'admin' ? 'admin' : 'user'
    login(session)
    navigate(destination)
  }

  const handleLogout = () => {
    logout()
    navigate('login')
  }

  const pages = {
    login: <Login navigate={navigate} onLogin={handleLogin} />,
    'forgot-password': (
      <Login key="recovery" initialRecoveryOpen navigate={navigate} onLogin={handleLogin} />
    ),
    'reset-password': <ResetPassword navigate={navigate} />,
    register: (
      <ProtectedRoute key="register" navigate={navigate} roles={['admin']}>
        <AdminStaffPage user={user} onSignOut={handleLogout} navigate={navigate} startMemberCreation />
      </ProtectedRoute>
    ),
    user: (
      <ProtectedRoute navigate={navigate} roles={['user', 'member']}>
        <UserPage user={user} onSignOut={handleLogout} />
      </ProtectedRoute>
    ),
    admin: (
      <ProtectedRoute navigate={navigate} roles={['admin']}>
        <AdminStaffPage user={user} onSignOut={handleLogout} navigate={navigate} />
      </ProtectedRoute>
    )
  }
  const dashboard = token && (
    ((route === 'admin' || route === 'register') && role === 'admin') ||
    (route === 'user' && memberLoginComplete && ['user', 'member'].includes(role))
  )
  let page = pages[route] || <NotFound navigate={navigate} />
  if (dashboard) {
    page = user?.mustChangePassword
      ? <ChangePasswordPage onSignOut={handleLogout} />
      : <GorillaProvider key={user?.id} side="right">{page}</GorillaProvider>
  }
  return <Suspense fallback={null}>{page}</Suspense>
}
