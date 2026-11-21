export const MIN_PASSWORD_LENGTH = 12
export const MAX_PASSWORD_LENGTH = 16

export const passwordPolicyMessage =
  'Use 12–16 characters with an uppercase letter, a lowercase letter, a number, and a symbol.'

export function passwordPolicy(password) {
  return (
    typeof password === 'string' &&
    password.length >= MIN_PASSWORD_LENGTH &&
    password.length <= MAX_PASSWORD_LENGTH &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[\p{P}\p{S}]/u.test(password)
  )
}
