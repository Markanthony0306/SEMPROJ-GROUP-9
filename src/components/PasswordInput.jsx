import { useState } from 'react'

function EyeIcon({ hidden }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.8 10.8 0 0 1 12 5c5.5 0 9.2 5.3 9.2 7s-1.3 3.5-3.4 4.9M6.1 6.1C3.9 7.6 2.8 10.2 2.8 12c0 1.7 3.7 7 9.2 7 1 0 1.9-.2 2.8-.5" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.8 12s3.7-7 9.2-7 9.2 5.3 9.2 7-3.7 7-9.2 7-9.2-5.3-9.2-7Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  )
}

export default function PasswordInput({ label, name = 'password', ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="password-field">
      {label}
      <span className="password-wrap">
        <input name={name} type={visible ? 'text' : 'password'} {...props} />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          <EyeIcon hidden={visible} />
        </button>
      </span>
    </label>
  )
}
