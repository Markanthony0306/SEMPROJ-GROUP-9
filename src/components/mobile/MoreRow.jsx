// Use the same full-width target for links, theme and sign-out actions.
export default function MoreRow({ icon, label, trailing = '›', onClick, ...attributes }) {
  return (
    <button type="button" className="fitpulse-more-row" onClick={onClick} {...attributes}>
      <span className="fitpulse-icon-chip">{icon}</span>
      <span>{label}</span>
      <span className="fitpulse-more-trailing" aria-hidden="true">
        {trailing}
      </span>
    </button>
  )
}
