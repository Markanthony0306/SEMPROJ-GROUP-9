import { MEMBERSHIP_PLANS } from '../../shared/membershipPlans.js'

const price = (value) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)

export default function MembershipPlanField({ defaultValue = 'Monthly', value, onChange }) {
  return (
    <label className="field">
      Plan
      <select
        className="clay-in"
        name="plan"
        required
        {...(value === undefined ? { defaultValue } : { value })}
        onChange={onChange}
      >
        {MEMBERSHIP_PLANS.map((plan) => (
          <option key={plan.name} value={plan.name}>
            {plan.name} · {plan.durationDays} days · {price(plan.price)}
          </option>
        ))}
      </select>
    </label>
  )
}
