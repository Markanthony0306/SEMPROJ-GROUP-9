import { useCallback } from 'react'
import ChartCard from './ChartCard'
import useAnalyticsChart, { chartOptions } from './useAnalyticsChart'

export default function MembershipStatusChart({ data, loading, error, onRetry }) {
  const total = (data?.active || 0) + (data?.expiringSoon || 0) + (data?.expired || 0)
  const createConfig = useCallback(
    (colors) => ({
      // The three buckets are exclusive; expiring members are excluded from Active.
      type: 'doughnut',
      data: {
        labels: ['Active', 'Expiring soon', 'Expired'],
        datasets: [
          {
            data: [data.active, data.expiringSoon, data.expired],
            backgroundColor: [colors.navy, colors.gold, colors.red],
            borderColor: colors.surface,
            borderWidth: 4,
            hoverOffset: 5
          }
        ]
      },
      options: chartOptions(colors, { doughnut: true })
    }),
    [data]
  )
  const { canvasRef, chartError } = useAnalyticsChart(createConfig, !loading && !error && total > 0)
  const excluded = data?.unclassified
    ? ` · ${data.unclassified} without a current classification`
    : ''
  return (
    <ChartCard
      title="Membership Status"
      subtitle={`Expiring within ${data?.expiringDays || 7} Manila calendar days${excluded}`}
      loading={loading}
      error={error}
      empty={!total}
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
          aria-label={`Memberships: Active ${data?.active}, Expiring soon ${data?.expiringSoon}, Expired ${data?.expired}`}
        />
      </div>
    </ChartCard>
  )
}
