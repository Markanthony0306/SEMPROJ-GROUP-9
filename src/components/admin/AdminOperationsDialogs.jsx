import EquipmentCategorySelect from '../EquipmentCategorySelect'
import { FaceEnrollmentForm, Modal } from './AdminDialogParts'

export default function AdminOperationsDialogs({ modal, setModal, pending, error, act, currentUser, enrollFace, requestFaceChallenge }) {
  return (
    <>
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
      {modal?.kind === 'face' && (
        <Modal
          busy={pending}
          error={error}
          title={`Face enrollment: ${modal.member.name}`}
          className="face-enrollment-dialog"
          onClose={() => setModal(null)}
        >
          <FaceEnrollmentForm
            selfEnrollment={modal.member.id === currentUser?.id}
            onEnroll={enrollFace}
            getChallenge={requestFaceChallenge}
            busy={pending}
          />
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
