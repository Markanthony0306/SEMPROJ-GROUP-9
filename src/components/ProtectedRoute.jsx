import { useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'

// Redirect guests to login and members away from staff-only pages.
export default function ProtectedRoute({ roles, navigate, children }) {
  const { user, role } = useAuth()
  const destination = !user ? 'login' : roles && !roles.includes(role) ? ['user', 'member'].includes(role) ? 'user' : 'login' : null
  useEffect(() => { if (destination) navigate(destination) }, [destination, navigate])
  return destination ? null : children
}
