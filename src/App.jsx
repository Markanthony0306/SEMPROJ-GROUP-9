import { Component, lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useAuth } from './auth/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import HeartRateLoader from './components/HeartRateLoader'
import { apiRequest } from './utils/api'
import Login from './pages/Login'

// Keep the login page in the first bundle. Dashboards and secondary routes load
// only when selected, so they do not delay the initial sign-in screen.
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'))
const AdminStaffPage = lazy(() => import('./pages/AdminStaffPage'))
const UserPage = lazy(() => import('./pages/UserPage'))
const NotFound = lazy(() => import('./pages/NotFound'))
const GorillaProvider = lazy(() =>
  import('./components/gorilla/GorillaAssistant').then(({ GorillaProvider }) => ({ default: GorillaProvider }))
)

const BASE_URL = import.meta.env.BASE_URL || '/'
const HOME_URL = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`
const HOME_PATH = HOME_URL === '/' ? '/' : HOME_URL.slice(0, -1)
const routePaths = new Map([
  ['', 'login'], ['login', 'login'], ['forgot-password', 'forgot-password'],
  ['reset-password', 'reset-password'], ['register', 'register'], ['user', 'user'],
  ['admin', 'admin'], ['not-found', 'not-found']
])

function readRoute() {
  const query = new URLSearchParams(window.location.search)
  if (query.has('route')) return routePaths.get(query.get('route')) || 'not-found'

  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
  if (pathname.endsWith('/reset-password')) return 'reset-password'
  if (pathname.endsWith('/forgot-password')) return 'forgot-password'
  if (pathname === HOME_PATH || pathname === HOME_URL) {
    const historyRoute = window.history.state?.fitpulseRoute
    if (routePaths.has(historyRoute)) return historyRoute
    const saved = sessionStorage.getItem('fitpulse-route')
    return routePaths.has(saved) ? saved : 'login'
  }
  if (!pathname.startsWith(HOME_URL)) return 'not-found'
  const path = pathname.slice(HOME_URL.length).replace(/\/+$/, '')
  return routePaths.get(path) || 'not-found'
}

class RouteErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <main id="login">
          <section className="clay lform login-not-found" role="alert">
            <div className="fhead">
              <h1>Page couldn’t load</h1>
              <p>Refresh the page to try loading it again.</p>
            </div>
            <button className="btn lbtn" type="button" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </section>
        </main>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const { login, logout, user, token, role, memberLoginComplete } = useAuth()
  const [route, setRoute] = useState(readRoute)

  useEffect(() => {
    window.history.replaceState(
      { ...window.history.state, fitpulseRoute: route },
      '',
      window.location.href
    )
    const onPopState = () => {
      const nextRoute = readRoute()
      sessionStorage.setItem('fitpulse-route', nextRoute)
      setRoute(nextRoute)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Re-validate an existing session on startup so an expired or superseded
  // member-terms session cannot leave the user inside a stale dashboard.
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
    const safeRoute = routePaths.has(nextRoute) ? nextRoute : 'not-found'
    window.scrollTo(0, 0)
    const target = safeRoute === 'login'
      ? HOME_URL
      : `${HOME_URL}?route=${encodeURIComponent(safeRoute)}`
    const current = `${window.location.pathname}${window.location.search}`
    if (current !== target) window.history.pushState({ fitpulseRoute: safeRoute }, '', target)
    sessionStorage.setItem('fitpulse-route', safeRoute)
    setRoute(safeRoute)
  }, [])

  const handleLogin = useCallback((session) => {
    const destination = session.user.role === 'admin' ? 'admin' : 'user'
    login(session)
    navigate(destination)
  }, [login, navigate])

  const handleLogout = useCallback(() => {
    logout()
    navigate('login')
  }, [logout, navigate])

  if (token && user?.mustChangePassword && ['user', 'admin', 'register'].includes(route)) {
    return (
      <RouteErrorBoundary key={route}>
        <Suspense fallback={<HeartRateLoader message="Loading password settings" />}>
          <ChangePasswordPage onSignOut={handleLogout} />
        </Suspense>
      </RouteErrorBoundary>
    )
  }

  const pages = {
    login: <Login onLogin={handleLogin} />,
    'forgot-password': <ForgotPassword navigate={navigate} />,
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
    ),
    'not-found': <NotFound navigate={navigate} />
  }

  const page = pages[route] || pages['not-found']
  const dashboard = token && (
    ((route === 'admin' || route === 'register') && role === 'admin') ||
    (route === 'user' && memberLoginComplete && ['user', 'member'].includes(role))
  )

  return (
    <RouteErrorBoundary key={route}>
      <Suspense fallback={<HeartRateLoader message="Loading page" />}>
        {dashboard
          ? <GorillaProvider key={user?.id} side="right" eventsUrl="/api/events">{page}</GorillaProvider>
          : page}
      </Suspense>
    </RouteErrorBoundary>
  )
}
