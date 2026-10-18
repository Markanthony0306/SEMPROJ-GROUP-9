export class PasswordAuthenticationError extends Error {
  constructor(message, status, code, cause) {
    super(message, { cause })
    this.name = 'PasswordAuthenticationError'
    this.status = status
    this.code = code
  }
}

export function passwordAuthenticationError(error) {
  if (error?.code === 'invalid_credentials')
    return new PasswordAuthenticationError(
      'Invalid email or password.',
      401,
      'INVALID_CREDENTIALS',
      error
    )
  if (error?.status === 429 || error?.code === 'over_request_rate_limit')
    return new PasswordAuthenticationError(
      'Too many sign-in attempts. Please wait a few minutes and try again.',
      429,
      'AUTH_RATE_LIMIT',
      error
    )
  if (error?.code === 'email_not_confirmed')
    return new PasswordAuthenticationError(
      'Confirm your account email before signing in. Contact the gym administrator if you need help.',
      403,
      'EMAIL_NOT_CONFIRMED',
      error
    )
  if (error?.code === 'user_banned')
    return new PasswordAuthenticationError(
      'Your account is unavailable. Please contact the gym administrator.',
      403,
      'ACCOUNT_UNAVAILABLE',
      error
    )
  if (error?.code === 'captcha_failed')
    return new PasswordAuthenticationError(
      'Sign-in verification could not be completed. Please contact the gym administrator.',
      403,
      'AUTH_VERIFICATION_REQUIRED',
      error
    )
  // Key problems, network errors, invalid token responses, and provider failures
  // do not mean that the person entered the wrong password.
  return new PasswordAuthenticationError(
    'The sign-in service is temporarily unavailable. Please try again shortly.',
    503,
    'AUTH_UNAVAILABLE',
    error
  )
}

export async function authenticatePassword({ createAuthClient, email, password }) {
  let result
  try {
    result = await createAuthClient().auth.signInWithPassword({ email, password })
  } catch (error) {
    throw passwordAuthenticationError(error)
  }
  if (result?.error) throw passwordAuthenticationError(result.error)
  if (!result?.data?.user?.id) throw passwordAuthenticationError()
  return result.data.user
}
