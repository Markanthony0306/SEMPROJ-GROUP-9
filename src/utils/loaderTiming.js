export const LOADER_DURATION_MS = 1000

// Keep the original deadline when StrictMode cleans up and resumes the effect.
export function createLoaderTimer(
  onComplete,
  { now = () => performance.now(), schedule = setTimeout, cancel = clearTimeout } = {}
) {
  let deadline = null
  let timer = null
  let completed = false

  return {
    start() {
      if (completed || timer !== null) return
      deadline ??= now() + LOADER_DURATION_MS
      timer = schedule(
        () => {
          timer = null
          completed = true
          onComplete()
        },
        Math.max(0, deadline - now())
      )
    },
    stop() {
      if (timer !== null) cancel(timer)
      timer = null
    }
  }
}
