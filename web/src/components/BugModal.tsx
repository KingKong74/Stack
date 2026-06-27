import { useState } from 'react';
import type { Severity } from '../types';
import { Modal } from './Modal';
import { SEVERITY_ORDER } from '../lib/ui';

export function BugModal({
  onClose, onSubmit, initialTitle = '',
}: { onClose: () => void; onSubmit: (v: { title: string; severity: Severity }) => void; initialTitle?: string }) {
  const [title, setTitle] = useState(initialTitle);
  const [severity, setSeverity] = useState<Severity>('medium');
  const submit = () => { if (title.trim()) onSubmit({ title, severity }); };

  return (
    <Modal onClose={onClose}>
      <h3>Report a bug</h3>
      <div className="lbl">Title</div>
      <input className="field-input" style={{ marginBottom: 18 }} value={title} autoFocus
        placeholder="What's broken?" onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
      <div className="lbl" style={{ marginBottom: 9 }}>Severity</div>
      <div className="seg" style={{ marginBottom: 26 }}>
        {SEVERITY_ORDER.map((s) => (
          <button key={s} className={`opt sev ${s} ${severity === s ? 'on' : ''}`} onClick={() => setSeverity(s)}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-submit" onClick={submit}>Add bug</button>
      </div>
    </Modal>
  );
}
