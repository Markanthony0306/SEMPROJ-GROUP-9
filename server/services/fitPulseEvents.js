import { randomUUID } from 'node:crypto'
import { gorillaEvents } from '../../shared/gorillaEvents.js'

export const isEventStaff = (role) => role === 'admin' || role === 'staff'

// Connections belong to a single running API instance. Emit only after persistence.
export function createFitPulseEvents() {
  const clients = new Set()

  function subscribe(user, response) {
    const client = { user, response }
    clients.add(client)
    response.once('close', () => clients.delete(client))
  }

  function emitEvent({ to }, { type, title, message, target }, id = randomUUID()) {
    const frame = `id: ${id}\ndata: ${JSON.stringify({ type, title, message, target })}\n\n`
    for (const { user, response } of clients) {
      const matches = to === 'admins' ? isEventStaff(user.role) : user.id === to?.userId
      if (matches && !response.writableEnded && !response.destroyed && !response.write(frame)) {
        // A stalled client can reconnect without buffering alerts indefinitely.
        response.destroy()
      }
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
