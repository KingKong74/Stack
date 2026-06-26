import { useMemo, useState } from 'react';
import type { Project, ProjectStatus } from '../types';
import { getProjects, createProject } from '../store';
import { go } from '../lib/route';
import { PRODUCT_NAME } from '../lib/ui';
import { NewProjectModal } from '../components/NewProjectModal';

type Filter = 'all' | ProjectStatus;
const STATUS_LABEL: Record<ProjectStatus, string> = { live: 'Live', building: 'Building', paused: 'Paused' };

export function Dashboard() {
  const [projects] = useState<Project[]>(() => getProjects());
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [newOpen, setNewOpen] = useState(false);

  const counts = useMemo(() => ({
    all: projects.length,
    live: projects.filter((p) => p.status === 'live').length,
    building: projects.filter((p) => p.status === 'building').length,
    paused: projects.filter((p) => p.status === 'paused').length,
  }), [projects]);

  const visible = useMemo(() => {
    let list = projects;
    if (filter !== 'all') list = list.filter((p) => p.status === filter);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => `${p.name} ${p.subtitle}`.toLowerCase().includes(q));
    return list;
  }, [projects, filter, query]);

  const chips: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'live', label: 'Live' },
    { key: 'building', label: 'Building' }, { key: 'paused', label: 'Paused' },
  ];

  return (
    <div>
      <div className="topbar dash">
        <div className="brandmark"><span className="sq" /><span className="word">{PRODUCT_NAME}</span></div>
        <div className="right">
          <div className="searchbox lg" style={{ width: 230 }}>
            <span className="glass" />
            <input placeholder="Search projects…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <button className="btn-accent" onClick={() => setNewOpen(true)}>New project</button>
          <div className="avatar" />
        </div>
      </div>

      <div className="page">
        <div className="dash-head">
          <div>
            <div className="dash-title">Your projects</div>
            <div className="dash-count">{counts.live} live · {counts.building} building · {counts.paused} paused</div>
          </div>
          <div className="chips">
            {chips.map((c) => (
              <button key={c.key} className={`chip ${filter === c.key ? 'on' : ''}`} onClick={() => setFilter(c.key)}>
                {c.label} <span className="n">{counts[c.key]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid">
          {visible.map((p) => (
            <button key={p.id} className="pcard" style={{ background: p.tint }} onClick={() => go.detail(p.id)} aria-label={`Open ${p.name}`}>
              <span className="stripe" />
              <span className="scrim" />
              <span className="statuspill">{STATUS_LABEL[p.status]}</span>
              <span className="meta">
                <span className="pname">{p.name}</span>
                <span className="track"><span className="fill" style={{ width: `${p.progress}%` }} /></span>
                <span className="metarow"><span>{p.metaLine}</span><span>{p.progress}%</span></span>
              </span>
            </button>
          ))}
          <button className="newtile" onClick={() => setNewOpen(true)}>
            <span className="plus">+</span>
            <span className="lab">New project</span>
          </button>
        </div>
      </div>

      {newOpen && (
        <NewProjectModal
          onClose={() => setNewOpen(false)}
          onCreate={(v) => {
            const p = createProject(v);
            setNewOpen(false);
            go.detail(p.id);
          }}
        />
      )}
    </div>
  );
}
