import { useState } from 'react'
import { apiRequest } from '../utils/api'

export default function ForgotPassword({ navigate }) {
  const [email, setEmail] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState('')
  const submit = async (event) => { event.preventDefault(); try { const result = await apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); setMessage(result.message) } catch (cause) { setError(cause.message) } }
  return <main id="login"><section className="lform clay reset-page"><div className="fhead"><h2>Reset password</h2><p>Enter your account email and we'll send a reset link.</p></div><form onSubmit={submit}><label className="inp"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="john123@gmail.com" required /></label>{error && <p className="err show">{error}</p>}{message && <p>{message}</p>}<button className="btn lbtn">Send reset link</button><button className="btn ghost" type="button" onClick={() => navigate('login')}>Back to login</button></form></section></main>
}
