import ProfilePhoto from '../ProfilePhoto'
import PasswordChangeForm from '../PasswordChangeForm'

export default function AdminSettingsSection({ currentUser, setCurrentUser, profile, pending, loading, setModal, settings, data }) {
  return (
      <section className="grid g2">
        <article className="card clay">
          <h2>Profile</h2>
          <ProfilePhoto user={currentUser} onSaved={setCurrentUser} />
          <form onSubmit={profile} className="mf">
            <label className="field">
              Full name
              <input
                className="clay-in"
                name="name"
                defaultValue={currentUser?.name}
                autoComplete="name"
                required
              />
            </label>
            <label className="field">
              Email
              <input
                className="clay-in"
                name="email"
                defaultValue={currentUser?.email}
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <button className="btn" disabled={pending || loading}>
              {pending ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </article>
        <article className="card clay">
          <h2>Change Password</h2>
          <PasswordChangeForm />
        </article>
        <article className="card clay">
          <h2>Face verification</h2>
          <button
            type="button"
            className="btn ghost"
            disabled={!currentUser?.id}
            onClick={() => setModal({ kind: 'face', member: currentUser })}
          >
            Set up face sign-in
          </button>
        </article>
        <article className="card clay">
          <h2>Gym Preferences</h2>
          <form onSubmit={settings} className="mf">
            <label className="field">
              Gym name
              <input className="clay-in" name="gym" defaultValue={data.settings.gym} />
            </label>
            <label className="field">
              Expiry reminder
              <select className="clay-in" name="remind" defaultValue={data.settings.remind}>
                <option value="3">3 days</option>
                <option value="5">5 days</option>
                <option value="7">7 days</option>
              </select>
            </label>
            <button className="btn" disabled={pending || loading}>
              {pending ? 'Saving...' : 'Save preferences'}
            </button>
          </form>
        </article>
      </section>
  )
}
