import { useTheme } from './useTheme'

// Supplied clay pill switch; a native button supports Space and Enter.
export default function ThemeToggle() {
  const { dark, toggle } = useTheme()

  return (
    <button type="button" className="fp-switch" role="switch" aria-checked={dark} aria-label="Dark mode" onClick={toggle}>
      <svg className="fp-si moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" /></svg>
      <svg className="fp-si sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
    </button>
  )
}
