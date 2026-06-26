import type { Roadmap as RoadmapData, RoadmapItem, Priority } from '../types';
import { PRIORITY_META } from '../lib/ui';

export function Roadmap({
  roadmap, onAdd, onToggle,
}: {
  roadmap: RoadmapData; onAdd: (p: Priority) => void; onToggle: (item: RoadmapItem) => void;
}) {
  return (
    <div>
      <div className="section-bar" style={{ marginBottom: 6 }}>
        <div className="titles">
          <div className="h">Roadmap</div>
          <div className="subtitle">MoSCoW prioritisation</div>
        </div>
      </div>
      <div className="subtitle" style={{ marginBottom: 20 }}>
        What must ship, what should, what could, and what won't — this round. Tick items off as you go;
        the dashboard progress is computed from Must/Should completion.
      </div>

      <div className="road-grid">
        {PRIORITY_META.map((col) => {
          const items = roadmap[col.key];
          return (
            <div className="road-col" key={col.key}>
              <div className="road-col-head">
                <span className="dot" style={{ background: col.color }} />
                <span className="name">{col.label}</span>
                <span className="count">{items.length}</span>
              </div>
              <div className="road-items">
                {items.map((it) => (
                  <div className={`road-item ${it.done ? 'done' : ''}`} key={it.id}>
                    <button
                      className={`road-check ${it.done ? 'on' : ''}`}
                      onClick={() => onToggle(it)}
                      aria-label={it.done ? 'Mark not done' : 'Mark done'}
                      title={it.done ? 'Mark not done' : 'Mark done'}
                    >
                      {it.done ? '✓' : ''}
                    </button>
                    <div className="road-body">
                      <div className="t">
                        {it.title}
                        {it.source === 'hook' && <span className="auto-cue" title="Auto-extracted from a push">auto</span>}
                      </div>
                      {it.note && <div className="note">{it.note}</div>}
                    </div>
                  </div>
                ))}
                <button className="road-add" onClick={() => onAdd(col.key)}>+ Add</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
