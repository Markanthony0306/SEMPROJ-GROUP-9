import { useId } from 'react'

export default function ChartCard({ title, subtitle, loading, error, empty, onRetry, children }) {
  const titleId = useId()
  return (
    <article
      className="card clay analytics-chart-card"
      aria-labelledby={titleId}
      aria-busy={loading}
    >
      <div className="analytics-chart-heading">
        <h2 id={titleId}>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {loading ? (
        <div className="analytics-chart-state" role="status">
          <span className="analytics-sr-only">Loading {title}</span>
          <div className="analytics-skeleton analytics-chart-skeleton" aria-hidden="true" />
        </div>
      ) : error ? (
        <div className="analytics-chart-state" role="alert">
          <p>{error}</p>
          {onRetry && (
            <button className="btn ghost" type="button" onClick={onRetry}>
              Retry analytics
            </button>
          )}
        </div>
      ) : empty ? (
        <div className="analytics-chart-state" role="status">
          <p>No data yet</p>
        </div>
      ) : (
        children
      )}
    </article>
  )
}
