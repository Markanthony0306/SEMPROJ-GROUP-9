import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from 'react'
import { gorillaEvents, gorillaTitles } from '../../../shared/gorillaEvents'
import { apiRequest, apiUrl } from '../../utils/api'
import { useAuth } from '../../auth/AuthContext'
import GorillaArt from './GorillaArt'
import './gorilla.css'

export { gorillaEvents }

const GorillaContext = createContext(null)
const SIZE = 84
const MARGIN = 8
const GAP = 10
const STORAGE_KEY = 'fitpulse-rocky-position'
const TYPES = { info: 'i', success: '✓', warning: '!', error: '×' }
const DESTINATIONS = {
  [gorillaTitles.memberCreated]: 'Members',
  [gorillaTitles.payment]: 'Payments',
  [gorillaTitles.qrCheckIn]: 'Attendance',
  [gorillaTitles.expiring]: 'Notifications',
  [gorillaTitles.expired]: 'Notifications',
  [gorillaTitles.equipmentBroken]: 'Equipment',
  [gorillaTitles.equipmentAdded]: 'Equipment',
  [gorillaTitles.equipmentUpdated]: 'Equipment'
}
const ALERT_SECTIONS = new Set(Object.values(DESTINATIONS))
const timeFormat = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
})

export function useGorilla() {
  return useContext(GorillaContext)
}

function readPosition() {
  try {
    const position = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (Number.isFinite(position?.x) && Number.isFinite(position?.y)) return position
  } catch {
    // The assistant still works when storage is disabled.
  }
  return null
}

function viewport() {
  return {
    width: document.documentElement.clientWidth,
    height: window.innerHeight,
    bar: document.querySelector('.fitpulse-bottom-nav')?.getBoundingClientRect(),
    raised: document.querySelector('.fitpulse-nav-primary-icon')?.getBoundingClientRect()
  }
}

const clamp = (value, min, max) => Math.max(min, Math.min(value, max))

function constrain(position, view) {
  const x = clamp(position.x, MARGIN, view.width - SIZE - MARGIN)
  const overlapsCenter =
    view.raised && x < view.raised.right + MARGIN && x + SIZE > view.raised.left - MARGIN
  const bottom = overlapsCenter ? view.raised.top : (view.bar?.top ?? view.height)
  return { x, y: clamp(position.y, MARGIN, bottom - SIZE - MARGIN) }
}

function bubblePosition(position, view) {
  const width = Math.min(340, view.width - 32)
  const x = clamp(
    position.x + SIZE / 2 < view.width / 2 ? position.x : position.x + SIZE - width,
    16,
    view.width - width - 16
  )
  const above = position.y - 16 - GAP
  const below = (view.bar?.top ?? view.height) - position.y - SIZE - GAP - 8
  const bottom = below > above
  // In short landscape windows move beside Rocky if the list has more room there.
  const leftSpace = position.x - 16 - GAP
  const rightSpace = view.width - position.x - SIZE - GAP - 16
  if (Math.max(above, below) < 155 && Math.max(leftSpace, rightSpace) >= 158) {
    const right = rightSpace >= leftSpace
    return {
      className: right ? 'rocky-beside-right' : 'rocky-beside-left',
      style: {
        top: 8 - position.y,
        left: right ? SIZE + GAP : undefined,
        right: right ? undefined : SIZE + GAP,
        width: Math.min(width, Math.max(leftSpace, rightSpace)),
        maxHeight: (view.bar?.top ?? view.height) - 16,
        '--rocky-origin': `${right ? 'left' : 'right'} ${position.y - 8 + SIZE / 2}px`
      }
    }
  }
  return {
    className: bottom ? 'rocky-below' : 'rocky-above',
    style: {
      top: bottom ? SIZE + GAP : undefined,
      bottom: bottom ? undefined : SIZE + GAP,
      left: x - position.x,
      width,
      maxHeight: Math.max(48, bottom ? below : above),
      '--rocky-origin': `${position.x + SIZE / 2 - x}px ${bottom ? 'top' : 'bottom'}`
    }
  }
}

