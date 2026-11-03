import { useState } from 'react'
import DataTable from '../DataTable'
import ProfileAvatar from '../ProfileAvatar'
import FaceCapture from '../FaceCapture'
import Dialog from '../Dialog'
import RecordDeleteDialog from '../RecordDeleteControls'
import AccountDeleteDialog from '../AccountDeleteDialog'
import EquipmentCategorySelect from '../EquipmentCategorySelect'
import { membershipState } from '../../utils/membership'

function Modal({ title, children, onClose, busy, error, className }) {
  return (
    <Dialog title={title} onClose={onClose} busy={busy} className={className}>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {busy && (
        <p className="form-help" role="status">
          Saving...
        </p>
      )}
      <fieldset className="modal-fields" disabled={busy}>
        {children}
      </fieldset>
    </Dialog>
  )
}

function FaceEnrollmentForm({ member, onEnroll, onCancel, busy }) {
  const [descriptor, setDescriptor] = useState(null)
  const [consent, setConsent] = useState(false)
  const [idChecked, setIdChecked] = useState(false)

  return (
    <form
      className="mf face-enrollment-form"
      onSubmit={(event) => {
        event.preventDefault()
        if (!descriptor || !consent || !idChecked) return
        onEnroll({ descriptor, consent, idChecked })
      }}
    >
      <p className="form-help">
        Help {member.name} set up face verification. First confirm their ID and permission, then
        take a clear capture while they are here with you.
      </p>
      <label className="set">
        I checked the member's photo ID and it matches their account.
        <input
          type="checkbox"
          checked={idChecked}
          onChange={(event) => {
            setIdChecked(event.target.checked)
            setDescriptor(null)
          }}
          required
        />
      </label>
      <label className="set">
        The member agrees to face verification and understands how their face data is used below.
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => {
            setConsent(event.target.checked)
            setDescriptor(null)
          }}
          required
        />
      </label>
      <FaceCapture
        onCaptured={setDescriptor}
        onReset={() => setDescriptor(null)}
        purpose="enrollment"
        disabled={busy || !consent || !idChecked}
        actionLabel={descriptor ? 'Capture again' : 'Capture face'}
      />
      <div className="ma">
        <button
          className="btn"
          type="submit"
          disabled={busy || !descriptor || !consent || !idChecked}
        >
          Save
        </button>
        <button className="btn ghost" type="button" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export function Pill({ status }) {
  const state = String(status || '').toLowerCase()
  return (
    <span
      className={`pill ${state === 'active' || state === 'good' ? 'p-ok' : state === 'expired' || state === 'out of service' ? 'p-bad' : 'p-warn'}`}
    >
      {status || 'Active'}
    </span>
  )
}
export function memberBadge(member) {
  const state = membershipState(member)
  return state.status === 'active' && state.daysLeft <= 7 ? 'Expiring' : state.label
}

export default function AdminStaffDialogs({
  modal,
  setModal,
  currentUser,
  pending,
  error,
  deletion,
  setDeletion,
  load,
  setNotice,
  renewals,
  money,
  date,
  members,
  data,
  planOptionLabel,
  act,
  createMember,
  updateMember,
  enrollFace,
  recordPayment
}) {
  return (
    <>
      {modal?.kind === 'delete-account' && currentUser?.role === 'admin' && (
        <AccountDeleteDialog
          account={modal.member}
          onClose={() => setModal(null)}
          onDeleted={async () => {
            setModal(null)
            const refreshed = await load()
            setNotice(
              `Member account deleted. ${refreshed === false ? 'Refresh failed. Reload to see the latest records.' : 'Records refreshed.'}`
            )
          }}
        />
      )}
      {deletion && (
        <RecordDeleteDialog
          target={deletion}
          onClose={() => setDeletion(null)}
          onChanged={load}
          onNotice={setNotice}
        />
      )}
      {modal?.kind === 'view' && (
        <Modal
          busy={pending}
          error={error}
          title="Member profile"
          className="member-profile-dialog"
          onClose={() => setModal(null)}
        >
          <div className="member-profile-summary">
            <ProfileAvatar user={modal.member} memberId={modal.member.id} large />
            <div>
              <strong className="profile-name">{modal.member.name}</strong>
              <span className="member-profile-code">
                {modal.member.memberCode || modal.member.id}
              </span>
              <Pill status={memberBadge(modal.member)} />
            </div>
          </div>
          <section className="member-profile-section" aria-label="Contact details">
            <h3>Contact details</h3>
            <dl className="member-record">
              {[
                ['Email', modal.member.email],
                ['Phone', modal.member.phone || 'Not added']
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="member-profile-section" aria-label="Membership details">
            <h3>Membership</h3>
            <dl className="member-record">
              {[
                ['Plan', modal.member.plan || 'Not set'],
                ['Status', membershipState(modal.member).label],
                ['Starts', date(modal.member.membershipStart || modal.member.joined)],
                ['Expires', date(modal.member.membershipEnd)]
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <div className="ma">
            <button
              className="btn ghost"
              type="button"
              onClick={() => setModal({ kind: 'face', member: modal.member })}
            >
              Face setup
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => setModal({ kind: 'renew', member: modal.member })}
            >
              Renew membership
            </button>
          </div>
          <section className="member-profile-section" aria-label="Renewal history">
            <h3>Renewal history</h3>
            <DataTable
              headings={['Plan', 'Amount', 'Method', 'Date']}
              caption="Member renewal history"
              searchable={false}
            >
              {renewals
                .filter((payment) => payment.memberId === modal.member.id)
                .map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.plan}</td>
                    <td>{money(payment.amount)}</td>
                    <td>{payment.method}</td>
                    <td>{date(payment.date)}</td>
                  </tr>
                ))}
            </DataTable>
          </section>
        </Modal>
      )}
      {modal?.kind === 'maintenance' && (
        <Modal
          busy={pending}
          error={error}
          title="Log maintenance or repair"
          onClose={() => setModal(null)}
        >
          <form
            className="mf"
            onSubmit={(event) => {
              event.preventDefault()
              const values = Object.fromEntries(new FormData(event.currentTarget))
              act(
                `/admin/equipment/${modal.item.id}`,
                { method: 'PATCH', body: JSON.stringify(values) },
                'Maintenance recorded.'
              )
            }}
          >
            <p className="form-help">{modal.item.name}</p>
            <label className="field">
              Work completed
              <textarea
                className="clay-in"
                name="maintenanceNote"
                rows="4"
                maxLength="500"
                placeholder="Describe the inspection, maintenance, or repair."
                required
              />
            </label>
            <label className="field">
              Condition after work
              <select className="clay-in" name="condition" defaultValue={modal.item.condition}>
                <option>Good</option>
                <option>Needs Maintenance</option>
                <option>Out of Service</option>
              </select>
            </label>
            <div className="ma">
              <button className="btn" type="submit">
                Save maintenance
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal?.kind === 'create' && currentUser?.role === 'admin' && (
        <Modal
          busy={pending}
          error={error}
          title="Create Member Account"
          onClose={() => setModal(null)}
        >
          <form onSubmit={createMember} className="mf">
            <label className="field">
              Full name
              <input className="clay-in" name="name" required />
            </label>
            <label className="field">
              Contact number
              <input className="clay-in" name="phone" />
            </label>
            <label className="field">
              Email
              <input className="clay-in" name="email" type="email" required />
            </label>
            <p className="form-help">
              A temporary password will be generated and emailed to the member.
            </p>
            <label className="field">
              Plan
              <select className="clay-in" name="plan" defaultValue="" required>
                <option value="" disabled>
                  Select a membership plan
                </option>
                {data.membershipPlans.map((plan) => (
                  <option key={plan.plan_id} value={plan.plan_name}>
                    {planOptionLabel(plan)}
                  </option>
                ))}
              </select>
            </label>
            <p className="form-help">
              Choose the Student plan to apply its configured student rate. Confirm eligibility
              before selecting it.
            </p>
            <label className="field">
              Payment
              <select className="clay-in" name="method">
                <option>Cash</option>
                <option>GCash</option>
              </select>
            </label>
            <label className="set">
              Payment already received
              <input type="checkbox" name="recordPayment" />
            </label>
            <p className="form-help">
              Check this only after receiving the plan payment through Cash or GCash.
            </p>
            <div className="ma">
              <button className="btn ghost" type="button" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="btn">Create</button>
            </div>
          </form>
        </Modal>
      )}
      {modal?.kind === 'edit' && (
        <Modal busy={pending} error={error} title="Edit Member" onClose={() => setModal(null)}>
          <form onSubmit={updateMember} className="mf">
            <label className="field">
              Full name
              <input className="clay-in" name="name" defaultValue={modal.member.name} required />
            </label>
            <label className="field">
              Contact
              <input className="clay-in" name="phone" defaultValue={modal.member.phone} />
            </label>
            <label className="field">
              Email
              <input
                className="clay-in"
                name="email"
                type="email"
                defaultValue={modal.member.email}
                required
              />
            </label>
            <div className="ma">
              <button className="btn">Save changes</button>
            </div>
          </form>
        </Modal>
      )}
      {modal?.kind === 'face' && (
        <Modal
          busy={pending}
          error={error}
          title={`Face enrollment: ${modal.member.name}`}
          className="face-enrollment-dialog"
          onClose={() => setModal(null)}
        >
          <FaceEnrollmentForm
            member={modal.member}
            onEnroll={enrollFace}
            onCancel={() => setModal(null)}
            busy={pending}
          />
        </Modal>
      )}
      {modal?.kind === 'renew' && (
        <Modal busy={pending} error={error} title="Renew Membership" onClose={() => setModal(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const form = new FormData(event.currentTarget)
              act(
                `/admin/members/${modal.member.id}/renew`,
                { method: 'POST', body: JSON.stringify(Object.fromEntries(form)) },
                'Membership renewed.'
              )
            }}
            className="mf"
          >
            <p>
              {modal.member.name} · {modal.member.plan}
            </p>
            <label className="field">
              Plan
              <select
                className="clay-in"
                name="plan"
                defaultValue={
                  data.membershipPlans.some((plan) => plan.plan_name === modal.member.plan)
                    ? modal.member.plan
                    : ''
                }
                required
              >
                <option value="" disabled>
                  Select a membership plan
                </option>
                {data.membershipPlans.map((plan) => (
                  <option key={plan.plan_id} value={plan.plan_name}>
                    {planOptionLabel(plan)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Payment method
              <select className="clay-in" name="method">
                <option>Cash</option>
                <option>GCash</option>
              </select>
            </label>
            <div className="ma">
              <button className="btn">Renew</button>
            </div>
          </form>
        </Modal>
      )}
      {modal?.kind === 'payment' && (
        <Modal busy={pending} error={error} title="Record Payment" onClose={() => setModal(null)}>
          <form onSubmit={recordPayment} className="mf">
            <p className="form-help">Record a Cash or GCash payment already received at the gym.</p>
            <label className="field">
              Member
              <select className="clay-in" name="memberId">
                {members.map((member) => (
                  <option value={member.id} key={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Amount
              <input
                className="clay-in"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
              />
            </label>
            <label className="field">
              Method
              <select className="clay-in" name="method">
                <option>Cash</option>
                <option>GCash</option>
              </select>
            </label>
            <div className="ma">
              <button className="btn">Save payment</button>
            </div>
          </form>
        </Modal>
      )}
      {modal?.kind === 'equipment' && (
        <Modal busy={pending} error={error} title="Add Equipment" onClose={() => setModal(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              act(
                '/admin/equipment',
                {
                  method: 'POST',
                  body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))
                },
                'Equipment added.'
              )
            }}
            className="mf"
          >
            <label className="field">
              Equipment name
              <input className="clay-in" name="name" required />
            </label>
            <label className="field">
              Category
              <EquipmentCategorySelect />
            </label>
            <div className="ma">
              <button className="btn">Add</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}