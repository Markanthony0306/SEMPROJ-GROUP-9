import PasswordChangeForm from '../components/PasswordChangeForm'
import '../styles/dashboard-features.css'
import './ChangePasswordPage.css'

export default function ChangePasswordPage({ onComplete, onSignOut }) {
  return (
    <main className="app password-gate">
      <section className="card clay">
        <h1>Change password</h1>
        <p className="form-help">Choose your own password before continuing to FitPulse.</p>
        <PasswordChangeForm requiredChange onChanged={onComplete} />
        <button className="btn ghost" type="button" onClick={onSignOut}>
          Sign out
        </button>
      </section>
    </main>
  )
}
