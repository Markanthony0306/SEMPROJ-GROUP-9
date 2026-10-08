import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'fitpulse-theme'

function getInitialDark() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') return saved === 'dark'
  } catch {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

// Shared theme state keeps the supplied clay switch in sync across FitPulse.
export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(getInitialDark)

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    try {
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
    } catch {}
  }, [dark])

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark((value) => !value) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
