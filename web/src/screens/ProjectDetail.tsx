import { useEffect, useState, type ReactNode } from 'react';
import type { Roadmap as RoadmapData, RoadmapItem, Severity, Priority } from '../types';
import {
  getProjectDetail, type ProjectDetailData,
  createBug, createRoadmapItem, patchRoadmapItem, createNote, deleteNote,
} from '../store';
import { go } from '../lib/route';
import { Overview } from '../detail/Overview';
import { Bugs } from '../detail/Bugs';
import { Roadmap } from '../detail/Roadmap';
import { Notes } from '../detail/Notes';
import { Activity } from '../detail/Activity';
import { BugModal } from '../components/BugModal';
import { RoadmapModal } from '../components/RoadmapModal';

type Tab = 'overview' | 'bugs' | 'roadmap' | 'notes' | 'activity';
type BugFilter = 'all' | 'open' | 'fixing' | 'fixed';
const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' }, { key: 'bugs', label: 'Bugs' },
  { key: 'roadmap', label: 'Roadmap' }, { key: 'notes', label: 'Notes' }, { key: 'activity', label: 'Activity' },
];
const STATUS_LABEL = { live: 'Live', building: 'Building', paused: 'Paused', archived: 'Archived' } as const;

const roadmapTotal = (r: RoadmapData) => r.must.length + r.should.length + r.could.length + r.wont.length;

