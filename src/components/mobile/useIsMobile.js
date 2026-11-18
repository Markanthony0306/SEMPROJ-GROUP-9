import { useSyncExternalStore } from 'react'

// React and CSS share the exact same breakpoint, including 768px.
const query = '(max-width: 768px)'

function subscribe(onChange) {
  const media = window.matchMedia(query)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

export default function useIsMobile() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  )
}
