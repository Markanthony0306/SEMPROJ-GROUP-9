import { useCallback } from 'react'
import ChartCard from './ChartCard'
import useAnalyticsChart, { chartOptions } from './useAnalyticsChart'

export default function AttendanceChart({ data, loading, error, onRetry }) {
  const createConfig = useCallback(
    (colors) => {
      const counts = data.days.map((day) => day.count)
      const highest = Math.max(...counts)
      // Rounded bars; every tied peak is orange. Single-series legends stay hidden.
      return {
        type: 'bar',
        data: {
          labels: data.days.map((day) => day.label),
          datasets: [
            {
              label: 'QR check-ins',
              data: counts,
              borderRadius: 8,
              borderSkipped: false,
              maxBarThickness: 42,
              backgroundColor: counts.map((count) =>
                count === highest ? colors.orange : colors.mutedNavy
              )
            }
          ]
        },
        options: chartOptions(colors)
      }
    },
    [data]
  )
  const enabled = !loading && !error && data?.total > 0
  const { canvasRef, chartError } = useAnalyticsChart(createConfig, enabled)
  return (
    <ChartCard
      title="QR Attendance"
      subtitle="Current week · Monday–Sunday · Asia/Manila"
      loading={loading}
      error={error}
      empty={!data?.total}
      onRetry={onRetry}
    >
      {chartError && (
        <p className="analytics-chart-error" role="alert">
          {chartError}
        </p>
      )}
      <div className="analytics-canvas" hidden={Boolean(chartError)}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`QR check-ins this week: ${data?.days.map((day) => `${day.label} ${day.count}`).join(', ')}`}
        />
      </div>
    </ChartCard>
  )
}
