import crypto from 'node:crypto'

const challengeTtl = 20 * 60 * 1000
const digestPattern = /^[a-f0-9]{64}$/
const sessionIdPattern = /^vs_[A-Za-z0-9_]{1,150}$/

function identityError(message, status = 503, code = 'ADMIN_IDENTITY_UNAVAILABLE') {
  return Object.assign(new Error(message), { status, code })
}

function invalidChallenge() {
  return identityError(
    'This verification request is invalid or expired. Sign in again.',
    401,
    'ADMIN_IDENTITY_CHALLENGE_INVALID'
  )
}

const hash = (value) => crypto.createHash('sha256').update(value).digest('hex')
const normalizedEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '')

function matchingHashes(left, right) {
  return (
    typeof left === 'string' &&
    typeof right === 'string' &&
    digestPattern.test(left) &&
    digestPattern.test(right) &&
    crypto.timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'))
  )
}

// Keep this binding independent of browser input and Stripe profile information.
export function accountIdentityFingerprint(account) {
  const version = account?.authVersion ?? 0
  if (
    !account ||
    typeof account.id !== 'string' ||
    !account.id ||
    !normalizedEmail(account.email) ||
    typeof account.role !== 'string' ||
    !account.role ||
    typeof account.passwordHash !== 'string' ||
    !account.passwordHash ||
    !Number.isSafeInteger(version) ||
    version < 0
  )
    throw invalidChallenge()
  return hash(
    JSON.stringify([
      account.id,
      normalizedEmail(account.email),
      account.role,
      version,
      account.passwordHash
    ])
  )
}

export function hashIdentityChallenge(token) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw invalidChallenge()
  return hash(token)
}

// Normalize spelling accents, casing, and whitespace without dropping punctuation
// or matching only part of a legal name.
function normalizedName(value) {
  if (typeof value !== 'string' || value.length > 200) return ''
  return value
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function verificationUrl(value) {
  try {
    const url = new URL(value)
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'verify.stripe.com' ||
      url.port ||
      url.username ||
      url.password ||
      url.hash
    )
      return null
    return url.href
  } catch {
    return null
  }
}

