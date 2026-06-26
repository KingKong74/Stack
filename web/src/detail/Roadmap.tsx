import type { Roadmap as RoadmapData, Priority } from '../types';
import { PRIORITY_META } from '../lib/ui';

export function Roadmap({ roadmap, onAdd }: { roadmap: RoadmapData; onAdd: (p: Priority) => void }) {
  return (
    <div>
      <div className="section-bar" style={{ marginBottom: 6 }}>
        <div className="titles">
          <div className="h">Roadmap</div>
          <div className="subtitle">MoSCoW prioritization</div>
        </div>
      </div>
      <div className="subtitle" style={{ marginBottom: 20 }}>
        What must ship, what should, what could, and what won't — this round.
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
                {items.map((it, i) => (
                  <div className="road-item" key={i}>
                    <div className="t">{it.title}</div>
                    {it.note && <div className="note">{it.note}</div>}
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
