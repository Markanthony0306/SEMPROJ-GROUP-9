import { useState } from 'react'
import { apiRequest } from '../utils/api'

export default function ResetPassword({ navigate }) {
  const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState('')
  const submit = async (event) => { event.preventDefault(); const token = new URLSearchParams(window.location.search).get('token'); try { const result = await apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }); setMessage(result.message); setTimeout(() => navigate('login'), 1200) } catch (cause) { setError(cause.message) } }
  return <main id="login"><section className="lform clay reset-page"><div className="fhead"><h2>Choose a new password</h2><p>Use at least eight characters.</p></div><form onSubmit={submit}><label className="inp"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" placeholder="New password" required /></label>{error && <p className="err show">{error}</p>}{message && <p>{message}</p>}<button className="btn lbtn">Update password</button></form></section></main>
}
