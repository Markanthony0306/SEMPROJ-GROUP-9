import { apiRequest } from './api'

const inFlight = new Map()

function cacheKey(member) {
  return `fitpulse-member-qr:${member?.id || ''}`
}

function membershipPeriod(member) {
  const start = member?.membershipStart || member?.joined || ''
  const end = member?.membershipEnd || ''
  return `${member?.status || ''}|${start}|${end}`
}

export function readCachedMemberQr(member) {
  if (!member?.id) return null

  try {
    const key = cacheKey(member)
    const cached = JSON.parse(localStorage.getItem(key) || 'null')
    if (
      cached?.period === membershipPeriod(member) &&
      typeof cached.image === 'string' &&
      Number(cached.expiresAt) > Date.now()
    ) {
      return { image: cached.image, expiresAt: Number(cached.expiresAt) }
    }
    if (cached) localStorage.removeItem(key)
  } catch {
    // Storage can be disabled or full; the QR can still be fetched normally.
  }
  return null
}

export function getMemberQr(member, token) {
  const key = cacheKey(member)
  const period = membershipPeriod(member)
  const cached = readCachedMemberQr(member)
  if (cached) return Promise.resolve(cached)

  const requestKey = `${key}:${period}`
  if (inFlight.has(requestKey)) return inFlight.get(requestKey)

  const request = apiRequest('/me/qr', { token })
    .then((result) => {
      if (result?.image && Number(result.expiresAt) > Date.now()) {
        try {
          localStorage.setItem(
            key,
            JSON.stringify({
              period,
              image: result.image,
              expiresAt: Number(result.expiresAt)
            })
          )
        } catch {
          // Caching is optional; the API response still provides the QR.
        }
      }
      return result
    })
    .finally(() => inFlight.delete(requestKey))

  inFlight.set(requestKey, request)
  return request
}
