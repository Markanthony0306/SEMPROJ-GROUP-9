import { randomUUID } from 'node:crypto'
import { gorillaEvents } from '../../shared/gorillaEvents.js'

export const isEventStaff = (role) => role === 'admin' || role === 'staff'

// Connections belong to a single running API instance. Emit only after persistence.
export function createFitPulseEvents(supabase) {
  const clients = new Set()

  function subscribe(user, response) {
    const client = { user, response }
    clients.add(client)
    response.once('close', () => clients.delete(client))
  }

  function broadcast(to, event, id) {
    const frame = `id: ${id}\ndata: ${JSON.stringify(event)}\n\n`
    for (const { user, response } of clients) {
      const matches = to === 'admins' ? isEventStaff(user.role) : user.id === to?.userId
      if (matches && !response.writableEnded && !response.destroyed && !response.write(frame)) {
        // A stalled client can reconnect without buffering alerts indefinitely.
        response.destroy()
      }
    }
  }

  async function emitEvent({ to }, { type, title, message, target }, id = randomUUID(), durableOnly = false) {
    const event = { type, title, message, target }
    if (!supabase) {
      broadcast(to, event, id)
      return id
    }
    try {
      const { data: receivedAt, error } = await supabase.rpc('insert_rocky_notification', {
        p_id: id, p_staff: to === 'admins', p_user: to?.userId ?? null, p_event: event
      })
      if (error) throw error
      if (receivedAt) broadcast(to, { ...event, receivedAt }, id)
    } catch (error) {
      // Deliver ordinary events live if the inbox is unavailable. Scheduled
      // alerts need a saved deduplication key and can retry on the next tick.
      if (durableOnly) throw error
      console.error('Rocky could not save a notification:', error.code || 'DATABASE_ERROR')
      broadcast(to, event, id)
    }
    return id
  }

  return { subscribe, emitEvent }
}

export function emitPayment(emitEvent, { memberId, memberName, amount, method }) {
  if (!emitEvent) return
  emitEvent({ to: 'admins' }, gorillaEvents.payment(memberName, amount, method))
  emitEvent({ to: { userId: memberId } }, gorillaEvents.payment(null, amount, method))
}
