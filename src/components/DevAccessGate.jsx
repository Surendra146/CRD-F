import { useState, useSyncExternalStore } from 'react';
import { BASE_URL } from '../config/apiConfig';
import { devAccessEnabled, getDevToken, subscribeDevAccess, loginDevAccess, logoutDevAccess } from '../services/devAccess';

export default function DevAccessGate({ children }) {
  const token = useSyncExternalStore(subscribeDevAccess, getDevToken, getDevToken);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [entered, setEntered] = useState(false);
  if (!devAccessEnabled) return children;
  if (token) return <><div style={{ padding: 8, background: '#fef3c7' }}>Development environment <button onClick={() => logoutDevAccess(BASE_URL).catch((err) => setError(err.message))}>Lock development access</button></div>{children}</>;
  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError('');
    const submitted = password; setPassword('');
    try { await loginDevAccess(BASE_URL, submitted); setEntered(true); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <main style={{ maxWidth: 420, margin: '12vh auto', padding: 24 }}>
    <h1>Development access</h1>
    <p>{entered ? 'Development session expired or locked. Authenticate again to continue.' : 'Enter the development-only password to continue to HanuRam Tech login.'}</p>
    <form onSubmit={submit}>
      <label htmlFor="dev-password">Development password</label>
      <input id="dev-password" type="password" autoComplete="off" required value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
      <button type="submit" disabled={busy}>{busy ? 'Checking…' : 'Continue'}</button>
    </form>
    {error && <p role="alert">{error}</p>}
  </main>;
}
