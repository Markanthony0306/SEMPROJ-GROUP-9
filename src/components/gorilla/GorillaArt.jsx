import { useId } from 'react'

// The groups move independently so Rocky can keep both arms raised at rest.
export default function GorillaArt({ mood }) {
  const id = useId()
  const brow =
    mood === 'error'
      ? 'M40 37l10 4m12 0 10-4'
      : mood === 'warning'
        ? 'M40 36q5-7 10-3m12 0q5-4 10 3'
        : 'M40 37q5-4 10-1m12 0q5-3 10 1'
  return (
    <svg viewBox="0 0 112 106" aria-hidden="true" className="rocky-art">
      <defs>
        <linearGradient id={`${id}-fur`} x2="0.38" y2="1">
          <stop stopColor="#5d6288" />
          <stop offset="1" stopColor="#2b2d42" />
        </linearGradient>
        <linearGradient id={`${id}-muzzle`} x2="0" y2="1">
          <stop stopColor="#f6cc9d" />
          <stop offset="1" stopColor="#cc8d67" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id}-fur)`} stroke="#2b2d42" strokeWidth="2">
        <path
          className="rocky-arm rocky-arm-left"
          d="M36 85C18 89 5 81 4 65 3 54 8 44 11 37 5 35 6 23 12 21c4-2 10 0 14 3 5 4 5 10 1 15l-3 14c8-4 17 0 19 8 4 9 1 18-7 24Z"
        />
        <path
          className="rocky-arm rocky-arm-right"
          d="M76 85c18 4 31-4 32-20 1-11-4-21-7-28 6-2 5-14-1-16-4-2-10 0-14 3-5 4-5 10-1 15l3 14c-8-4-17 0-19 8-4 9-1 18 7 24Z"
        />
        <path d="M39 67c-7 6-13 12-11 21 2 11 14 14 28 14s26-3 28-14c2-9-4-15-11-21Z" />
        <circle cx="28" cy="52" r="8" />
        <circle cx="84" cy="52" r="8" />
        <path d="M29 49c0-25 9-40 27-40s27 15 27 40c0 21-10 34-27 34S29 70 29 49Z" />
      </g>
      <path fill="#82617a" opacity=".22" d="M36 89q20 11 40 0c-5 16-35 16-40 0Z" />
      <path
        fill={`url(#${id}-muzzle)`}
        d="M35 47c0-10 5-16 12-16 4 0 7 3 9 5 3-2 6-5 10-5 7 0 11 6 11 16 0 6-3 10-4 11 7 14-3 20-17 20s-24-6-17-20c-2-3-4-7-4-11Z"
      />
      <path fill="#D62828" d="M28 28c2-6 5-10 9-13 14 6 28 6 38 0 4 3 7 8 9 13-17 8-38 8-56 0Z" />
      <path d="M29 25q28 12 54 0" fill="none" stroke="#FCBF49" strokeWidth="2.2" />
      <path d={brow} fill="none" stroke="#392935" strokeWidth="2.5" strokeLinecap="round" />
      <g className="rocky-eyes" fill="#251d2b">
        <ellipse cx="46" cy="49" rx="5" ry="6" />
        <ellipse cx="66" cy="49" rx="5" ry="6" />
        <circle cx="44.5" cy="47" r="1.8" fill="#fff6e9" />
        <circle cx="64.5" cy="47" r="1.8" fill="#fff6e9" />
      </g>
      <g fill="#D62828" opacity=".32">
        <ellipse cx="40" cy="58" rx="4.5" ry="2.4" />
        <ellipse cx="72" cy="58" rx="4.5" ry="2.4" />
      </g>
      <path d="M51 56q5-4 10 0l-3 3h-4Z" fill="#7c483d" />
      <path
        d={mood === 'error' ? 'M51 68q5-4 10 0' : 'M50 65q6 6 12 0'}
        fill="none"
        stroke="#633b39"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
