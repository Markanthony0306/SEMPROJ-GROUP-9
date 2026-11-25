import { useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'

export default function ProtectedRoute({ roles, navigate, children }) {
  const { role, token, memberLoginComplete } = useAuth()
  const allowed = Boolean(token && roles.includes(role) && (role === 'admin' || memberLoginComplete))
  useEffect(() => { if (!allowed) navigate('login') }, [allowed, navigate])
  return allowed ? children : null
}
