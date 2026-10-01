const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.message || 'Request failed.')
  return payload
}
