import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import App from '../../src/App'
import { AuthProvider } from '../../src/auth/AuthContext'
import { ThemeProvider } from '../../src/components/brand/useTheme'
import { MEMBER_TERMS_VERSION } from '../../shared/memberTerms'
import '../../src/styles/fitpulse-v3.css'
import '../../src/styles/experience.css'

const member = {
  id: 'fixture-member', name: 'Jamie Member', role: 'user', email: 'jamie@fixture.test',
  status: 'active', plan: 'Monthly', membershipStart: '2025-01-01',
  membershipEnd: '2099-12-01', memberCode: 'FP-001', termsVersion: MEMBER_TERMS_VERSION
}
const admin = { id: 'fixture-admin', name: 'Alex Admin', role: 'admin', email: 'alex@fixture.test' }
const date = '2026-11-24T09:30:00Z'
const attendance = [{ id: 'visit-1', memberId: member.id, memberName: member.name, date, source: 'QR' }]
const payments = [{ id: 'payment-1', memberId: member.id, memberName: member.name, type: 'Renewal', plan: 'Monthly', amount: 1500, method: 'Cash', date }]
const equipment = [{ id: 'eq-1', name: 'Cable station', category: 'Free Weights Section', condition: 'Good', lastInspected: date }]
const plans = [{ plan_id: 1, plan_name: 'Monthly', price: 1500, duration_days: 30 }]
const pendingAlert = { id: 'history-1', title: 'Membership reminder', type: 'info', message: 'A membership needs review.', receivedAt: date }
const previewType = document.body.dataset.preview
const paymentMethods = { methods: [], total: 0 }
const result = document.getElementById('results')
const observed = []
const failures = []
const clicks = []
let user = admin
let sequence = 0
let liveSource
let resetExpiry
let resetUsed
let app
let checks = 0
let exports = 0
const freshPassword = 'StrongPass#2026'
const nativeFetch = window.fetch.bind(window)
window.fetch = async (input, options = {}) => {
  const url = new URL(input, location.href)
  if (!url.pathname.startsWith('/api/')) return nativeFetch(input, options)
  const path = url.pathname.slice(4)
  const method = options.method || 'GET'
  const values = typeof options.body === 'string' ? JSON.parse(options.body) : {}
  observed.push([method, path, values])
  const json = (payload, status = 200) => new Response(JSON.stringify(payload), {
    status, headers: { 'Content-Type': 'application/json' }
  })
  if (path === '/me') return json({ user })
  if (path === '/events/ticket') return json({ ticket: 'fixture', expiresAt: Date.now() + 60_000 })
  if (path === '/events/history') return json({ alerts: url.searchParams.get('after') === '0' ? [pendingAlert] : [], next: 1 })
  if (path === '/events/reminders') return json({ reminders: [] })
  if (path === '/members') return json({ members: [member] })
  if (path === '/admin/membership-plans') return json({ membershipPlans: plans })
  if (path === '/attendance') return json({ attendance })
  if (path === '/payments' && method === 'GET') return json({ payments })
  if (path === '/admin/equipment') return json({ equipment, maintenance: [] })
  if (path === '/admin/settings') return json({ settings: { gym: 'FitPulse Gym', remind: 7 } })
  if (path === '/admin/notifications') return json({ canDismiss: true, notifications: [
    { id: 'equipment-notice', kind: 'equipment', name: 'Cable station', condition: 'Good', lastInspected: date }
  ] })
  if (path === '/analytics/attendance') return json({ days: [], total: 0 })
  if (path === '/analytics/membership-status') return json({ totalMembers: 0, active: 0, expiringSoon: 0, expired: 0, unclassified: 0 })
  if (path === '/analytics/revenue') return json({ months: [], paymentCount: 0, revenueThisMonth: 0 })
  if (path === '/analytics/payments') return json(paymentMethods)
  if (path === '/me/qr') return json({
    image: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><path d="M0 0h50v50H0zM70 70h50v50H70z"/></svg>'),
    expiresAt: Date.now() + 60_000
  })
  if (path === '/profile/change-password') {
    if (values.currentPassword !== 'OldPassword#2') return json({ message: 'Current password is incorrect.' }, 400)
    return json({ session: { token: 'fixture-new-session', user } })
  }
  if (path === '/profile' && method === 'PATCH') {
    user = { ...user, ...values }
    return json({ user })
  }
  if (path === '/auth/forgot-password') return json({ message: 'If that email exists, a reset link was sent.' })
  if (path === '/auth/reset-password/session') {
    const serverNow = Date.now()
    if (resetExpiry <= serverNow || resetUsed) return json({ message: 'This link has expired.' }, 410)
    return json({ expiresAt: resetExpiry, serverNow })
  }
  if (path === '/auth/reset-password') {
    if (resetUsed || resetExpiry <= Date.now()) return json({ message: 'This link has expired.' }, 410)
    resetUsed = true
    return json({ message: 'Password reset successfully.' })
  }
  failures.push('Unexpected fixture request: ' + method + ' ' + path)
  return json({ message: 'Unexpected request' }, 500)
}
window.EventSource = class {
  static CLOSED = 2
  constructor() { liveSource = this }
  close() { this.readyState = 2 }
}
const browserError = event => failures.push(event.message || String(event.reason))
window.addEventListener('error', browserError)
window.addEventListener('unhandledrejection', browserError)
document.addEventListener('click', event => {
  if (event.target instanceof HTMLAnchorElement && event.target.download) {
    exports++
    event.preventDefault()
  }
})
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
function assert(ok, message) {
  if (!ok) throw new Error(message)
  checks++
}
async function waitFor(find, label) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const item = find()
    if (item) return item
    await pause(25)
  }
  throw new Error('Timed out waiting for ' + label)
}
const find = (selector, container = document) => container.querySelector(selector)
const contains = text => document.body.textContent.includes(text)
const buttonNamed = (name, within = document) => [...within.querySelectorAll('button')].find(button =>
  (button.getAttribute('aria-label') === name || button.textContent.trim() === name ||
    button.matches('.nav') && button.querySelector('span')?.textContent === name) && button.getClientRects().length)
