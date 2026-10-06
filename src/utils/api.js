const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function buildHeaders(options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (options.token) headers.Authorization = `Bearer ${options.token}`
  return headers
}

export async function apiRequest(path, options = {}) {
  const { token, ...requestOptions } = options
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...requestOptions,
      headers: buildHeaders(options)
    })
  } catch (cause) {
    const error = new Error('Could not reach the FitPulse server. Is it running?')
    error.kind = 'network'
    error.cause = cause
    throw error
  }
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || `Request failed (${response.status}).`)
  return payload
}
