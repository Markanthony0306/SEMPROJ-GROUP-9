import jwt from 'jsonwebtoken'

export function createSessionAuth({ jwtSecret, loadAccount, membershipStatus }) {
  function createSession(account) {
    const user = {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      plan: account.plan,
      status: membershipStatus(account),
      phone: account.phone,
      joined: account.joined,
      avatarId: account.avatarId,
      membershipStart: account.membershipStart,
      membershipEnd: account.membershipEnd,
      mustChangePassword: Boolean(account.mustChangePassword)
    }
    return {
      user,
      role: user.role,
      token: jwt.sign({ ...user, authVersion: account.authVersion || 0 }, jwtSecret, {
        expiresIn: '8h',
        algorithm: 'HS256'
      })
    }
  }

  async function authenticate(req, res, next) {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
    if (!token) return res.status(401).json({ message: 'Authentication is required.' })
    let claims
    try {
      claims = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] })
      if (claims.purpose || typeof claims.id !== 'string') throw new Error('Invalid session claims')
    } catch {
      return res.status(401).json({ message: 'Your session is invalid or has expired.' })
    }
    try {
      const account = await loadAccount(claims.id)
      if (!account || account.status !== 'active' || (claims.authVersion || 0) !== (account.authVersion || 0))
        return res.status(401).json({ message: 'Your session has expired. Please log in again.' })
      const passwordChangeAllowed =
        (req.method === 'GET' && req.path === '/api/me') ||
        (req.method === 'POST' && req.path === '/api/profile/change-password')
      if (account.mustChangePassword && !passwordChangeAllowed)
        return res.status(403).json({ code: 'PASSWORD_CHANGE_REQUIRED', message: 'Change your temporary password first.' })
      req.user = { ...claims, role: account.role }
      return next()
    } catch (error) {
      console.error('Supabase session lookup failed:', error.message)
      return res.status(503).json({ message: 'Account service is temporarily unavailable.' })
    }
  }

  function requireRole(...roles) {
    return (req, res, next) =>
      roles.includes(req.user.role)
        ? next()
        : res.status(403).json({ message: 'You do not have permission for this resource.' })
  }

  // Simple in-memory rate limiter. Restarting the server clears the counters, which
  // is acceptable for this project's scale.
  const rateBuckets = new Map()
  function rateLimit({ windowMs = 15 * 60 * 1000, max = 10 } = {}) {
    return (req, res, next) => {
      const key = `${req.ip}:${req.method}:${req.baseUrl}${req.route?.path || req.path}`
      const now = Date.now()
      const bucket = rateBuckets.get(key) || { count: 0, resetAt: now + windowMs }
      if (now > bucket.resetAt) {
        bucket.count = 0
        bucket.resetAt = now + windowMs
      }
      bucket.count += 1
      rateBuckets.set(key, bucket)
      if (rateBuckets.size > 10_000) rateBuckets.clear()
      if (bucket.count > max)
        return res
          .status(429)
          .json({ message: 'Too many attempts. Please try again in a few minutes.' })
      next()
    }
  }

  return { createSession, authenticate, requireRole, rateLimit }
}
