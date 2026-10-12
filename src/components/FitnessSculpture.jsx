import { useId } from 'react'

export default function FitnessSculpture({ variant = 'weights' }) {
  const id = useId().replaceAll(':', '')
  return (
    <svg className="fitness-sculpture" viewBox="0 0 240 180" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-orange`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ffcc70" />
          <stop offset="0.5" stopColor="#f77f00" />
          <stop offset="1" stopColor="#c65313" />
        </linearGradient>
        <linearGradient id={`${id}-navy`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#5b829b" />
          <stop offset="0.5" stopColor="#164761" />
          <stop offset="1" stopColor="#003049" />
        </linearGradient>
      </defs>
      <ellipse cx="125" cy="154" rx="82" ry="12" fill="var(--text)" opacity="0.08" />
      {variant === 'scanner' ? (
        <g>
          <path d="M60 45 157 23 191 43 92 68Z" fill="#5b829b" />
          <path d="M60 45 92 68v80l-32-23Z" fill="#003049" />
          <path d="M92 68 191 43v80l-99 25Z" fill={`url(#${id}-navy)`} />
          <path d="m108 78 65-17v46l-65 17Z" fill="#e7edf7" />
          <g stroke="#164761" strokeWidth="5" fill="none">
            <path d="m117 83 16-4v15l-16 4ZM146 76l16-4v15l-16 4ZM117 105l16-4v12l-16 4Z" />
            <path d="m146 99 6-2v14l11-3" />
          </g>
          <path d="m98 92 88-23" stroke="#f77f00" strokeWidth="3" />
          <ellipse cx="179" cy="118" rx="4" ry="3" fill="#fcbf49" />
        </g>
      ) : (
        <g transform="rotate(-18 120 90)">
          <rect x="69" y="80" width="104" height="19" rx="9" fill={`url(#${id}-navy)`} />
          <rect x="31" y="49" width="30" height="80" rx="14" fill={`url(#${id}-orange)`} />
          <rect x="58" y="39" width="28" height="100" rx="13" fill={`url(#${id}-navy)`} />
          <rect x="160" y="39" width="28" height="100" rx="13" fill={`url(#${id}-navy)`} />
          <rect x="186" y="49" width="30" height="80" rx="14" fill={`url(#${id}-orange)`} />
          <g fill="#fff" opacity="0.28">
            <rect x="37" y="60" width="5" height="48" rx="2" />
            <rect x="64" y="50" width="4" height="66" rx="2" />
            <rect x="166" y="50" width="4" height="66" rx="2" />
            <rect x="192" y="60" width="5" height="48" rx="2" />
          </g>
        </g>
      )}
    </svg>
  )
}
