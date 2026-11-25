const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3001/api')

// Resolve EventSource against the same API host as the authenticated ticket request.
export const apiUrl = (path) => `${API_URL.replace(/\/$/, '')}${path}`

function buildHeaders(options = {}) {
  const headers = { ...(options.headers || {}) }
  // The browser adds the boundary required to read multipart uploads.
  if (!(options.body instanceof FormData)) headers['Content-Type'] ??= 'application/json'
  if (options.token) headers.Authorization = `Bearer ${options.token}`
  return headers
}

export async function apiResponse(path, options = {}) {
  const { token, ...requestOptions } = options
  let response
  try {
    response = await fetch(apiUrl(path), {
      ...requestOptions,
      headers: buildHeaders(options)
    })
  } catch (cause) {
    const error = new Error('Could not reach the FitPulse server. Is it running?')
    error.kind = 'network'
    error.cause = cause
    throw error
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    const error = new Error(payload.message || `Request failed (${response.status}).`)
    error.status = response.status
    error.code = payload.code
    error.field = payload.field
    error.remainingAttempts = payload.remainingAttempts
    error.retryAfterSeconds = payload.retryAfterSeconds
    error.rejectedAttempts = payload.rejectedAttempts
    throw error
  }
  return response
}

export async function apiRequest(path, options = {}) {
  const response = await apiResponse(path, options)
  if (response.status === 204) return {}
  try {
    return await response.json()
  } catch (cause) {
    throw new Error('FitPulse received an invalid API response. Check the server address and try again.', { cause })
  }
}
