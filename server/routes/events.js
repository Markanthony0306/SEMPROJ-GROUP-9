import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { isEventStaff } from '../services/fitPulseEvents.js'

const AUDIENCE = 'fitpulse-events'
const TICKET_SECONDS = 90
const STREAM_MS = 5 * 60_000
const allowed = (role) => isEventStaff(role) || role === 'user' || role === 'member'

export function eventRoutes({
  authenticate,
  authenticateEventStream,
  events,
  jwtSecret,
  supabase
}) {
  const router = Router()

  // Native EventSource cannot attach the existing Authorization header.
  router.post('/events/ticket', authenticate, (req, res) => {
    const { id, role, authVersion, faceVerified, exp } = req.user
    if (!allowed(role)) return res.sendStatus(403)
    const expiresAt = Math.min(exp, Math.floor(Date.now() / 1000) + TICKET_SECONDS)
    const ticket = jwt.sign(
      { id, role, authVersion, faceVerified, exp: expiresAt, sessionExp: exp, purpose: AUDIENCE },
      jwtSecret,
      { algorithm: 'HS256', audience: AUDIENCE }
    )
    res.set('Cache-Control', 'no-store').json({ ticket, expiresAt: expiresAt * 1000 })
  })

  router.get('/events', authenticateEventStream, (req, res) => {
    if (!allowed(req.user.role)) return res.sendStatus(403)
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    })
    res.flushHeaders()
    res.write(': connected\n\n')
    events.subscribe(req.user, res)
    const heartbeat = setInterval(() => {
      if (!res.write(': ping\n\n')) res.destroy()
    }, 25_000)
    const deadline = setTimeout(
      () => res.end(),
      Math.min(STREAM_MS, req.user.sessionExp * 1000 - Date.now())
    )
    res.once('close', () => {
      clearInterval(heartbeat)
      clearTimeout(deadline)
    })
  })

  // Read only confirmed mail deliveries. Apply ownership before querying with the server key.
  router.get('/events/reminders', authenticate, async (req, res, next) => {
    if (!allowed(req.user.role)) return res.sendStatus(403)
    const staff = isEventStaff(req.user.role)
    let query = supabase
      .from('membership_reminders')
      .select('subscription_id,membership_end,reminder_type,sent_at,subscriptions!inner(user_id)')
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(100)
    if (!staff) query = query.eq('subscriptions.user_id', req.user.id)
    const { data, error } = await query
    if (error) return next(error)
    return res.set('Cache-Control', 'no-store').json({
      reminders: (data || []).map((row) => ({
        id: `${row.subscription_id}:${row.membership_end}:${row.reminder_type}`,
        ...(staff && { memberId: row.subscriptions.user_id }),
        type: row.reminder_type,
        date: row.sent_at
      }))
    })
  })

  return router
}
