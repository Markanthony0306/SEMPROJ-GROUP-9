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
  return (
    <>
      {modal?.kind === 'deactivate-account' && currentUser?.role === 'admin' && (
        <AccountDeleteDialog
          account={modal.member}
          onClose={() => setModal(null)}
          onDeactivated={async () => {
            setModal(null)

            const refreshed = await load()

            setNotice(
              `Member account deactivated. ${refreshed === false
                ? 'Refresh failed. Reload to see the latest records.'
                : 'Records refreshed.'
              }`
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
      <AdminMemberDialogs
        modal={modal}
        setModal={setModal}
        pending={pending}
        error={error}
        renewals={renewals}
        money={money}
        date={date}
        createMember={createMember}
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
