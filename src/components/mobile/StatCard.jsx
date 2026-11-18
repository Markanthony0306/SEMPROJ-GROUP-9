// Label and value stay together when the grid narrows to a phone.
export default function StatCard({ icon, label, value }) {
  return (
    <article className="fitpulse-stat">
      <span className="fitpulse-icon-chip">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  )
}
