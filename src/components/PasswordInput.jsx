import { useState } from 'react'
import { EyeIcon, EyeOffIcon, LockIcon } from './icons'

export default function PasswordInput({ label, name = 'password', icon, ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-wrap">
        {icon && (
          <span className="field-icon" aria-hidden="true">
            <LockIcon />
          </span>
        )}
        <input
          className="field-input"
          name={name}
          type={visible ? 'text' : 'password'}
          {...props}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </span>
    </label>
  )
}
