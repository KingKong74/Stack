import { useMemo, useState } from 'react';
import type { Bug, Roadmap as RoadmapData, Note, Severity, Priority, Project } from '../types';
import { getProject, getActivity, getBugs, setBugs, getRoadmap, setRoadmap, getNotes, setNotes } from '../store';
import { NOTE_PALETTE } from '../seed';
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
const STATUS_LABEL = { live: 'Live', building: 'Building', paused: 'Paused' } as const;

export function ProjectDetail({ id }: { id: string }) {
  const project = getProject(id);
  if (!project) return <NotFound />;

  return <Detail project={project} />;
}

function Detail({ project }: { project: Project }) {
  const id = project.id;
  const [tab, setTab] = useState<Tab>('overview');
  const [bugFilter, setBugFilter] = useState<BugFilter>('all');
  const [highlightRef, setHighlightRef] = useState<string | null>(null);

  const [bugs, setBugsState] = useState<Bug[]>(() => getBugs(id));
  const [roadmap, setRoadmapState] = useState<RoadmapData>(() => getRoadmap(id));
  const [notes, setNotesState] = useState<Note[]>(() => getNotes(id));
  const activity = useMemo(() => getActivity(id), [id]);

  const [bugModal, setBugModal] = useState(false);
  const [roadModal, setRoadModal] = useState<{ open: boolean; priority: Priority }>({ open: false, priority: 'should' });

  const openBugCount = bugs.filter((b) => b.status !== 'fixed').length;
  const fixingCount = bugs.filter((b) => b.status === 'fixing').length;
  const roadmapCount = roadmap.must.length + roadmap.should.length + roadmap.could.length + roadmap.wont.length;
  const linkedBugId = bugs.find((b) => b.linkRef === highlightRef)?.id ?? null;

  // ---- mutations ----
  const addBug = ({ title, severity }: { title: string; severity: Severity }) => {
    const nums = bugs.map((b) => parseInt(b.id.split('-')[1] || '0', 10) || 0);
    const nb: Bug = { id: `BUG-${Math.max(0, ...nums) + 1}`, title: title.trim(), severity, status: 'open', meta: 'reported just now', linkRef: null };
    const next = [nb, ...bugs];
    setBugsState(next); setBugs(id, next);
    setBugModal(false); setBugFilter('all');
  };

  const addRoad = ({ title, note, priority }: { title: string; note: string; priority: Priority }) => {
    const next: RoadmapData = { ...roadmap, [priority]: [...roadmap[priority], { title: title.trim(), note: note.trim() }] };
    setRoadmapState(next); setRoadmap(id, next);
    setRoadModal({ open: false, priority });
  };

  const addNote = (text: string) => {
    const color = NOTE_PALETTE[notes.length % NOTE_PALETTE.length];
    const next: Note[] = [{ id: 'n' + Date.now(), text, color, when: 'just now' }, ...notes];
    setNotesState(next); setNotes(id, next);
  };
  const deleteNote = (nid: string) => {
    const next = notes.filter((n) => n.id !== nid);
    setNotesState(next); setNotes(id, next);
  };

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
          <Roadmap roadmap={roadmap} onAdd={(p) => setRoadModal({ open: true, priority: p })} />
        )}
        {tab === 'notes' && (
          <Notes notes={notes} onAdd={addNote} onDelete={deleteNote} />
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

function NotFound() {
  return (
    <div className="page" style={{ paddingTop: 80 }}>
      <div className="empty-state">
        <div className="big">Project not found</div>
        <div style={{ marginBottom: 16 }}>It may have been removed.</div>
        <button className="btn-accent" onClick={go.dashboard} style={{ display: 'inline-flex' }}>Back to projects</button>
      </div>
    </div>
  );
}
