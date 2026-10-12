import { useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'

export default function ProtectedRoute({ roles, navigate, children }) {
  const { role } = useAuth()
  const allowed = role && roles.includes(role)
  useEffect(() => { if (!allowed) navigate('login') }, [allowed, navigate])
  return allowed ? children : null
}