function useEventStream(eventsUrl, notify) {
  const { token } = useAuth()
  useEffect(() => {
    if (!token || !eventsUrl || typeof EventSource === 'undefined') return
    const controller = new AbortController()
    let retry
    let source
    const path = eventsUrl.replace(/^\/api(?=\/)/, '')
    const connect = async () => {
      try {
        const { ticket, expiresAt } = await apiRequest(`${path}/ticket`, {
          method: 'POST',
          token,
          signal: controller.signal
        })
        if (controller.signal.aborted) return
        const url = new URL(apiUrl(path), window.location.origin)
        url.searchParams.set('ticket', ticket)
        source = new EventSource(url.href)
        source.onmessage = (event) => {
          try {
            const { type, title, message, target } = JSON.parse(event.data)
            if (
              typeof title === 'string' &&
              typeof message === 'string' &&
              Object.hasOwn(TYPES, type)
            )
              notify({ type, title, message, target }, event.lastEventId)
          } catch {
            // The next valid event can still be displayed.
          }
        }
        source.onerror = () => {
          // Allow native retries while the ticket can still authenticate.
          if (source.readyState !== EventSource.CLOSED && Date.now() < expiresAt) return
          source.close()
          retry = window.setTimeout(connect, 1200)
        }
      } catch (error) {
        if (!controller.signal.aborted && ![401, 403, 404].includes(error.status))
          retry = window.setTimeout(connect, 5000)
      }
    }
    void connect()
    return () => {
      controller.abort()
      window.clearTimeout(retry)
      source?.close()
    }
  }, [eventsUrl, notify, token])
}

