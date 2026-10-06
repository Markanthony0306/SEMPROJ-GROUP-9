import { LockIcon, MailIcon, UserIcon } from './icons'

// Leading icons are an optional themable set shared by every auth form.
// Mail → email fields, Lock → password fields, User → name fields.
const FIELD_ICONS = {
  mail: MailIcon,
  lock: LockIcon,
  user: UserIcon
}

/**
 * Label + input with an optional leading icon. Keeps the native label/input
 * pair so the field stays fully accessible — the icon itself is decorative.
 */
export default function InputField({ label, name, type = 'text', icon, ...props }) {
  const Icon = icon ? FIELD_ICONS[icon] : null
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-wrap">
        {Icon && (
          <span className="field-icon" aria-hidden="true">
            <Icon />
          </span>
        )}
        <input className="field-input" name={name} type={type} {...props} />
      </span>
    </label>
  )
}
