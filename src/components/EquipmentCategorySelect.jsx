import { EQUIPMENT_CATEGORIES } from '../../shared/equipmentCategories.js'

export default function EquipmentCategorySelect({ value, defaultValue = '', ...props }) {
  const currentCategory = value ?? defaultValue
  const previousCategory = currentCategory && !EQUIPMENT_CATEGORIES.includes(currentCategory)

  return (
    <select
      className="clay-in"
      name="category"
      required
      {...(value === undefined ? { defaultValue } : { value })}
      {...props}
    >
      <option value="" disabled>
        Choose category
      </option>
      {previousCategory && (
        <option value={currentCategory} disabled>
          {currentCategory} (current category)
        </option>
      )}
      {EQUIPMENT_CATEGORIES.map((category) => (
        <option key={category} value={category}>
          {category}
        </option>
      ))}
    </select>
  )
}
