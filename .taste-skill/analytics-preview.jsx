// TEST FIXTURES ONLY. This file is outside Vite's production entry graph.
import React, { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import AdminStaffPage from '../src/pages/AdminStaffPage'
import { AuthProvider } from '../src/auth/AuthContext'
import { ThemeProvider, useTheme } from '../src/components/brand/useTheme'
import '../src/styles/fitpulse-v3.css'
import '../src/styles/experience.css'

const params = new URLSearchParams(location.search)
let mode = params.get('state') || 'loaded'
const initialMode = mode
localStorage.setItem('fitpulse-theme', params.get('theme') || 'light')
const user = { id: 'qa-admin', name: 'Analytics QA', role: 'admin', status: 'active' }
localStorage.setItem('fitpulse-session', JSON.stringify({ user, token: 'isolated-qa-token' }))
if (mode === 'cdn-error') window.Chart = undefined
const nativeFetch = window.fetch.bind(window)
const counts = [12, 18, 9, 24, 16, 8, 0]
const sample = {
  attendance: {
    total: 87,
    days: counts.map((count, index) => ({
      label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
      count
    }))
  },
  'membership-status': {
    totalMembers: 120,
    active: 90,
    expiringSoon: 18,
    expired: 12,
    unclassified: 0,
    expiringDays: 7
  },
  revenue: {
    paymentCount: 20,
    revenueThisMonth: 26750,
    months: [12500, 15000, 18250, 16700, 22500, 26750].map((amount, index) => ({
      label: ['Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026'][index],
      amount
    }))
  },
  payments: {
    total: 20,
    methods: [
      { label: 'Cash', count: 8, percent: 40 },
      { label: 'GCash', count: 12, percent: 60 }
    ]
  }
}
const empty = {
  attendance: { total: 0, days: [] },
  'membership-status': {
    totalMembers: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
    unclassified: 0,
    expiringDays: 7
  },
  revenue: { paymentCount: 0, revenueThisMonth: 0, months: [] },
  payments: { total: 0, methods: [] }
}
window.fetch = async (input, options = {}) => {
  const url = new URL(String(input), location.href)
  if (!url.pathname.startsWith('/api/')) return nativeFetch(input, options)
  await new Promise((resolve) => setTimeout(resolve, 90))
  if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  if (url.pathname.startsWith('/api/analytics/')) {
    if (mode === 'loading') return new Promise(() => {})
    const path = url.pathname.split('/').at(-1)
    if (mode === 'error' || (mode === 'partial' && path === 'revenue'))
      return Response.json(
        { message: 'Unable to load analytics. Please try again.' },
        { status: 503 }
      )
    return Response.json(mode === 'invalid' ? {} : (mode === 'empty' ? empty : sample)[path])
  }
  const payload = {
    '/api/me': { user },
    '/api/members': { members: [] },
    '/api/admin/membership-plans': { membershipPlans: [] },
    '/api/attendance': { attendance: [] },
    '/api/payments': { payments: [] },
    '/api/admin/equipment': { equipment: [], maintenance: [] },
    '/api/admin/settings': { settings: { gym: 'FitPulse Gym', remind: 7 } },
    '/api/admin/notifications': { notifications: [], canDismiss: false }
  }
  return Response.json(
    payload[url.pathname] || { reminders: [], notifications: [], activities: [] }
  )
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const instances = () => Object.values(window.Chart?.instances || {})
const assertions = []
function check(name, pass) {
  assertions.push({ name, pass: Boolean(pass) })
}
function Preview() {
  const { toggle } = useTheme()
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    if (window.qaStarted) return
    window.qaStarted = true
    const run = async () => {
      await delay(1800)
      const charts = instances()
      const analytics = document.querySelector('.admin-analytics')
      check('analytics mounted in the real desktop/mobile dashboard', analytics)
      const columns = getComputedStyle(
        document.querySelector('.analytics-grid')
      ).gridTemplateColumns.split(' ').length
      check('responsive columns', columns === (innerWidth <= 1024 ? 1 : 2))
      check('no horizontal overflow', document.documentElement.scrollWidth <= innerWidth)
      check('four summary cards', document.querySelectorAll('.analytics-stat').length === 4)
      check(
        'consistent summary label size',
        getComputedStyle(document.querySelector('.analytics-stat h2')).fontSize === '12px'
      )
      check(
        'consistent chart heading size',
        getComputedStyle(document.querySelector('.analytics-chart-heading h2')).fontSize === '18px'
      )
      check(
        'consistent chart subtitle size',
        getComputedStyle(document.querySelector('.analytics-chart-heading p')).fontSize === '12px'
      )
      if (mode === 'loaded' || mode === 'partial') {
        check('live Chart.js 4.4.7', window.Chart?.version === '4.4.7')
        check('one instance per visible canvas', charts.length === (mode === 'partial' ? 3 : 4))
        check(
          'canvas dimensions and accessible labels',
          [...document.querySelectorAll('.analytics-canvas canvas')].every(
            (canvas) => canvas.width > 0 && canvas.height > 0 && canvas.getAttribute('aria-label')
          )
        )
        const bar = charts.find((chart) => chart.config.type === 'bar')
        check('orange peak', bar?.data.datasets[0].backgroundColor[3].toLowerCase() === '#f77f00')
        check(
          'single-series legends hidden',
          charts
            .filter((chart) => chart.config.type !== 'doughnut')
            .every((chart) => !chart.options.plugins.legend.display)
        )
        check(
          'fixed chart sizing',
          charts.every((chart) => chart.options.maintainAspectRatio === false)
        )
        if (params.has('checks')) {
          const ids = charts.map((chart) => chart.id)
          const navy = charts.find((chart) => chart.config.type === 'doughnut').data.datasets[0]
            .backgroundColor[0]
          toggle()
          await delay(700)
          check(
            'theme destroys all old charts',
            ids.every((id) => !window.Chart.instances[id])
          )
          check('theme rebuilds four charts', instances().length === 4)
          check(
            'theme reads fresh CSS tokens',
            instances().find((chart) => chart.config.type === 'doughnut').data.datasets[0]
              .backgroundColor[0] !== navy
          )
          toggle()
          await delay(500)
          setVisible(false)
          await delay(200)
          check('unmount destroys all charts', instances().length === 0)
          setVisible(true)
          await delay(800)
          check('remount safely reuses canvases', instances().length === 4)
        }
      } else if (mode === 'empty') {
        check(
          'four empty messages and no fake series',
          [...analytics.querySelectorAll('.analytics-chart-state')].filter(
            (node) => node.textContent === 'No data yet'
          ).length === 4 && charts.length === 0
        )
      } else if (mode === 'loading') {
        check(
          'four skeletons',
          analytics.querySelectorAll('.analytics-chart-skeleton').length === 4
        )
      } else if (mode === 'cdn-error') {
        check(
          'four CDN failure messages',
          analytics.querySelectorAll('.analytics-chart-error').length === 4
        )
      } else {
        check('four API error states', analytics.querySelectorAll('[role="alert"]').length === 4)
        mode = 'loaded'
        analytics
          .querySelectorAll('.analytics-chart-state button')
          .forEach((button) => button.click())
        await delay(800)
        check('retry recovers all charts', instances().length === 4)
      }
      if (params.has('show')) {
        const card = [...document.querySelectorAll('.analytics-chart-card')].find(
          (node) => node.querySelector('h2').textContent.toLowerCase() === params.get('show')
        )
        card?.scrollIntoView({ block: 'start' })
      }
      await nativeFetch('/__analytics_qa', {
        method: 'POST',
        body: JSON.stringify({
          width: innerWidth,
          mode: initialMode,
          theme: params.get('theme') || 'light',
          passed: assertions.every((result) => result.pass),
          assertions
        })
      })
    }
    run().catch(async (error) => {
      await nativeFetch('/__analytics_qa', {
        method: 'POST',
        body: JSON.stringify({
          width: innerWidth,
          mode: initialMode,
          passed: false,
          error: error.message
        })
      })
    })
  }, [])
  return visible ? <AdminStaffPage user={user} onSignOut={() => {}} /> : null
}
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <Preview />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)
