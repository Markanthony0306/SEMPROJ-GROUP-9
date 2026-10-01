import { useAuth } from '../auth/AuthContext'
import { useEffect } from 'react'

export default function ProtectedRoute({ roles, navigate, children }) {
  const { user, role } = useAuth()
  const destination = !user
    ? 'login'
    : roles && !roles.includes(role)
      ? role === 'user'
        ? 'user'
        : 'login'
      : null

  useEffect(() => {
    if (destination) navigate(destination)
  }, [destination, navigate])

  if (destination) {
    return null
  }
  return children
}
