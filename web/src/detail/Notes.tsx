import { useState } from 'react';
import type { Note } from '../types';

export function Notes({
  notes, onAdd, onDelete,
}: { notes: Note[]; onAdd: (text: string) => void; onDelete: (id: number) => void }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onAdd(t);
    setDraft('');
  };

  return (
    <div>
      <div className="section-bar" style={{ marginBottom: 6 }}>
        <div className="titles">
          <div className="h">Notes</div>
          <div className="subtitle">Quick capture — ideas, reminders, things to fix</div>
        </div>
      </div>
      <div className="note-intro">No structure, no pressure. Jot it and get back to building.</div>

      <div className="composer">
        <textarea
          value={draft}
          placeholder="Jot an idea, a thing to fix, anything…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add(); } }}
        />
        <div className="row">
          <span className="hint">⏎ to add · ⇧⏎ for newline</span>
          <button className="add" onClick={add}>Add note</button>
        </div>
      </div>

      <div className="notes-wall">
        {notes.map((n, i) => (
          <div className="note" key={n.id} style={{ background: n.colour, transform: `rotate(${i % 2 ? 0.7 : -0.7}deg)` }}>
            <button className="x" onClick={() => onDelete(n.id)} aria-label="Delete note">×</button>
            <div className="txt">{n.text}</div>
            <div className="when">{n.when}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
