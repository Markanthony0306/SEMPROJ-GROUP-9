import CreateMemberSheet from '../mobile/CreateMemberSheet'
import { useAuth } from '../../auth/AuthContext'
import RecordDeleteDialog from '../RecordDeleteControls'
import AccountDeleteDialog from '../AccountDeleteDialog'
import AdminMemberDialogs from './AdminMemberDialogs'
import AdminOperationsDialogs from './AdminOperationsDialogs'
export { Pill, memberBadge } from './AdminStatus'

export default function AdminStaffDialogs({
  modal,
  setModal,
  currentUser,
  pending,
  error,
  fieldError,
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
  const { token } = useAuth()
  const idVerificationEnabled = import.meta.env.VITE_ID_VERIFICATION_ENABLED === 'true'
  return (
    <>
      {modal?.kind === 'deactivate-account' && currentUser?.role === 'admin' && (
        <AccountDeleteDialog
          account={modal.member}
          onClose={() => setModal(null)}
          onDeleted={async () => {
            const memberName = modal.member.name
            setModal(null)
            const refreshed = await load()
            setNotice(
              refreshed === false
                ? `${memberName} was deleted. Reload to refresh the member list and totals.`
                : `${memberName} was deleted. The member list and totals are up to date.`
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
      {/* The mobile dashboard supplies sheet presentation to the existing modal steps. */}
      {modal?.kind === 'create' && currentUser?.role === 'admin' && (
        <CreateMemberSheet
          verifyIdentity={idVerificationEnabled}
          token={token}
          plans={data.membershipPlans}
          planOptionLabel={planOptionLabel}
          pending={pending}
          error={error}
          fieldError={fieldError}
          onClose={() => setModal(null)}
          onCreate={createMember}
        />
      )}
      <AdminMemberDialogs
        idVerificationEnabled={idVerificationEnabled}
        modal={modal}
        setModal={setModal}
        pending={pending}
        error={error}
        renewals={renewals}
        money={money}
        date={date}
        updateMember={updateMember}
        data={data}
        planOptionLabel={planOptionLabel}
        recordPayment={recordPayment}
        members={members}
        currentUser={currentUser}
        act={act}
      />
      <AdminOperationsDialogs
        modal={modal}
        setModal={setModal}
        pending={pending}
        error={error}
        act={act}
        currentUser={currentUser}
        enrollFace={enrollFace}
        requestFaceChallenge={requestFaceChallenge}
      />
    </>
  )
}
