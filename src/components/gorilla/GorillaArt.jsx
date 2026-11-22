const expressions = {
  wink: {
    brows: 'M43 37q5-4 10-1m13 0q5-3 10 1',
    eyes: 'M65 47q5-4 10 0',
    mouth: 'M52 59q8 8 16-1'
  },
  happy: {
    brows: 'M43 36q5-4 10-1m13 0q5-3 10 1',
    eyes: 'M43 47q5-7 10 0m13 0q5-7 10 0',
    mouth: 'M51 57q9 8 18 0-2 11-9 11t-9-11Z'
  },
  angry: { brows: 'm42 36 13 5m10 0 13-5', eyes: 'M44 47h8m15 0h8', mouth: 'M53 63q7-7 14 0' },
  worried: {
    brows: 'M42 40q6-1 11-6m13 0q5 5 11 6',
    eyes: 'M48 46v3m23-3v3',
    mouth: 'M55 62q5-4 10 0'
  }
}

// The face is a separate layer so the outfit and props stay in place.
export default function GorillaArt({ mood = 'wink' }) {
  return (
    <svg viewBox="0 0 120 114" aria-hidden="true" className="rocky-art">
      <path
        d="M86 91c24 11 34-5 25-14-4-4-10-1-10 4"
        fill="none"
        stroke="#905538"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M40 69q20-13 41 0l10 27q-4 11-31 11t-31-11Z"
        fill="var(--navy, #003049)"
        stroke="#567284"
        strokeWidth="2"
      />
      <path d="M44 72q15 14 31 0" fill="none" stroke="#7995a5" strokeWidth="2.5" />
      <path
        d="M36 84h5l3-4 3 8 3-4h6"
        fill="none"
        stroke="var(--orange, #f77f00)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g fill="#a56b45" stroke="#683923" strokeWidth="2">
        <circle cx="26" cy="43" r="13" />
        <circle cx="94" cy="43" r="13" />
        <path d="M31 44c0-20 10-33 22-34 4-7 14-8 19-5l-4 5c14 5 21 16 21 34 0 21-12 32-29 32S31 65 31 44Z" />
        <path d="M33 75q-15 3-15 15 1 8 12 9l7-8q-13-4-4-9Z" />
        <path d="M86 74q13 3 14 14 0 10-11 11l-4-9q8-2 1-9Z" />
      </g>
      <g fill="#db946c">
        <circle cx="27" cy="43" r="7" />
        <circle cx="93" cy="43" r="7" />
      </g>
      <path
        d="M36 46c0-12 6-18 14-18 5 0 9 3 10 6 3-3 6-6 11-6 8 0 13 6 13 18 0 4-1 8-4 11 2 11-8 17-20 17s-22-6-20-17c-2-3-4-7-4-11Z"
        fill="#f5c390"
      />
      <path
        d="M31 24q28 10 57-1l3 11q-30 12-61 1Z"
        fill="var(--orange, #f77f00)"
        stroke="#a64c0a"
        strokeWidth="1.5"
      />
      <path d="M33 27q28 10 54-1" fill="none" stroke="#ffd08a" strokeWidth="2" />
      <path
        d="M89 28l14-8-1 8 8 4-16 2 8 6-7 2-8-10Z"
        fill="var(--orange, #f77f00)"
        stroke="#a64c0a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M55 52q5-3 10 0l-2 3h-6Z" fill="#9f583a" />
      {Object.entries(expressions).map(([name, face]) => (
        <g
          key={name}
          className="rocky-expression"
          data-active={mood === name}
          fill="none"
          stroke="#512d22"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={face.brows} />
          <g className="rocky-eyes">
            <path d={face.eyes} />
            {name === 'wink' && (
              <ellipse cx="48" cy="47" rx="3.4" ry="4.2" fill="#512d22" stroke="none" />
            )}
          </g>
          <path d={face.mouth} fill={name === 'happy' ? '#512d22' : 'none'} />
        </g>
      ))}
      <g transform="rotate(9 75 96)">
        <rect
          x="59"
          y="79"
          width="34"
          height="29"
          rx="4"
          fill="#fff3d9"
          stroke="#b67541"
          strokeWidth="2"
        />
        <path
          d="M66 88h19m-19 6h16m-16 6h12"
          fill="none"
          stroke="#997457"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path d="M68 77h8v5h-8Z" fill="#f1bc60" />
      </g>
      <path
        d="m27 94 20-16 4 4-19 17-7 2Z"
        fill="#ffcf52"
        stroke="#83441f"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="m46 79 4-3 4 4-4 3Z" fill="#f38470" stroke="#83441f" strokeWidth="1.2" />
      <path d="M23 91q6-4 10 0t-1 7q-6 3-9-1Z" fill="#a56b45" stroke="#683923" strokeWidth="1.8" />
      <path d="M89 88q8-3 10 3t-7 7q-5-1-3-10Z" fill="#a56b45" stroke="#683923" strokeWidth="1.8" />
    </svg>
  )
}
