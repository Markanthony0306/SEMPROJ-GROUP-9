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
import { formatDateTime } from '../../../shared/formatDate.js'
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
const GREETING_ID = 'fitpulse-welcome'
const TYPES = { info: 'i', success: '✓', warning: '!', error: '×' }
const DESTINATIONS = {
  [gorillaTitles.memberCreated]: 'Members',
  [gorillaTitles.memberDeleted]: 'Members',
  [gorillaTitles.payment]: 'Payments',
  [gorillaTitles.qrCheckIn]: 'Attendance',
  [gorillaTitles.expiring]: 'Notifications',
  [gorillaTitles.expired]: 'Notifications',
  [gorillaTitles.equipmentBroken]: 'Equipment',
  [gorillaTitles.equipmentAdded]: 'Equipment',
  [gorillaTitles.equipmentUpdated]: 'Equipment'
}
const ALERT_SECTIONS = new Set([...Object.values(DESTINATIONS), 'Membership', 'Reports'])

export function useGorilla() {
  return useContext(GorillaContext)
}

export function RockyNotificationButton({ Icon }) {
  const rocky = useGorilla()
  if (!rocky) return null
  return (
    <button
      ref={rocky.bell}
      type="button"
      className="ib rocky-notification-button"
      aria-label={rocky.unread ? `Notifications, ${rocky.unread} unread` : 'Notifications'}
      aria-expanded={rocky.listOpen}
      aria-controls={rocky.listOpen ? rocky.bubbleId : undefined}
      onClick={rocky.toggleList}
    >
      <Icon name="bell" />
      {rocky.unread > 0 && (
        <span className="rocky-unread" aria-hidden="true">
          {rocky.unread > 99 ? '99+' : rocky.unread}
        </span>
      )}
    </button>
  )
}

export function RockyDeleteError({ message }) {
  const rocky = useGorilla()
  return (
    <div className="form-error rocky-delete-error" role="alert">
      {rocky?.enabled && <GorillaArt mood="angry" />}
      <span>{message}</span>
    </div>
  )
}

export function RockyPreference() {
  const rocky = useGorilla()
  if (!rocky) return null
  return (
    <article className="card clay rocky-preference">
      <h2>Notifications</h2>
      <label className="set rocky-switch" data-rocky-avoid>
        <span>Rocky</span>
        <input
          type="checkbox"
          role="switch"
          checked={rocky.enabled}
          onChange={(event) => rocky.setEnabled(event.target.checked)}
        />
      </label>
      <p>Choose Rocky or plain popups for your notifications.</p>
    </article>
  )
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

function readPreferences(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {}
  } catch {
    return {}
  }
}

function storePreferences(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Notifications still work for this session if browser storage is full or blocked.
  }
}

