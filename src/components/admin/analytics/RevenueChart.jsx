import { useCallback } from 'react'
import { formatDate } from '../../../../shared/formatDate.js'
import ChartCard from './ChartCard'
import useAnalyticsChart, { chartOptions, pesos } from './useAnalyticsChart'

const monthStart = (month) => formatDate(`${month}-01`)

export default function RevenueChart({ data, loading, error, onRetry }) {
  const createConfig = useCallback(
    (colors) => {
      const options = chartOptions(colors, { currency: true })
      options.plugins.tooltip.callbacks = {
        title: ([point]) => `Month starting ${point?.label || '—'}`,
        label: (context) => `Revenue: ${pesos(context.parsed.y)}`
      }
      // Six zero-filled calendar months keep gaps honest, including this partial month.
      return {
        type: 'line',
        data: {
          labels: data.months.map((month) => monthStart(month.month)),
          datasets: [
            {
              label: 'Revenue',
              data: data.months.map((month) => month.amount),
              borderColor: colors.orange,
              backgroundColor: colors.fill,
              pointBackgroundColor: colors.orange,
              pointBorderColor: colors.surface,
              pointRadius: 4,
              pointHoverRadius: 6,
              borderWidth: 3,
              tension: 0.3,
              fill: true
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
    !loading && !error && data?.paymentCount > 0
  )
  return (
    <ChartCard
      title="Revenue"
      subtitle="Last 6 months · Successful payments · PHP"
      loading={loading}
      error={error}
      empty={!data?.paymentCount}
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
          aria-label={`Monthly revenue by start date: ${data?.months.map((month) => `${monthStart(month.month)} ${pesos(month.amount)}`).join(', ')}`}
        />
      </div>
    </ChartCard>
  )
}
