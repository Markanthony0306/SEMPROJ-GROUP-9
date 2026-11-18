// Keep diagnostics useful without printing URLs, headers, or provider payloads.
const connectionCodes = [
  'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT',
  'EACCES', 'ENETUNREACH', 'EHOSTUNREACH', 'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_SOCKET', 'CERT_HAS_EXPIRED', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'DEPTH_ZERO_SELF_SIGNED_CERT', 'ABORT_ERR'
]

export function networkErrorCode(error) {
  if (!error || typeof error !== 'object') return ''
  if (connectionCodes.includes(error.code)) return error.code
  if (error.name === 'TimeoutError') return 'ETIMEDOUT'
  const nested = networkErrorCode(error.cause)
  if (nested) return nested
  for (const cause of error.errors || []) {
    const code = networkErrorCode(cause)
    if (code) return code
  }
  // PostgREST places the fetch cause in details rather than error.code.
  const details = typeof error.details === 'string' ? error.details : ''
  return connectionCodes.find((code) => new RegExp(`\\b${code}\\b`).test(details)) || ''
}
