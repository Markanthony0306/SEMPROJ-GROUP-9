import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../brand/useTheme'

let chartLibrary

function loadChartLibrary() {
  chartLibrary ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js'
    script.crossOrigin = 'anonymous'
    script.async = true
    const failed = () => {
      script.remove()
      chartLibrary = undefined
      reject(new Error('Chart.js is unavailable.'))
    }
    script.onload = () => window.Chart ? resolve(window.Chart) : failed()
    script.onerror = failed
    document.head.append(script)
  })
  return chartLibrary
}

export const pesos = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2
  }).format(value)

function chartColors(canvas) {
  const style = getComputedStyle(canvas)
  const read = (name) => style.getPropertyValue(name).trim()
  return {
    navy: read('--analytics-navy'),
    mutedNavy: read('--analytics-muted-navy'),
    orange: read('--orange'),
    gold: read('--gold'),
    red: read('--red'),
    fill: read('--analytics-fill'),
    grid: read('--analytics-grid'),
    text: read('--text'),
    muted: read('--muted'),
    surface: read('--card'),
    font: style.fontFamily
  }
}

export function chartOptions(colors, { doughnut = false, currency = false } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    locale: 'en-PH',
    animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? false
      : { duration: 350 },
    plugins: {
      legend: {
        display: doughnut,
        position: 'bottom',
        labels: {
          color: colors.text,
          usePointStyle: true,
          boxWidth: 9,
          padding: 16,
          font: { family: colors.font, size: 12 }
        }
      },
      tooltip: {
        backgroundColor: colors.surface,
        titleColor: colors.text,
        bodyColor: colors.text,
        borderColor: colors.grid,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12
      }
    },
    ...(doughnut
      ? { cutout: '68%' }
      : {
          scales: {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: { color: colors.muted, font: { family: colors.font, size: 12 } }
            },
            y: {
              beginAtZero: true,
              border: { display: false },
              grid: { color: colors.grid },
              ticks: {
                color: colors.muted,
                maxTicksLimit: 5,
                font: { family: colors.font, size: 12 },
                ...(currency ? { callback: (value) => pesos(value) } : { precision: 0 })
              }
            }
          }
        })
  }
}

// Each effect owns one Chart instance, including StrictMode and theme changes.
export default function useAnalyticsChart(createConfig, enabled) {
  const canvasRef = useRef(null)
  const { dark } = useTheme()
  const [chartError, setChartError] = useState('')

  useEffect(() => {
    if (!enabled) return
    let chart
    let active = true
    setChartError('')
    // ThemeProvider updates <html> in an effect; read its CSS on the next frame.
    const frame = window.requestAnimationFrame(async () => {
      const canvas = canvasRef.current
      if (!canvas) return
      try {
        const Chart = await loadChartLibrary()
        if (!active) return
        chart = new Chart(canvas, createConfig(chartColors(canvas)))
      } catch (error) {
        if (!active) return
        window.Chart?.getChart(canvas)?.destroy()
        console.error('Unable to render the analytics chart:', error.message)
        setChartError('Charts could not load. Check your connection and reload the page.')
      }
    })
    return () => {
      active = false
      window.cancelAnimationFrame(frame)
      chart?.destroy()
    }
  }, [createConfig, enabled, dark])

  return { canvasRef, chartError }
}
