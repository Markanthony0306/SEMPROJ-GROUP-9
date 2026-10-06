import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const SESSION_KEY = 'fitpulse-session'

function readSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    return session && typeof session === 'object' ? session : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)
  const login = (nextSession) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
  }
  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
  }
  const value = useMemo(
    () => ({
      session,
      user: session?.user || session,
      role: session?.role || session?.user?.role,
      token: session?.token,
      login,
      logout
    }),
    [session]
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