const tap = async (name, within = document) => {
  const button = await waitFor(() => {
    const target = buttonNamed(name, within)
    return target && !target.disabled && target
  }, name)
  button.click()
  clicks.push(name)
}
const dialog = () => find('dialog[open]')
const close = async () => {
  const opened = await waitFor(dialog, 'open dialog')
  find('.dialog-close', opened).click()
  await waitFor(() => !dialog(), 'closed dialog')
}
const fill = (input, value) => Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value)
function submitForm(form, values) {
  for (const [key, value] of Object.entries(values)) fill(form.elements.namedItem(key), value)
  form.requestSubmit()
}
async function mount(route, account) {
  user = account
  if (account) localStorage.setItem('fitpulse-session', JSON.stringify({ token: 'fixture-session', user: account }))
  else localStorage.removeItem('fitpulse-session')
  window.history.replaceState({}, '', route)
  flushSync(() => app.render(
    <StrictMode key={++sequence}>
      <ThemeProvider><AuthProvider><App /></AuthProvider></ThemeProvider>
    </StrictMode>
  ))
}
async function run() {
  app = createRoot(document.getElementById('root'))
  for (const account of [admin, member]) {
    localStorage.removeItem('fitpulse-rocky:' + account.id)
    sessionStorage.removeItem('fitpulse-rocky:' + account.id + ':greeted')
  }
  const mobile = innerWidth <= 768
  if (previewType) {
    await mount('/user', member)
    const nav = await waitFor(() => find(mobile ? '.fitpulse-bottom-nav' : '#nav'), 'member navigation')
    if (mobile) await tap('More', nav)
    await tap(mobile ? 'Settings›' : 'Settings', mobile ? document : nav)
    await tap('Read privacy policy')
    const policy = await waitFor(dialog, 'privacy dialog')
    const content = find('.privacy-policy-copy', policy)
    const closeButton = find('.dialog-close', policy)
    assert(document.activeElement === closeButton, 'The close button receives initial focus')
    const top = closeButton.getBoundingClientRect().top
    content.scrollTop = content.scrollHeight
    assert(Math.abs(closeButton.getBoundingClientRect().top - top) < 1, 'Close button stays visible while the policy scrolls')
    content.scrollTop = 0
    result.hidden = true
    return
  }
  await mount('/login')
  await waitFor(() => contains('Welcome back'), 'login')
  assert(!find('.heart-rate-loader'), 'Startup should open login directly')
  await tap('Forgot password?')
  const request = await waitFor(dialog, 'forgot-password dialog')
  const email = find('input[type=email]', request)
  fill(email, member.email)
  email.dispatchEvent(new Event('input', { bubbles: true }))
  await tap('Send email', request)
  await waitFor(() => contains('a reset link was sent'), 'confirmation inside the dialog')
  assert(Boolean(dialog()), 'Email confirmation must stay in the modal')
  await tap('Done', request)
  await waitFor(() => !dialog(), 'recovery confirmation closes')

  for (const account of [admin, member]) {
    const isAdmin = account.role === 'admin'
    const dashboard = isAdmin ? '/admin' : '/user'
    await mount(dashboard, account)
    await waitFor(() => contains('Welcome to FitPulse!'), account.role + ' Rocky greeting')
    assert(!find('.rocky-alert'), 'Greeting should precede pending notifications')
    await tap('Close notification')
    await waitFor(() => find('.rocky-alert'), 'pending notification')
    assert(contains(pendingAlert.message), 'Queued notification should follow greeting')
    await tap('Close notification')
    const nav = find(mobile ? '.fitpulse-bottom-nav' : '#nav')
    assert(Boolean(nav) && !find('.heart-rate-loader'), 'Dashboard renders without startup loader')
    if (mobile) {
      assert(Boolean(buttonNamed(isAdmin ? 'Create a new member' : 'Open my QR', nav)), 'Role-appropriate mobile primary action')
      assert(!buttonNamed(isAdmin ? 'Membership' : 'Members', nav), 'Other role does not appear in mobile navigation')
      if (!isAdmin) {
        await tap('Membership', nav)
        await waitFor(() => contains('My membership'), 'member membership details')
        assert(!contains('Your activity'), 'Membership tab does not duplicate the overview')
        await tap('Open my QR', nav)
        await waitFor(() => find('dialog[open] img'), 'member QR image')
        await close()
      }
      await tap('Activities', nav)
      await tap('Attendance')
      await waitFor(() => contains(isAdmin ? 'Entrance check-ins' : 'My Attendance History'), 'attendance')
      await tap('← Activities')
      await tap('Payments')
      await waitFor(() => contains(isAdmin ? 'Payment History' : 'My Payment History'), 'payments')
    } else {
      await tap('Attendance', nav)
      await waitFor(() => contains(isAdmin ? 'Entrance check-ins' : 'My Attendance History'), 'attendance')
      await tap('Payments', nav)
      await waitFor(() => contains(isAdmin ? 'Payment History' : 'My Payment History'), 'payments')
      if (!isAdmin) {
        await tap('My QR', nav)
        await waitFor(() => find('.member-qr-card img'), 'member QR image')
      }
    }
    if (isAdmin) {
      await tap('Record Payment')
      await waitFor(dialog, 'record payment modal')
      await close()
      if (mobile) await tap('More', nav)
      await tap(mobile ? 'Email reminders›' : 'Notifications', mobile ? document : nav)
      await tap('Review')
      await waitFor(() => contains('Equipment Monitoring'), 'equipment from reminder')
      if (mobile) await tap('More', nav)
      await tap(mobile ? 'Equipment monitoring›' : 'Equipment')
      await tap('Add Equipment')
      await waitFor(dialog, 'add equipment modal')
      await close()
      await tap('Log repair')
      await waitFor(dialog, 'maintenance modal')
      await close()
      if (mobile) await tap('More', nav)
      await tap(mobile ? 'Reports›' : 'Reports')
      const tabs = await waitFor(() => find('.report-tabs'), 'report tabs')
      for (const tab of tabs.querySelectorAll('button')) {
        tab.click()
        await pause(20)
        assert(tab.getAttribute('aria-selected') === 'true' || tab.getAttribute('aria-pressed') === 'true', 'Report tab selects')
      }
      if (mobile) {
        await tap('Create a new member', nav)
      } else {
        await tap('Members', nav)
        await tap('Create Account')
      }
      await waitFor(() => contains('Create member account'), 'create member')
      const creation = dialog()
      creation.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      creation.requestClose()
      await pause(30)
      assert(creation.open, 'Existing creation lock remains active')
      await close()
    }
    const theme = document.documentElement.dataset.theme
    await tap(mobile ? (theme === 'dark' ? 'Use light theme' : 'Use dark theme') : 'Toggle theme')
    await waitFor(() => document.documentElement.dataset.theme !== theme, 'theme toggled')
    if (mobile) {
      await tap('More', nav)
      assert(find('.fitpulse-mobile-header .fitpulse-icon-button') &&
        ![...find('.fitpulse-more-list').querySelectorAll('button')].some(b => /dark mode|theme/i.test(b.textContent)), 'One mobile theme control')
      if (!isAdmin) assert(!/equipment|reports|email reminders/i.test(find('.fitpulse-more-list').textContent), 'Member More menu contains member items')
      await tap('Settings›')
    } else {
      await tap('Settings', nav)
    }
    await tap('Read privacy policy')
    const policy = await waitFor(dialog, 'privacy dialog')
    await waitFor(() => find('.dialog-close', policy).getBoundingClientRect().width >= 40, 'visible privacy close button')
    assert(contains('facial template') && contains('gym front desk'), 'Privacy describes data and contact')
    assert(getComputedStyle(policy, '::backdrop').backdropFilter.includes('blur'), 'Modal retains blurred backdrop')
    assert(find('.dialog-close', policy).getBoundingClientRect().width >= 40, 'Visible privacy close button')
    await close()
    const password = await waitFor(() => find('.password-form'), 'password form')
    await tap('Show new password', password)
    assert(password.elements.password.type === 'text', 'Password visibility toggle works')
    const submitted = observed.length
    submitForm(password, { currentPassword: 'OldPassword#2', password: freshPassword, confirmPassword: 'WrongPass#2026' })
    await waitFor(() => contains('The new passwords do not match.'), 'mismatch')
    assert(!observed.slice(submitted).some(([, path]) => path === '/profile/change-password'), 'Client blocks a mismatch')
    submitForm(password, { currentPassword: 'WrongPassword#2', password: freshPassword, confirmPassword: freshPassword })
    await waitFor(() => contains('Current password is incorrect.'), 'wrong current password')
    submitForm(password, { currentPassword: 'OldPassword#2', password: freshPassword, confirmPassword: freshPassword })
    await waitFor(() => contains('Password updated.'), 'password updated')
    await tap('Save profile')
    await waitFor(() => contains('Profile saved.'), 'profile save')
    if (isAdmin) {
      await tap('Save preferences')
      await waitFor(() => contains('Preferences saved.'), 'gym preferences save')
    }
    const rockySwitch = find('[role=switch]')
    rockySwitch.click()
    await waitFor(() => !find('.rocky-trigger'), 'Rocky hidden')
    liveSource.onmessage({ data: JSON.stringify({ ...pendingAlert, title: 'Plain test notice' }), lastEventId: 'live-' + account.role })
    await waitFor(() => contains('Plain test notice'), 'plain notification')
    assert(Boolean(find('.rocky-docked')) && !find('.rocky-trigger'), 'Plain popup has no mascot')
    await mount(dashboard, account)
    await waitFor(() => find('.rocky-docked'), 'account-specific preference restored')
    assert(!contains('Welcome to FitPulse!'), 'Same browser session does not repeat the greeting')
    const nextNav = await waitFor(() => find(mobile ? '.fitpulse-bottom-nav' : '#nav'), 'remounted navigation')
    if (mobile) {
      await tap('Activities', nextNav)
      await tap('Payments')
    } else await tap('Payments', nextNav)
    const exported = exports
    await tap('Export CSV')
    await waitFor(() => exports === exported + 1, 'CSV download')
    if (mobile) await tap('More', nextNav)
    await tap('Sign out', mobile ? document : find('.app aside'))
    await tap('Cancel', await waitFor(dialog, 'sign-out dialog'))
    await waitFor(() => !dialog(), 'sign-out cancellation keeps dashboard')
    await tap('Sign out', mobile ? document : find('.app aside'))
    await tap('Sign out', await waitFor(dialog, 'sign-out confirmation'))
    await waitFor(() => contains('Welcome back'), 'signed out')
  }
  resetUsed = false
  resetExpiry = Date.now() + 2800
  const resetUrl = '/reset-password#token=browser-fixture'
  await mount(resetUrl)
  await waitFor(() => /Link expires in 00:0[1-5]/.test(document.body.textContent), 'server-based timer')
  const first = Number(find('[role=timer]').textContent.slice(-2))
  await pause(1150)
  await mount(resetUrl)
  await waitFor(() => /Link expires in 00:0[1-3]/.test(document.body.textContent), 'refresh timer')
  assert(Number(find('[role=timer]').textContent.slice(-2)) < first, 'Refreshing uses the original expiry')
  await waitFor(() => contains('00:00'), 'expired timer')
  assert([...document.querySelectorAll('form input, form button')].every(control => control.disabled), 'Expired reset fields and buttons are disabled')
  await tap('Request a new link')
  await waitFor(dialog, 'forgot modal reopens from reset page')
  await close()
  resetExpiry = Date.now() + 60_000
  await mount(resetUrl)
  const resetForm = await waitFor(() => find('.reset-page form input:not(:disabled)')?.form, 'active reset form')
  submitForm(resetForm, { password: freshPassword, confirmPassword: freshPassword })
  await waitFor(() => contains('Password reset successfully.'), 'reset success')
  await tap('Back to login')
  await waitFor(() => contains('Welcome back'), 'return to login')
  assert(!failures.length, failures.join('\n'))
  flushSync(() => app.render(null))
  result.textContent = 'PASS | ' + checks + ' assertions, ' + clicks.length + ' UI actions (' + (mobile ? 'mobile' : 'desktop') + ').'
}
run().catch(error => {
  flushSync(() => app.render(null))
  result.textContent = 'FAIL | ' + error.message + '\n' + failures.join('\n') + '\nLast actions: ' + clicks.slice(-7).join(', ')
  console.error(error)
}).finally(() => { document.documentElement.dataset.ready = 'true' })
