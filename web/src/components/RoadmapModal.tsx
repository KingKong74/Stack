import { useState } from 'react';
import type { Priority } from '../types';
import { Modal } from './Modal';
import { PRIORITY_META } from '../lib/ui';

export function RoadmapModal({
  initialPriority, onClose, onSubmit,
}: {
  initialPriority: Priority; onClose: () => void;
  onSubmit: (v: { title: string; note: string; priority: Priority }) => void;
}) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState<Priority>(initialPriority);
  const submit = () => { if (title.trim()) onSubmit({ title, note, priority }); };

  return (
    <Modal onClose={onClose} wide>
      <h3>Add roadmap item</h3>
      <div className="lbl">What is it?</div>
      <input className="field-input" style={{ marginBottom: 16 }} value={title} autoFocus
        placeholder="e.g. Offline map caching" onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
      <div className="lbl">Note <span className="optional">optional</span></div>
      <textarea className="field-area" style={{ marginBottom: 18 }} value={note}
        placeholder="Why it matters, or context…" onChange={(e) => setNote(e.target.value)} />
      <div className="lbl" style={{ marginBottom: 9 }}>Priority</div>
      <div className="seg" style={{ marginBottom: 26 }}>
        {PRIORITY_META.map((p) => (
          <button key={p.key} className={`opt prio ${p.key} ${priority === p.key ? 'on' : ''}`} onClick={() => setPriority(p.key)}>
            {p.short}
          </button>
        ))}
      </div>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-submit" onClick={submit}>Add item</button>
      </div>
    </Modal>
  );
}
