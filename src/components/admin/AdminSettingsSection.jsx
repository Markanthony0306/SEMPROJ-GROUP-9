import ProfilePhoto from '../ProfilePhoto'
import PasswordChangeForm from '../PasswordChangeForm'
import { RockyPreference } from '../gorilla/GorillaAssistant'
import { useContext } from 'react'
import { DashboardSheetContext } from '../Dialog'

export default function AdminSettingsSection({ currentUser, setCurrentUser, profile, pending, loading, settings, data }) {
  // The mobile settings screen can opt in to automatic reminder delivery.
  const mobile = useContext(DashboardSheetContext)
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
        <RockyPreference />
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
            {mobile && (
              <label className="set">
                Send automatic email reminders
                <input key={String(data.settings.emailOn)} type="checkbox" name="emailOn"
                  defaultChecked={Boolean(data.settings.emailOn)} />
              </label>
            )}
            <button className="btn" disabled={pending || loading}>
              {pending ? 'Saving...' : 'Save preferences'}
            </button>
          </form>
        </article>
      </section>
  )
}