// The SDK is injected so tests cannot use credentials or contact a live provider.
// Callers persist the returned record and consume it atomically after verification.
export function createAdminIdentityService({
  stripe,
  production = false,
  returnUrl,
  expectedNames = {},
  now = Date.now
} = {}) {
  function configuredNames(account) {
    const email = normalizedEmail(account?.email)
    const names =
      expectedNames && typeof expectedNames === 'object' && !Array.isArray(expectedNames)
        ? Object.entries(expectedNames).find(([key]) => normalizedEmail(key) === email)?.[1]
        : null
    const firstName = normalizedName(names?.first_name)
    const lastName = normalizedName(names?.last_name)
    if (!firstName || !lastName)
      throw identityError('Administrator identity verification is not configured. Contact the gym.')
    return { firstName, lastName, fingerprint: hash(JSON.stringify([firstName, lastName])) }
  }

  function requireConfiguration(account) {
    if (
      typeof stripe?.identity?.verificationSessions?.create !== 'function' ||
      typeof stripe?.identity?.verificationSessions?.retrieve !== 'function' ||
      typeof now !== 'function'
    )
      throw identityError(
        'Administrator identity verification is unavailable. Please try again later.'
      )
    let destination
    try {
      destination = new URL(returnUrl)
    } catch {
      throw identityError('Administrator identity verification is not configured. Contact the gym.')
    }
    if (
      !['http:', 'https:'].includes(destination.protocol) ||
      (production && destination.protocol !== 'https:') ||
      destination.username ||
      destination.password ||
      destination.hash
    )
      throw identityError('Administrator identity verification is not configured. Contact the gym.')
    if (account?.role !== 'admin') throw invalidChallenge()
    return configuredNames(account)
  }

  function currentTime() {
    if (typeof now !== 'function')
      throw identityError(
        'Administrator identity verification is unavailable. Please try again later.'
      )
    const value = now()
    if (!Number.isSafeInteger(value) || value < 0)
      throw identityError(
        'Administrator identity verification is unavailable. Please try again later.'
      )
    return value
  }

  function checkSession(session, record) {
    if (
      !session ||
      session.object !== 'identity.verification_session' ||
      !sessionIdPattern.test(session.id || '') ||
      session.type !== 'document' ||
      session.options?.document?.require_matching_selfie !== true ||
      session.options?.document?.require_live_capture !== true ||
      typeof session.livemode !== 'boolean' ||
      (production && !session.livemode) ||
      !['requires_input', 'processing', 'verified', 'canceled'].includes(session.status) ||
      session.redaction != null
    )
      throw identityError(
        'The identity provider could not confirm this verification. Sign in again.'
      )
    if (
      (record.verificationSessionId && session.id !== record.verificationSessionId) ||
      session.metadata?.fitpulse_account_id !== record.accountId ||
      !matchingHashes(session.metadata?.fitpulse_challenge_hash, record.tokenHash)
    )
      throw invalidChallenge()
  }

  async function start(account) {
    const names = requireConfiguration(account)
    const challengeToken = crypto.randomBytes(32).toString('base64url')
    const record = {
      tokenHash: hashIdentityChallenge(challengeToken),
      accountId: account.id,
      accountFingerprint: accountIdentityFingerprint(account),
      expectedNameFingerprint: names.fingerprint,
      expiresAt: currentTime() + challengeTtl
    }
    let session
    try {
      session = await stripe.identity.verificationSessions.create({
        type: 'document',
        options: {
          document: { require_matching_selfie: true, require_live_capture: true }
        },
        metadata: {
          fitpulse_account_id: record.accountId,
          fitpulse_challenge_hash: record.tokenHash
        },
        return_url: returnUrl
      })
    } catch {
      // Provider errors can contain keys, document data, or request details.
      throw identityError(
        'Administrator identity verification is unavailable. Please try again later.'
      )
    }
    checkSession(session, record)
    const url = verificationUrl(session.url)
    if (session.status !== 'requires_input' || !url)
      throw identityError(
        'The identity provider could not start verification. Please try again later.'
      )
    record.verificationSessionId = session.id
    return {
      response: {
        verificationRequired: true,
        challengeToken,
        verificationUrl: url,
        expiresAt: new Date(record.expiresAt).toISOString()
      },
      record
    }
  }

  async function complete(challenge, account) {
    if (
      !challenge ||
      !Number.isSafeInteger(challenge.expiresAt) ||
      challenge.expiresAt <= currentTime() ||
      challenge.accountId !== account?.id ||
      !sessionIdPattern.test(challenge.verificationSessionId || '') ||
      !matchingHashes(hashIdentityChallenge(challenge.challengeToken), challenge.tokenHash) ||
      !matchingHashes(accountIdentityFingerprint(account), challenge.accountFingerprint)
    )
      throw invalidChallenge()
    const names = requireConfiguration(account)
    if (!matchingHashes(names.fingerprint, challenge.expectedNameFingerprint))
      throw invalidChallenge()
    let session
    try {
      session = await stripe.identity.verificationSessions.retrieve(
        challenge.verificationSessionId,
        {
          expand: ['verified_outputs']
        }
      )
    } catch {
      throw identityError(
        'Administrator identity verification is unavailable. Please try again later.'
      )
    }
    if (
      challenge.expiresAt <= currentTime() ||
      !matchingHashes(accountIdentityFingerprint(account), challenge.accountFingerprint) ||
      !matchingHashes(configuredNames(account).fingerprint, challenge.expectedNameFingerprint)
    )
      throw invalidChallenge()
    checkSession(session, challenge)
    if (session.status === 'processing') return { status: 'processing' }
    if (session.status === 'requires_input') {
      const url = verificationUrl(session.url)
      if (!url)
        throw identityError('The identity provider could not continue verification. Sign in again.')
      return { status: 'requires_input', verificationUrl: url }
    }
    if (session.status !== 'verified')
      throw identityError(
        'Identity verification was not completed. Sign in again to retry.',
        403,
        'ADMIN_IDENTITY_FAILED'
      )
    const firstName = normalizedName(session.verified_outputs?.first_name)
    const lastName = normalizedName(session.verified_outputs?.last_name)
    if (!firstName || !lastName)
      throw identityError('The identity provider could not confirm the legal name. Sign in again.')
    if (firstName !== names.firstName || lastName !== names.lastName)
      throw identityError(
        'The ID name does not match this administrator account. Contact the gym.',
        403,
        'ADMIN_IDENTITY_MISMATCH'
      )
    return {
      status: 'verified',
      verification: {
        provider: 'stripe',
        sessionId: session.id,
        verifiedAt: new Date(currentTime()).toISOString()
      }
    }
  }

  return { start, complete }
}
