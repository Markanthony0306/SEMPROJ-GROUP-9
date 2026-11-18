// Keep section navigation visible alongside the list title.
export default function SectionHeader({ title, onViewAll }) {
  return (
    <div className="fitpulse-section-header">
      <h2>{title}</h2>
      {onViewAll && (
        <button
          className="fitpulse-text-button"
          type="button"
          aria-label={`View all ${title.toLowerCase()}`}
          onClick={onViewAll}
        >
          View All →
        </button>
      )}
    </div>
  )
}