function viewport() {
  return {
    width: document.documentElement.clientWidth,
    height: window.innerHeight,
    mobile: window.matchMedia('(max-width: 768px)').matches,
    header: document.querySelector('.fitpulse-mobile-header')?.getBoundingClientRect(),
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
  const lastRow = Math.max(MARGIN, bottom - SIZE - MARGIN)
  const firstRow = Math.min(lastRow, (view.header?.bottom ?? 0) + MARGIN)
  return { x, y: clamp(position.y, firstRow, lastRow) }
}

function avoidMobileActions(position, view) {
  const bounded = constrain(position, view)
  if (!view.mobile) return bounded
  const controls = Array.from(document.querySelectorAll(
    '.fitpulse-mobile-scroll :is(button.btn, a.btn, [data-rocky-avoid])'
  ), (control) => control.getBoundingClientRect()).filter((rect) =>
    rect.width > 0 && rect.height > 0 && rect.bottom > (view.header?.bottom ?? 0) &&
    rect.top < (view.bar?.top ?? view.height)
  )
  const overlaps = ({ x, y }) => controls.some((rect) =>
    x < rect.right && x + SIZE > rect.left && y < rect.bottom && y + SIZE > rect.top
  )
  if (!overlaps(bounded)) return bounded

  const choices = controls.flatMap((rect) => [
    { x: rect.left - SIZE - MARGIN, y: bounded.y },
    { x: rect.right + MARGIN, y: bounded.y },
    { x: bounded.x, y: rect.top - SIZE - MARGIN },
    { x: bounded.x, y: rect.bottom + MARGIN }
  ]).map((choice) => constrain(choice, view)).filter((choice) => !overlaps(choice))
  const distance = (choice) => Math.hypot(choice.x - bounded.x, choice.y - bounded.y)
  return choices.sort((a, b) => distance(a) - distance(b))[0] || bounded
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

function useEventStream(eventsUrl, notify, cursor, saveCursor) {
  const { token } = useAuth()
  useEffect(() => {
    if (!token || !eventsUrl) return
    const controller = new AbortController()
    let retry
    let source
    const path = eventsUrl.replace(/^\/api(?=\/)/, '')
    let syncing = false
    async function syncHistory() {
      if (syncing) return
      syncing = true
      try {
        let more
        let after = cursor.current
        do {
          const page = await apiRequest(`${path}/history?after=${after}`, {
            token,
            signal: controller.signal
          })
          if (controller.signal.aborted) return
          for (const alert of page.alerts) notify(alert, alert.id)
          more = page.more && page.next > after
          after = page.next
        } while (more)
        saveCursor(after)
      } catch {
        // The live stream still delivers alerts when history is unavailable.
      } finally {
        syncing = false
      }
    }
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
        source.onopen = syncHistory
        source.onmessage = (event) => {
          try {
            notify(JSON.parse(event.data), event.lastEventId)
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
    if (typeof EventSource !== 'undefined') void connect()
    void syncHistory()
    const historyTimer = window.setInterval(syncHistory, 30_000)
    return () => {
      controller.abort()
      window.clearTimeout(retry)
      window.clearInterval(historyTimer)
      source?.close()
    }
  }, [eventsUrl, notify, token, cursor, saveCursor])
}

export function GorillaProvider({ side = 'right', eventsUrl = '/api/events', children }) {
  const { user } = useAuth()
  const preferenceKey = `fitpulse-rocky:${user?.id}`
  const [inbox, setInbox] = useState(() => readPreferences(preferenceKey))
  const alerts = Array.isArray(inbox.alerts) ? inbox.alerts : []
  const enabled = inbox.enabled !== false
  const greetingKey = `${preferenceKey}:greeted`
  const [greeting, setGreeting] = useState(() => {
    if (!user?.id || !enabled) return null
    try {
      if (sessionStorage.getItem(greetingKey)) return null
    } catch {
      // Rocky can still greet the user when session storage is unavailable.
    }
    return { id: GREETING_ID, message: `Hi, ${user.name?.trim().split(/\s+/)[0] || 'there'}. Welcome to FitPulse!` }
  })
  const [queue, setQueue] = useState([])
  const [latestEvent, setLatestEvent] = useState(null)
  const [mode, setMode] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [stored, setStored] = useState(readPosition)
  const [view, setView] = useState(viewport)
  const [clearOfControls, setClearOfControls] = useState(null)
  const root = useRef(null)
  const trigger = useRef(null)
  const bell = useRef(null)
  const drag = useRef(null)
  const ignoreClick = useRef(false)
  const hoverTimer = useRef(null)
  const seen = useRef(new Set())
  const delivered = useRef(new Set(Array.isArray(inbox.delivered) ? inbox.delivered : []))
  const read = useRef(new Set(Array.isArray(inbox.read) ? inbox.read : []))
  const cursor = useRef(0)
  const navigate = useRef(null)
  const bubbleId = useId()
  const unread = alerts.filter((alert) => !alert.read).length
  const activePopup = (enabled && greeting) || alerts.find((alert) => alert.id === queue[0])
  const desired = constrain(
    stored ?? {
      x: side === 'left' ? 16 : view.width - SIZE - 16,
      y: (view.bar?.top ?? view.height) - SIZE - 16
    },
    view
  )
  const position = !dragging && clearOfControls ? constrain(clearOfControls, view) : desired

  const registerNavigation = useCallback((handler) => {
    navigate.current = handler
    return () => {
      if (navigate.current === handler) navigate.current = null
    }
  }, [])

  const notify = useCallback((alert, eventId) => {
    if (
      !alert ||
      !Object.hasOwn(TYPES, alert.type) ||
      typeof alert.title !== 'string' ||
      typeof alert.message !== 'string'
    )
      return
    const id = typeof eventId === 'string' && eventId
      ? eventId
      : Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-')
    if (seen.current.has(id)) return
    seen.current.add(id)
    const receivedAt = Number.isFinite(Date.parse(alert.receivedAt))
      ? new Date(alert.receivedAt).toISOString()
      : new Date().toISOString()
    const item = { ...alert, id, receivedAt, read: read.current.has(id) }
    setInbox((previous) => ({
      ...previous,
      alerts: [item, ...(previous.alerts || [])].sort((a, b) =>
        b.receivedAt.localeCompare(a.receivedAt)
      )
    }))
    if (!delivered.current.has(id)) {
      setQueue((previous) => [...previous, id])
      setLatestEvent(item)
    }
  }, [])

  const saveCursor = useCallback((next) => {
    if (!Number.isSafeInteger(next) || next <= cursor.current) return
    cursor.current = next
  }, [])

  useEventStream(eventsUrl, notify, cursor, saveCursor)
  useEffect(() => {
    // The account-scoped API keeps alert text and member names. Browser storage
    // holds only the mascot preference and IDs used for read and popup state.
    storePreferences(preferenceKey, {
      enabled,
      delivered: [...delivered.current],
      read: [...read.current]
    })
  }, [preferenceKey, enabled, inbox, queue])

  useEffect(() => {
    const read = () => setView(viewport())
    const observer = new ResizeObserver(read)
    observer.observe(document.documentElement)
    const bar = document.querySelector('.fitpulse-bottom-nav')
    if (bar) observer.observe(bar)
    const header = document.querySelector('.fitpulse-mobile-header')
    if (header) observer.observe(header)
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
    if (!view.mobile || !enabled || dragging) {
      setClearOfControls(null)
      return
    }
    const scroller = document.querySelector('.fitpulse-mobile-scroll')
    const content = scroller?.querySelector('.fitpulse-mobile-content')
    if (!content) return

    let frame
    const update = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const next = avoidMobileActions({ x: desired.x, y: desired.y }, view)
        setClearOfControls((previous) =>
          previous?.x === next.x && previous?.y === next.y ? previous : next
        )
      })
    }
    const observer = new ResizeObserver(update)
    observer.observe(content)
    scroller.addEventListener('scroll', update, { passive: true })
    update()
    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      scroller.removeEventListener('scroll', update)
    }
  }, [desired.x, desired.y, dragging, enabled, view])

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

  const popupId = !mode && !dragging && !sheetOpen ? activePopup?.id : undefined
  const dismissPopup = useCallback((id) => {
    if (id === GREETING_ID) {
      setGreeting(null)
      return
    }
    delivered.current.add(id)
    setQueue((previous) => previous.filter((item) => item !== id))
  }, [])

  useEffect(() => {
    if (!popupId) return
    if (popupId === GREETING_ID) {
      try {
        sessionStorage.setItem(greetingKey, '1')
      } catch {
        // The in-memory greeting still clears after it is shown.
      }
    }
    const timer = window.setTimeout(() => dismissPopup(popupId), popupId === GREETING_ID ? 3500 : 7000)
    return () => window.clearTimeout(timer)
  }, [popupId, dismissPopup, greetingKey])

  useEffect(
    () => () => {
      window.clearTimeout(hoverTimer.current)
    },
    []
  )

  const close = useCallback(() => {
    if (mode) setMode('')
    else if (popupId) dismissPopup(popupId)
  }, [mode, popupId, dismissPopup])

  useEffect(() => {
    if ((!mode && !popupId) || sheetOpen) return
    const outside = (event) => {
      if (mode && !root.current?.contains(event.target) && !bell.current?.contains(event.target))
        close()
    }
    const onKey = (event) => {
      if (event.key === 'Escape' && !sheetOpen) {
        if (root.current?.contains(document.activeElement))
          (trigger.current || bell.current)?.focus()
        close()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', onKey)
    }
  }, [mode, popupId, close, sheetOpen])

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
    const next = avoidMobileActions(start.last, viewport())
    setStored(next)
    setClearOfControls(next)
    setDragging(false)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
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

  const setEnabled = useCallback((value) => {
    setInbox((previous) => ({ ...previous, enabled: value }))
    if (!value) setGreeting(null)
    setMode('')
  }, [])
  const toggleList = useCallback(() => {
    setMode((current) => (current === 'list' ? '' : 'list'))
  }, [])
  useEffect(() => {
    if (mode === 'list') root.current?.querySelector('.rocky-close')?.focus()
  }, [mode])

  const title = activePopup?.title
  const mood = title === gorillaTitles.expired || activePopup?.type === 'error'
    ? 'angry'
    : activePopup?.type === 'warning'
      ? 'worried'
      : activePopup?.type === 'success' ? 'happy' : 'wink'
  const context = useMemo(
    () => ({
      notify,
      latestEvent,
      registerNavigation,
      enabled,
      setEnabled,
      unread,
      bell,
      bubbleId,
      toggleList,
      listOpen: mode === 'list'
    }),
    [
      notify,
      latestEvent,
      registerNavigation,
      enabled,
      setEnabled,
      unread,
      bubbleId,
      toggleList,
      mode
    ]
  )

  const docked = !enabled
  const bubble = bubblePosition(position, view)
  const shown = Boolean((mode || popupId) && !dragging && !sheetOpen)
  const greetingShown = popupId === GREETING_ID
  const visibleAlerts = mode ? alerts : activePopup && !greetingShown ? [activePopup] : []

  return (
    <GorillaContext.Provider value={context}>
      {children}
      <div
        ref={root}
        className={`rocky${docked ? ' rocky-docked' : ''}${dragging ? ' is-dragging' : ''}`}
        style={docked ? undefined : { left: position.x, top: position.y }}
        hidden={sheetOpen}
        onPointerEnter={docked ? undefined : () => window.clearTimeout(hoverTimer.current)}
        onPointerLeave={docked ? undefined : leave}
      >
        {!docked && (
          <button
            ref={trigger}
            type="button"
            className="rocky-trigger"
            aria-label="Open Rocky’s notifications"
            aria-expanded={shown}
            aria-controls={shown ? bubbleId : undefined}
            onPointerEnter={hover}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            onClick={toggle}
          >
            <span className="rocky-figure">
              <GorillaArt mood={mood} />
            </span>
            {unread > 0 && (
              <span className="rocky-unread" aria-label={`${unread} unread`}>
                {Math.min(unread, 99)}
                {unread > 99 ? '+' : ''}
              </span>
            )}
          </button>
        )}
        {shown && (
          <div
            id={bubbleId}
            className={`rocky-bubble ${docked ? '' : bubble.className}`}
            style={docked ? undefined : bubble.style}
          >
            <div className="rocky-bubble-header">
              <strong>{enabled ? 'Rocky' : 'Notifications'}</strong>
              {mode && (
                <button
                  type="button"
                  className="rocky-hide"
                  aria-label={enabled ? 'Hide Rocky' : 'Show Rocky'}
                  title={enabled ? 'Hide Rocky' : 'Show Rocky'}
                  onClick={() => {
                    setEnabled(!enabled)
                    bell.current?.focus()
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                    strokeLinejoin="round" aria-hidden="true">
                    {enabled ? (
                      <>
                        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    ) : (
                      <path d="m3 3 18 18M10 10a3 3 0 0 0 4 4M9 5.4a11 11 0 0 1 3-.4c6 0 10 7 10 7a16 16 0 0 1-3.2 3.9M6.1 6.1A19 19 0 0 0 2 12s4 7 10 7a10 10 0 0 0 4.2-.9" />
                    )}
                  </svg>
                </button>
              )}
              <button
                type="button"
                className="rocky-close"
                aria-label={mode ? 'Close notification history' : 'Close notification'}
                onClick={() => {
                  if (root.current?.contains(document.activeElement))
                    (trigger.current || bell.current)?.focus()
                  close()
                }}
              >
                ×
              </button>
            </div>
            <div className="rocky-list" aria-live={mode ? 'off' : 'polite'}>
              {greetingShown && <p className="rocky-greeting">{greeting.message}</p>}
              {mode && !alerts.length && <p>No notifications yet.</p>}
              {visibleAlerts.map((alert) => {
                // Older events carry only a title. New events can identify a specific record.
                const target = ALERT_SECTIONS.has(alert.target?.section)
                  ? alert.target
                  : { section: DESTINATIONS[alert.title] || 'Notifications' }
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
                        {!alert.read && <span className="rocky-new">Unread</span>}
                        <time dateTime={alert.receivedAt}>
                          {formatDateTime(alert.receivedAt)}
                        </time>
                      </div>
                      <p>{alert.message}</p>
                      {action && (
                        <button
                          type="button"
                          className="btn rocky-view"
                          onClick={() => {
                            read.current.add(alert.id)
                            setInbox((previous) => ({
                              ...previous,
                              alerts: previous.alerts.map((item) =>
                                item.id === alert.id ? { ...item, read: true } : item
                              )
                            }))
                            dismissPopup(alert.id)
                            const control = trigger.current || bell.current
                            control?.focus()
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
