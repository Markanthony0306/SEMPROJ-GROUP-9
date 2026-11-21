const pendingOperations = new Map()

// Renewal and automatic deletion must use the same queue in this API process.
// Multiple API instances require a shared database lock instead.
export function withMemberAccountLock(memberId, operation) {
  const previous = pendingOperations.get(memberId) || Promise.resolve()
  const current = previous.catch(() => {}).then(operation)
  pendingOperations.set(memberId, current)

  return current.finally(() => {
    if (pendingOperations.get(memberId) === current) pendingOperations.delete(memberId)
  })
}