export function ProjectDetail({ id }: { id: string }) {
  const [data, setData] = useState<ProjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let live = true;
    setLoading(true);
    getProjectDetail(id)
      .then((d) => { if (live) { setData(d); setLoadError(''); } })
      .catch((e) => { if (live) setLoadError(e?.message || 'Failed to load.'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [id]);

  if (loading) return <Shell><div className="empty-state"><div className="big">Loading…</div></div></Shell>;
  if (loadError || !data) {
    return (
      <Shell>
        <div className="empty-state">
          <div className="big">{loadError === 'No such project.' ? 'Project not found' : "Couldn't load this project"}</div>
          <div style={{ marginBottom: 16 }}>{loadError || 'It may have been removed.'}</div>
          <button className="btn-accent" onClick={go.dashboard} style={{ display: 'inline-flex' }}>Back to projects</button>
        </div>
      </Shell>
    );
  }
  return <Detail data={data} setData={setData} />;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="topbar">
        <div className="crumb">
          <span className="chev" onClick={go.dashboard}>‹</span>
          <span className="back" onClick={go.dashboard}>Projects</span>
        </div>
      </div>
      <div className="page detail" style={{ paddingTop: 40 }}>{children}</div>
    </div>
  );
}

function Detail({ data, setData }: { data: ProjectDetailData; setData: (d: ProjectDetailData) => void }) {
  const { project, activity } = data;
  const slug = project.id;

  const [tab, setTab] = useState<Tab>('overview');
  const [bugFilter, setBugFilter] = useState<BugFilter>('all');
  const [highlightRef, setHighlightRef] = useState<string | null>(null);
  const [bugModal, setBugModal] = useState(false);
  const [roadModal, setRoadModal] = useState<{ open: boolean; priority: Priority }>({ open: false, priority: 'should' });
  const [actionError, setActionError] = useState('');

  const bugs = data.bugs;
  const roadmap = data.roadmap;
  const notes = data.notes;

  const openBugCount = bugs.filter((b) => b.status !== 'fixed').length;
  const fixingCount = bugs.filter((b) => b.status === 'fixing').length;
  const roadmapCount = roadmapTotal(roadmap);
  const linkedBugId = bugs.find((b) => b.linkRef === highlightRef)?.id ?? null;

  const guard = async (fn: () => Promise<void>) => {
    try { setActionError(''); await fn(); }
    catch (e) { setActionError((e as Error)?.message || 'Something went wrong.'); }
  };

  // ---- mutations (each persists, then patches the loaded data in place) ----
  const addBug = ({ title, severity }: { title: string; severity: Severity }) =>
    guard(async () => {
      const bug = await createBug(slug, { title, severity });
      setData({ ...data, bugs: [bug, ...bugs] });
      setBugModal(false); setBugFilter('all');
    });

  const addRoad = ({ title, note, priority }: { title: string; note: string; priority: Priority }) =>
    guard(async () => {
      const item = await createRoadmapItem(slug, { title, note, bucket: priority });
      setData({ ...data, roadmap: { ...roadmap, [priority]: [...roadmap[priority], item] } });
      setRoadModal({ open: false, priority });
    });

  const toggleRoad = (item: RoadmapItem) =>
    guard(async () => {
      const updated = await patchRoadmapItem(slug, item.id, { done: !item.done });
      const bucket = roadmap[item.bucket].map((it) => (it.id === item.id ? updated : it));
      setData({ ...data, roadmap: { ...roadmap, [item.bucket]: bucket } });
    });

  const addNote = (text: string) =>
    guard(async () => {
      const note = await createNote(slug, { text });
      setData({ ...data, notes: [note, ...notes] });
    });

  const removeNote = (nid: number) =>
    guard(async () => {
      await deleteNote(slug, nid);
      setData({ ...data, notes: notes.filter((n) => n.id !== nid) });
    });

  const openBugLink = (hash: string) => { setHighlightRef(hash); setTab('activity'); };
  const viewAll = () => { setHighlightRef(null); setTab('activity'); };
  const open = (url: string) => { if (url) window.open(url, '_blank', 'noopener'); };

  return (
    <div>
      <div className="topbar">
        <div className="crumb">
          <span className="chev" onClick={go.dashboard}>‹</span>
          <span className="back" onClick={go.dashboard}>Projects</span>
          <span className="sep">/</span>
          <span className="here">{project.name}</span>
        </div>
        <div className="right">
          <div className="searchbox sm lg">Search this project…</div>
          <div className="avatar sm" />
        </div>
      </div>

      <div className="page detail">
        <div className="detail-head">
          <div>
            <div className="titlerow">
              <div className="detail-title">{project.name}</div>
              <span className={`statusbadge ${project.status}`}><span className="dot" />{STATUS_LABEL[project.status]}</span>
            </div>
            {project.subtitle && <div className="detail-sub">{project.subtitle}</div>}
          </div>
          <div className="head-actions">
            <button className="btn-accent btn-visit" onClick={() => open(project.siteUrl)}>Visit site <span style={{ fontSize: 12 }}>↗</span></button>
            <button className="btn-repo" onClick={() => open(project.repoUrl)}><span className="blk" />Repo</button>
          </div>
        </div>

        {actionError && <div className="action-error">{actionError}</div>}

        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.key} className={`tab ${tab === t.key ? 'on' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <Overview project={project} activity={activity}
            openBugCount={openBugCount} fixingCount={fixingCount} roadmapCount={roadmapCount} onViewAll={viewAll} />
        )}
        {tab === 'bugs' && (
          <Bugs bugs={bugs} filter={bugFilter} setFilter={setBugFilter}
            onReport={() => setBugModal(true)} onOpenLink={openBugLink} />
        )}
        {tab === 'roadmap' && (
          <Roadmap roadmap={roadmap} onAdd={(p) => setRoadModal({ open: true, priority: p })} onToggle={toggleRoad} />
        )}
        {tab === 'notes' && (
          <Notes notes={notes} onAdd={addNote} onDelete={removeNote} />
        )}
        {tab === 'activity' && (
          <Activity activity={activity} highlightRef={highlightRef} linkedBugId={linkedBugId} onClear={() => setHighlightRef(null)} />
        )}
      </div>

      {bugModal && <BugModal onClose={() => setBugModal(false)} onSubmit={addBug} />}
      {roadModal.open && (
        <RoadmapModal initialPriority={roadModal.priority} onClose={() => setRoadModal({ open: false, priority: roadModal.priority })} onSubmit={addRoad} />
      )}
    </div>
  );
}
