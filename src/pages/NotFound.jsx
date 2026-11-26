import './Login.css'

export default function NotFound({ navigate }) {
  return (
    <main id="login">
      <section className="clay lform login-not-found" aria-labelledby="not-found-title">
        <div className="fhead">
          <h1 id="not-found-title">Page not found</h1>
          <p>Check the address or return to the FitPulse login page.</p>
        </div>
        <button className="btn lbtn" type="button" onClick={() => navigate('login')}>
          Back to login
        </button>
      </section>
    </main>
  )
}