export function GorillaProvider({ side = 'right', eventsUrl = '/api/events', children }) {
  const [alerts, setAlerts] = useState([])
  const [unread, setUnread] = useState(0)
  const [mode, setMode] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [stored, setStored] = useState(readPosition)
  const [view, setView] = useState(viewport)
  const [focused, setFocused] = useState(false)
  const root = useRef(null)
  const trigger = useRef(null)
  const drag = useRef(null)
  const ignoreClick = useRef(false)
  const pendingAuto = useRef(null)
  const autoTimer = useRef(null)
  const hoverTimer = useRef(null)
  const seen = useRef(new Set())
  const nextLocalId = useRef(0)
  const navigate = useRef(null)
  const bubbleId = useId()
  const latestEvent = alerts[0]
  const position = constrain(
    stored ?? {
      x: side === 'left' ? 16 : view.width - SIZE - 16,
      y: (view.bar?.top ?? view.height) - SIZE - 16
    },
    view
  )

  const registerNavigation = useCallback((handler) => {
    navigate.current = handler
    return () => {
      if (navigate.current === handler) navigate.current = null
    }
  }, [])

  const notify = useCallback((alert, eventId) => {
    const id = eventId || `rocky-local-${++nextLocalId.current}`
    if (seen.current.has(id)) return
    seen.current.add(id)
    if (seen.current.size > 64) seen.current.delete(seen.current.values().next().value)
    const item = { ...alert, id, receivedAt: new Date() }
    setAlerts((previous) => [item, ...previous].slice(0, 8))
    pendingAuto.current = item
    setUnread((previous) => previous + 1)
  }, [])

  useEventStream(eventsUrl, notify)

  useEffect(() => {
    const read = () => setView(viewport())
    const observer = new ResizeObserver(read)
    observer.observe(document.documentElement)
    const bar = document.querySelector('.fitpulse-bottom-nav')
    if (bar) observer.observe(bar)
    const mobile = window.matchMedia('(max-width: 768px)')
    const frame = () => window.requestAnimationFrame(read)
    const initial = frame()
    mobile.addEventListener('change', frame)
    window.addEventListener('resize', read)
    return () => {
      window.cancelAnimationFrame(initial)
      mobile.removeEventListener('change', frame)
      window.removeEventListener('resize', read)
      observer.disconnect()
    }
  }, [view.bar != null])

  useEffect(() => {
    const read = () => {
      const open = Boolean(document.querySelector('dialog.experience-modal[open]'))
      setSheetOpen(open)
      if (open) setMode('')
    }
    read()
    window.addEventListener('fitpulse:dialog-change', read)
    return () => window.removeEventListener('fitpulse:dialog-change', read)
  }, [])

  useEffect(() => {
    if (dragging || sheetOpen) return
    if (mode === 'hover' || mode === 'list') {
      setUnread(0)
      pendingAuto.current = null
      return
    }
    if (!pendingAuto.current) return
    const { duration } = pendingAuto.current
    pendingAuto.current = null
    window.clearTimeout(autoTimer.current)
    setMode('auto')
    autoTimer.current = window.setTimeout(
      () => setMode((current) => (current === 'auto' ? '' : current)),
      Number.isFinite(duration) ? Math.max(0, duration) : 7000
    )
  }, [latestEvent, mode, dragging, sheetOpen])

  useEffect(
    () => () => {
      window.clearTimeout(autoTimer.current)
      window.clearTimeout(hoverTimer.current)
    },
    []
  )

  const close = useCallback(() => {
    pendingAuto.current = null
    setMode('')
  }, [])

  useEffect(() => {
    if (!mode || sheetOpen) return
    const outside = (event) => {
      if (!root.current?.contains(event.target)) close()
    }
    const onKey = (event) => {
      if (event.key === 'Escape' && !sheetOpen) {
        if (root.current?.contains(document.activeElement)) trigger.current?.focus()
        close()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', onKey)
    }
  }, [mode, close, sheetOpen])

  function startDrag(event) {
    if (!event.isPrimary || event.button !== 0) return
    ignoreClick.current = false
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      position,
      moved: false
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveDrag(event) {
    const start = drag.current
    if (!start || start.id !== event.pointerId) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!start.moved && Math.hypot(dx, dy) < 6) return
    if (!start.moved) {
      start.moved = true
      setMode('')
      setDragging(true)
    }
    start.last = constrain({ x: start.position.x + dx, y: start.position.y + dy }, view)
    setStored(start.last)
  }

  function endDrag(event) {
    const start = drag.current
    if (!start || start.id !== event.pointerId) return
    drag.current = null
    if (!start.moved) return
    ignoreClick.current = true
    setDragging(false)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(start.last))
    } catch {
      /* optional */
    }
  }

  function toggle(event) {
    if (ignoreClick.current && event.detail > 0) {
      ignoreClick.current = false
      return
    }
    if (mode === 'list' || (mode === 'hover' && event.detail === 0)) close()
    else setMode('list')
  }

  function hover(event) {
    if (
      event.pointerType !== 'mouse' ||
      drag.current?.moved ||
      window.matchMedia('(max-width: 768px)').matches ||
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches
    )
      return
    window.clearTimeout(hoverTimer.current)
    setMode((current) => (current === 'list' ? current : 'hover'))
  }

  function leave() {
    hoverTimer.current = window.setTimeout(
      () => setMode((current) => (current === 'hover' ? '' : current)),
      250
    )
  }

  const context = useMemo(
    () => ({ notify, latestEvent, registerNavigation }),
    [latestEvent, notify, registerNavigation]
  )
  const bubble = bubblePosition(position, view)
  const shown = Boolean(mode && !dragging && !sheetOpen)

  return (
    <GorillaContext.Provider value={context}>
      {children}
      <div
        ref={root}
        className={`rocky${dragging ? ' is-dragging' : ''}`}
        style={{ left: position.x, top: position.y }}
        hidden={sheetOpen}
        onPointerEnter={hover}
        onPointerLeave={leave}
      >
        <button
          ref={trigger}
          type="button"
          className="rocky-trigger"
          aria-label="Open assistant"
          aria-expanded={shown}
          aria-controls={shown ? bubbleId : undefined}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
          onClick={toggle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          <span
            key={latestEvent?.id}
            className={`rocky-figure${latestEvent ? ` rocky-react rocky-${latestEvent.type}` : ''}`}
          >
            <GorillaArt mood={latestEvent?.type} />
          </span>
          {unread > 0 && (
            <span className="rocky-unread" aria-label={`${unread} unread`}>
              {Math.min(unread, 99)}
              {unread > 99 ? '+' : ''}
            </span>
          )}
        </button>
        {shown && (
          <div id={bubbleId} className={`rocky-bubble ${bubble.className}`} style={bubble.style}>
            <div className="rocky-bubble-header">
              <strong>Rocky</strong>
              <button
                type="button"
                aria-label="Close"
                onClick={() => {
                  if (focused || root.current?.contains(document.activeElement))
                    trigger.current?.focus()
                  close()
                }}
              >
                ×
              </button>
            </div>
            <div className="rocky-list" role="status" aria-live="polite">
              {!alerts.length && (
                <p>
                  Hi, I’m Rocky! I’ll let you know the moment something happens in the system. Drag
                  me anywhere you like!
                </p>
              )}
              {(mode === 'auto' ? alerts.slice(0, 1) : alerts).map((alert) => {
                // Older events carry only a title. New events can identify a specific record.
                const target = ALERT_SECTIONS.has(alert.target?.section)
                  ? alert.target
                  : { section: DESTINATIONS[alert.title] }
                const action =
                  alert.onAction || (target.section && (() => navigate.current?.(target)))
                return (
                  <article className="rocky-alert" key={alert.id}>
                    <span className={`rocky-chip rocky-chip-${alert.type}`} aria-hidden="true">
                      {TYPES[alert.type]}
                    </span>
                    <div>
                      <div className="rocky-alert-heading">
                        <strong>{alert.title}</strong>
                        <time dateTime={alert.receivedAt.toISOString()}>
                          {timeFormat.format(alert.receivedAt)}
                        </time>
                      </div>
                      <p>{alert.message}</p>
                      {action && (
                        <button
                          type="button"
                          className="btn rocky-view"
                          onClick={() => {
                            trigger.current?.focus()
                            close()
                            action()
                          }}
                        >
                          {alert.actionLabel || 'View'}
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </GorillaContext.Provider>
  )
}
