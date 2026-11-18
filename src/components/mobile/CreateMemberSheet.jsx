import { useContext } from 'react'
import MemberIdWizard from '../admin/MemberIdWizard'
import { Modal } from '../admin/AdminDialogParts'
import { DashboardSheetContext } from '../Dialog'

// Keep both feature-flag paths on the same existing registration workflow.
export default function CreateMemberSheet({
  verifyIdentity,
  token,
  plans,
  planOptionLabel,
  pending,
  error,
  fieldError,
  onClose,
  onCreate
}) {
  const mobile = useContext(DashboardSheetContext)
  if (!verifyIdentity) {
    return (
      <Modal title="Create Member Account" onClose={onClose}>
        <p className="form-error" role="alert">
          Member creation requires ID and face verification. Ask the administrator to configure it.
        </p>
        <div className="ma">
          <button className="btn ghost" type="button" onClick={onClose}>Close</button>
        </div>
      </Modal>
    )
  }
  if (verifyIdentity) {
    return (
      <MemberIdWizard
        token={token}
        plans={plans}
        planOptionLabel={planOptionLabel}
        pending={pending}
        error={error}
        fieldError={fieldError}
        onClose={onClose}
        onCreate={onCreate}
      />
    )
  }
  return (
    <Modal
      busy={pending}
      error={error}
      invalidField={fieldError}
      title="Create Member Account"
      onClose={onClose}
    >
      <form onSubmit={onCreate} className="mf">
        <label className="field">
          Full name
          <input
            className="clay-in"
            name="name"
            required
            maxLength={mobile ? 100 : undefined}
            pattern={mobile ? '.*\\S.*' : undefined}
          />
        </label>
        <label className="field">
          Contact number
          <input className="clay-in" name="phone" type="tel" placeholder="Optional" />
        </label>
        <label className="field">
          Email
          <input
            className="clay-in"
            name="email"
            type="email"
            required
            placeholder={mobile ? 'john123@gmail.com' : undefined}
          />
        </label>
        <p className="form-help">
          A temporary password will be shown once so you can give it to the member.
        </p>
        <label className="field">
          Plan
          <select className="clay-in" name="plan" defaultValue="" required>
            <option value="" disabled>
              Select a membership plan
            </option>
            {plans.map((plan) => (
              <option key={plan.plan_id} value={plan.plan_name}>
                {planOptionLabel(plan)}
              </option>
            ))}
          </select>
        </label>
        <p className="form-help">
          Choose the Student plan to apply its configured student rate. Confirm eligibility before
          selecting it.
        </p>
        <label className="field">
          Payment
          <select className="clay-in" name="method">
            <option>Cash</option>
            <option>GCash</option>
          </select>
        </label>
        <p className="form-help">
          Record the payment separately after receiving it.
        </p>
        <div className="ma">
          <button className="btn ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" type="submit">
            Create
          </button>
        </div>
      </form>
    </Modal>
  )
}
