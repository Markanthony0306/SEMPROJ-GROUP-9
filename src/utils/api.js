const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function buildHeaders(options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (options.token) headers.Authorization = `Bearer ${options.token}`
  return headers
}

export async function apiResponse(path, options = {}) {
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
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    const error = new Error(payload.message || `Request failed (${response.status}).`)
    error.status = response.status
    throw error
  }
  return response
}

export async function apiRequest(path, options = {}) {
  const response = await apiResponse(path, options)
  return response.json().catch(() => ({}))
}
