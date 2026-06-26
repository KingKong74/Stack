import { useState } from 'react';
import type { ProjectStatus } from '../types';
import { Modal } from './Modal';

const STATUSES: { key: ProjectStatus; label: string }[] = [
  { key: 'building', label: 'Building' },
  { key: 'live', label: 'Live' },
  { key: 'paused', label: 'Paused' },
];

export function NewProjectModal({
  onClose, onCreate,
}: { onClose: () => void; onCreate: (v: { name: string; subtitle: string; status: ProjectStatus }) => void }) {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('building');

  const submit = () => { if (name.trim()) onCreate({ name, subtitle, status }); };

  return (
    <Modal onClose={onClose} wide>
      <h3>New project</h3>
      <div className="lbl">Name</div>
      <input className="field-input" style={{ marginBottom: 16 }} value={name} autoFocus
        placeholder="e.g. Lighthouse" onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
      <div className="lbl">What is it? <span className="optional">optional</span></div>
      <input className="field-input" style={{ marginBottom: 16 }} value={subtitle}
        placeholder="One line — the elevator pitch" onChange={(e) => setSubtitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
      <div className="lbl" style={{ marginBottom: 9 }}>Status</div>
      <div className="seg" style={{ marginBottom: 26 }}>
        {STATUSES.map((s) => (
          <button key={s.key} className={`opt pstatus ${s.key} ${status === s.key ? 'on' : ''}`} onClick={() => setStatus(s.key)}>{s.label}</button>
        ))}
      </div>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-submit" onClick={submit}>Create project</button>
      </div>
    </Modal>
  );
}
