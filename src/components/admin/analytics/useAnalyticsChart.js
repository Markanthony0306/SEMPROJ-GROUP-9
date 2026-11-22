import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../brand/useTheme'

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
    setChartError('')
    // ThemeProvider updates <html> in an effect; read its CSS on the next frame.
    const frame = window.requestAnimationFrame(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      try {
        if (!window.Chart) throw new Error('Chart.js is unavailable.')
        chart = new window.Chart(canvas, createConfig(chartColors(canvas)))
      } catch {
        window.Chart?.getChart(canvas)?.destroy()
        setChartError('Charts could not load. Check your connection and reload the page.')
      }
    })
    return () => {
      window.cancelAnimationFrame(frame)
      chart?.destroy()
    }
  }, [createConfig, enabled, dark])

  return { canvasRef, chartError }
}
