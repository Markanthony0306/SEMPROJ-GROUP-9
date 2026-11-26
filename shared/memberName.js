export function normalizeNamePart(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
}

export function composeMemberName(firstName, lastName) {
  return [normalizeNamePart(firstName), normalizeNamePart(lastName)].filter(Boolean).join(' ')
}
