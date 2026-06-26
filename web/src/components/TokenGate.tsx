import { useState } from 'react';
import { setToken, verifyToken } from '../store';
import { PRODUCT_NAME } from '../lib/ui';

// First-load screen: paste the shared API token. It's verified against the API,
// kept in localStorage, and sent on every request. Any 401 clears it and brings
// this screen back.
export function TokenGate() {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const t = value.trim();
    if (!t || busy) return;
    setBusy(true);
    setError('');
    try {
      const ok = await verifyToken(t);
      if (!ok) {
        setError('That token was rejected. Check it and try again.');
        setBusy(false);
        return;
      }
      setToken(t); // flips the app over to the dashboard
    } catch {
      setError('Could not reach the API. Is the server up?');
      setBusy(false);
    }
  };

  return (
    <div className="gate">
      <div className="gate-card">
        <div className="brandmark" style={{ marginBottom: 18 }}>
          <span className="sq" /><span className="word">{PRODUCT_NAME}</span>
        </div>
        <div className="gate-title">Enter your API token</div>
        <div className="gate-sub">
          Stack talks to your self-hosted API. Paste the shared API token to continue —
          it's kept in this browser only.
        </div>
        <input
          className="field-input"
          type="password"
          autoFocus
          placeholder="Bearer token"
          value={value}
          disabled={busy}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        />
        {error && <div className="gate-error">{error}</div>}
        <button className="btn-accent gate-btn" onClick={submit} disabled={busy || !value.trim()}>
          {busy ? 'Checking…' : 'Unlock'}
        </button>
      </div>
    </div>
  );
}
