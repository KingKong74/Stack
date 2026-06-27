import type { Bug, BugStatus } from '../types';
import { STATUS_LABEL } from '../lib/ui';

type BugFilter = 'all' | 'open' | 'fixing' | 'fixed';

const matches = (b: Bug, f: BugFilter) =>
  f === 'all' ? true : f === 'open' ? (b.status === 'open' || b.status === 'investigating') : b.status === f;

export function Bugs({
  bugs, filter, setFilter, onReport, onOpenLink, highlightId,
}: {
  bugs: Bug[]; filter: BugFilter; setFilter: (f: BugFilter) => void;
  onReport: () => void; onOpenLink: (hash: string) => void; highlightId?: string | null;
}) {
  const counts = {
    all: bugs.length,
    open: bugs.filter((b) => b.status === 'open' || b.status === 'investigating').length,
    fixing: bugs.filter((b) => b.status === 'fixing').length,
    fixed: bugs.filter((b) => b.status === 'fixed').length,
  };
  const openCount = bugs.filter((b) => b.status !== 'fixed').length;
  const chips: { key: BugFilter; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'open', label: 'Open' },
    { key: 'fixing', label: 'Fixing' }, { key: 'fixed', label: 'Fixed' },
  ];
  const visible = bugs.filter((b) => matches(b, filter));

  return (
    <div>
      <div className="section-bar">
        <div className="titles">
          <div className="h">Bugs</div>
          <div className="subtitle">{openCount} open · {counts.fixing} in progress</div>
        </div>
        <div className="bar-actions">
          {chips.map((c) => (
            <button key={c.key} className={`chip-sm ${filter === c.key ? 'on' : ''}`} onClick={() => setFilter(c.key)}>
              {c.label} {counts[c.key]}
            </button>
          ))}
          <button className="btn-dark" style={{ marginLeft: 4 }} onClick={onReport}>+ Report</button>
        </div>
      </div>

      {visible.length ? (
        <div className="buglist">
          {visible.map((b) => (
            <div className={`bug ${highlightId === b.id ? 'hl' : ''}`} key={b.id} data-hl={b.id}>
              <div className={`sev-bar ${b.severity}`} />
              <div className="bug-body">
                <div className="bug-main">
                  <div className="bug-title">
                    {b.title}
                    {b.source === 'hook' && <span className="auto-cue" title="Auto-extracted from a push">auto</span>}
                  </div>
                  <div className="bug-meta">
                    <span className="mono">{b.id} · {b.meta}</span>
                    {b.linkRef && (
                      <button className="link-chip" onClick={() => onOpenLink(b.linkRef!)}>↳ {b.linkRef}</button>
                    )}
                  </div>
                </div>
                <span className={`sev-pill ${b.severity}`}>{b.severity}</span>
                <span className={`status-pill ${b.status}`}>{STATUS_LABEL[b.status as BugStatus]}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="big">{filter === 'all' ? 'No bugs reported' : `Nothing ${filter}`}</div>
          <div>{filter === 'all' ? 'A clean slate. Report one when something breaks.' : 'Try a different filter.'}</div>
        </div>
      )}
    </div>
  );
}
