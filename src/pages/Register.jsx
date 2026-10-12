import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'

export default function Register({ navigate }) {
  const { token } = useAuth(); const [message, setMessage] = useState(''); const [error, setError] = useState('')
  const submit = async (event) => { event.preventDefault(); try { await apiRequest('/admin/members', { method: 'POST', token, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); setMessage('Member account created.') } catch (cause) { setError(cause.message) } }
  return <main id="login"><section className="lform clay reset-page"><div className="fhead"><h2>Create member account</h2></div><form onSubmit={submit}>{['name', 'email', 'password'].map((name) => <label className="inp" key={name}><input name={name} type={name === 'password' ? 'password' : name === 'email' ? 'email' : 'text'} placeholder={name} minLength={name === 'password' ? 8 : undefined} required /></label>)}<input name="plan" type="hidden" value="Monthly" />{error && <p className="err show">{error}</p>}{message && <p>{message}</p>}<button className="btn lbtn">Create</button><button className="btn ghost" type="button" onClick={() => navigate('admin')}>Back</button></form></section></main>
}
