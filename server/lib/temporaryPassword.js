import { randomInt } from 'node:crypto'
import { MAX_PASSWORD_LENGTH } from '../../shared/passwordPolicy.js'

export function generateTemporaryPassword() {
  const groups = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#%+-_']
  const pick = (group) => group[randomInt(group.length)]
  const password = groups.map(pick)
  while (password.length < MAX_PASSWORD_LENGTH) password.push(pick(groups.join('')))
  for (let i = password.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1)
    ;[password[i], password[j]] = [password[j], password[i]]
  }
  return password.join('')
}
