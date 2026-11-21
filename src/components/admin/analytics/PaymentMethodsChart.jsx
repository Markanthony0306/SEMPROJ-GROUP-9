import { useCallback } from 'react'
import ChartCard from './ChartCard'
import useAnalyticsChart, { chartOptions } from './useAnalyticsChart'

export default function PaymentMethodsChart({ data, loading, error, onRetry }) {
  const createConfig = useCallback(
    (colors) => {
      const options = chartOptions(colors, { doughnut: true })
      options.plugins.tooltip.callbacks = {
        label: (context) => {
          const method = data.methods[context.dataIndex]
          return `${method.label}: ${method.percent}% (${method.count} payments)`
        }
      }
      // Raw counts give exact slice proportions; percentages are labels, not amounts.
      const labels = data.methods.map((method) => `${method.label} ${method.percent}%`)
      return {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data: data.methods.map((method) => method.count),
              backgroundColor: [colors.navy, colors.orange],
              borderColor: colors.surface,
              borderWidth: 4,
              hoverOffset: 5
            }
          ]
        },
        options
      }
    },
    [data]
  )
  const { canvasRef, chartError } = useAnalyticsChart(
    createConfig,
    !loading && !error && data?.total > 0
  )
  return (
    <ChartCard
      title="Payment Methods"
      subtitle="Cash and GCash · Successful payment count · All time"
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
          aria-label={`Payment share: ${data?.methods.map((method) => `${method.label} ${method.percent}%`).join(', ')}`}
        />
      </div>
    </ChartCard>
  )
}
