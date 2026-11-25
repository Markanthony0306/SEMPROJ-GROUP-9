import { lazy, Suspense } from 'react'
import RecordDeleteDialog from '../RecordDeleteControls'
import AccountDeleteDialog from '../AccountDeleteDialog'
import HeartRateLoader from '../HeartRateLoader'
import AdminMemberDialogs from './AdminMemberDialogs'
import AdminOperationsDialogs from './AdminOperationsDialogs'
export { Pill, memberBadge } from './AdminStatus'

const CreateMemberSheet = lazy(() => import('../mobile/CreateMemberSheet'))

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
  token,
  updateMember,
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
              `Member account deleted. ${refreshed === false
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
      {/* The mobile dashboard supplies the compact dialog presentation. */}
      {modal?.kind === 'create' && currentUser?.role === 'admin' && (
        <Suspense fallback={<HeartRateLoader message="Opening member registration" />}>
          <CreateMemberSheet
            plans={data.membershipPlans}
            planOptionLabel={planOptionLabel}
            pending={pending}
            error={error}
            fieldError={fieldError}
            onClose={() => setModal(null)}
            onCreate={createMember}
            token={token}
          />
        </Suspense>
      )}
      <AdminMemberDialogs
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
      />
    </>
  )
}
