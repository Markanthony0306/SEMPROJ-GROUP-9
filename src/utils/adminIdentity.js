const CHALLENGE_KEY = 'fitpulse-admin-identity'

function validChallenge(challenge) {
  return (
    challenge &&
    typeof challenge.challengeToken === 'string' &&
    challenge.challengeToken.length > 0 &&
    typeof challenge.expiresAt === 'string' &&
    Number.isFinite(Date.parse(challenge.expiresAt)) &&
    Date.parse(challenge.expiresAt) > Date.now()
  )
}

export function clearAdminIdentityChallenge() {
  try {
    sessionStorage.removeItem(CHALLENGE_KEY)
  } catch {
    // Browsers can disable storage. In-memory state is still cleared by Login.
  }
}

export function readAdminIdentityChallenge() {
  try {
    const challenge = JSON.parse(sessionStorage.getItem(CHALLENGE_KEY) || 'null')
    if (validChallenge(challenge)) {
      return {
        challengeToken: challenge.challengeToken,
        expiresAt: challenge.expiresAt,
        remember: Boolean(challenge.remember)
      }
    }
  } catch {
    // Invalid or unavailable storage must never create a login session.
  }
  clearAdminIdentityChallenge()
  return null
}

export function saveAdminIdentityChallenge(response, remember) {
  if (!validChallenge(response)) {
    throw new Error('The verification request could not be started. Please log in again.')
  }
  const challenge = {
    challengeToken: response.challengeToken,
    expiresAt: response.expiresAt,
    remember: Boolean(remember)
  }
  try {
    sessionStorage.setItem(CHALLENGE_KEY, JSON.stringify(challenge))
  } catch {
    throw new Error('Allow session storage in your browser to continue admin verification.')
  }
  return challenge
}

export function isStripeVerificationUrl(value) {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      url.hostname === 'verify.stripe.com' &&
      !url.port &&
      !url.username &&
      !url.password
    )
  } catch {
    return false
  }
}

export function isLoginSession(response) {
  return (
    response &&
    typeof response.token === 'string' &&
    response.token.length > 0 &&
    response.user &&
    typeof response.user === 'object' &&
    typeof response.user.role === 'string'
  )
}
