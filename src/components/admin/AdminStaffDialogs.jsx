import { useState } from 'react'
import DataTable from '../DataTable'
import ProfileAvatar from '../ProfileAvatar'
import FaceCapture from '../FaceCapture'
import CreatedMemberCredentials from '../CreatedMemberCredentials'
import Dialog from '../Dialog'
import Spinner from '../Spinner'
import RecordDeleteDialog from '../RecordDeleteControls'
import AccountDeleteDialog from '../AccountDeleteDialog'
import EquipmentCategorySelect from '../EquipmentCategorySelect'
import MemberIdWizard from './MemberIdWizard'
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
        <p className="form-help loading-inline" role="status">
          <Spinner /> Saving…
        </p>
      )}
      <fieldset className="modal-fields" disabled={busy}>
        {children}
      </fieldset>
    </Dialog>
  )
}

function FaceEnrollmentForm({ selfEnrollment, adminEnrollment, onEnroll, getChallenge, busy }) {
  const [consent, setConsent] = useState(false)
  const [idChecked, setIdChecked] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')

  return (
    <div className="mf face-enrollment-form">
      {adminEnrollment && (
        <p>The gym must set up your ID portrait first. After your first enrollment, sign in again to verify your face.</p>
      )}
      <details className="face-enrollment-terms">
        <summary>Face verification terms</summary>
        <ul>
          <li>
            FitPulse uses your face to verify your identity when you sign in and to check for
            duplicate enrollments.
          </li>
          <li>
            Camera frames are sent to the server for each live check and discarded after
            processing. An encrypted face template is stored for future verification.
          </li>
          <li>
            You can ask the gym to remove your face template. Removing it can block future sign-in.
          </li>
        </ul>
        {!selfEnrollment && (
          <p>Staff must explain these terms and obtain the member's agreement before continuing.</p>
        )}
      </details>
      {!selfEnrollment && (
        <label className="set">
          <input type="checkbox" checked={idChecked} onChange={(event) => setIdChecked(event.target.checked)} />
          <span>I checked the member's photo ID.</span>
        </label>
      )}
      <label className="set">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
        <span>
          {selfEnrollment
            ? 'I have read and agree to the face verification terms.'
            : 'The member has agreed to the face verification terms.'}
        </span>
      </label>
      {selfEnrollment && (
        <label className="field">
          Current password
          <input
            className="clay-in"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>
      )}
      <FaceCapture
        getChallenge={getChallenge}
        onCaptured={(capture) => onEnroll({ ...capture, consent, idChecked, currentPassword })}
        purpose="enrollment"
        disabled={busy || !consent || (selfEnrollment ? !currentPassword : !idChecked)}
        actionLabel="Capture and save"
      />
    </div>
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
  token,
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
  requestFaceChallenge,
  recordPayment
}) {
  const [accountDeleted, setAccountDeleted] = useState(false)

  return (
    <>
      {accountDeleted && (
        <div className="dashboard-feedback account-deletion-toast" role="status">
          <span>Member account deleted.</span>
          <button type="button" aria-label="Dismiss message" onClick={() => setAccountDeleted(false)}>
            &times;
          </button>
        </div>
      )}
      {modal?.kind === 'delete-account' && currentUser?.role === 'admin' && (
        <AccountDeleteDialog
          account={modal.member}
          onClose={() => setModal(null)}
          onDeleted={async () => {
            setModal(null)
            await load()
            setAccountDeleted(true)
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
              {modal.member.idVerified && <span className="pill p-ok">ID verified</span>}
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
            {currentUser?.role === 'admin' && (
              <button className="btn ghost" type="button" onClick={() => setModal({ kind: 'face', member: modal.member })}>
                Face setup
              </button>
            )}
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
        <MemberIdWizard
          token={token}
          plans={data.membershipPlans}
          planOptionLabel={planOptionLabel}
          pending={pending}
          error={error}
          onClose={() => setModal(null)}
          onCreate={createMember}
        />
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
      {modal?.kind === 'credentials' && (
        <Modal title="Create member account" className="id-check-dialog" onClose={() => setModal(null)}>
          <div className="id-check-success" role="status">
            <span aria-hidden="true">✓</span>
            <h3>Successful creation of a new member</h3>
            <p>Face enrollment is complete.</p>
          </div>
          <CreatedMemberCredentials
            member={modal.member}
            temporaryPassword={modal.temporaryPassword}
            onDismiss={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.kind === 'face' && currentUser?.role === 'admin' && (
        <Modal
          busy={pending}
          error={error}
          title={`Face enrollment: ${modal.member.name}`}
          className="face-enrollment-dialog"
          onClose={() => setModal(null)}
        >
          <FaceEnrollmentForm
            selfEnrollment={modal.member.id === currentUser?.id}
            adminEnrollment={modal.member.role === 'admin'}
            onEnroll={enrollFace}
            getChallenge={requestFaceChallenge}
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
