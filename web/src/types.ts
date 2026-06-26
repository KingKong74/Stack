export type ProjectStatus = 'live' | 'building' | 'paused' | 'archived';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type BugStatus = 'open' | 'investigating' | 'fixing' | 'fixed';
export type Priority = 'must' | 'should' | 'could' | 'wont';
export type Source = 'hook' | 'manual';   // hook = auto-extracted, manual = hand-entered

export interface Resume {
  when: string;
  ref: string;
  summary: string;
  inProgress: string[];
  nextUp: string[];
  liked: string[];
}

export interface ProjectMeta {
  version: string;
  lastDeploy: string;
  stack: string[];
  pushesThisWeek: number;
}

export interface Project {
  id: string;              // the slug
  name: string;
  subtitle: string;
  tint: string;
  status: ProjectStatus;
  progress: number;        // 0–100, computed server-side from roadmap/bug completion
  metaLine: string;        // dashboard card meta e.g. "pushed 2h ago"
  siteUrl: string;
  repoUrl: string;
  meta: ProjectMeta;
  resume: Resume | null;
}

export interface Bug {
  id: string;              // BUG-N
  title: string;
  severity: Severity;
  status: BugStatus;
  meta: string;            // "reported 2h ago"
  linkRef: string | null;  // commit hash
  source: Source;
}

export interface RoadmapItem {
  id: number;
  title: string;
  note: string;
  done: boolean;
  bucket: Priority;
  source: Source;
}
export interface Roadmap { must: RoadmapItem[]; should: RoadmapItem[]; could: RoadmapItem[]; wont: RoadmapItem[] }

export interface Note {
  id: number;
  text: string;
  colour: string;
  when: string;
  source: Source;
}

export interface Activity {
  hash: string;
  branch: string;
  when: string;
  summary: string;
  tags: string[];
}

export interface Collections {
  bugs: Bug[];
  roadmap: Roadmap;
  notes: Note[];
}
