// Supabase Auth requires at least six characters.
export const MIN_PASSWORD_LENGTH = 6
export const MAX_PASSWORD_LENGTH = 10

export const passwordPolicyMessage =
  'Password must be 6–10 characters, with at least one capital letter (A-Z) and one number (0-9).'

export function passwordPolicy(password) {
  return (
    typeof password === 'string' &&
    password.length >= MIN_PASSWORD_LENGTH &&
    password.length <= MAX_PASSWORD_LENGTH &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  )
}
