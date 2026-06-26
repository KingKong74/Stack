import type { Project, Activity, Collections, Bug, Roadmap, Note, ProjectStatus } from './types';
import { SEED_PROJECTS, SEED_ACTIVITY, SEED_COLLECTIONS } from './seed';

// ---------------------------------------------------------------------------
// This module is the ONLY place that touches persistence. To move off
// localStorage onto the Stack API, reimplement these functions to fetch/POST
// against /api/* — nothing else in the UI needs to change.
// ---------------------------------------------------------------------------

const NS = 'stack.v1';
const key = (...parts: string[]) => [NS, ...parts].join('.');

function read<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota / private mode */ }
}

const EMPTY_ROADMAP: Roadmap = { must: [], should: [], could: [], wont: [] };
const TINTS = ['#e3d4c8', '#d3ddcf', '#cdd9e0', '#e6dcc4', '#e6d6d6', '#dcdac9', '#ddd2cd', '#d2d6dc'];

// ---- projects ----
export function getProjects(): Project[] {
  const created = read<Project[]>(key('projects'), []);
  return [...created, ...SEED_PROJECTS];
}

export function getProject(id: string): Project | undefined {
  return getProjects().find((p) => p.id === id);
}

export function createProject(input: { name: string; subtitle: string; status: ProjectStatus }): Project {
  const created = read<Project[]>(key('projects'), []);
  const id = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `project-${Date.now()}`;
  const tint = TINTS[(created.length + SEED_PROJECTS.length) % TINTS.length];
  const project: Project = {
    id, name: input.name.trim(), subtitle: input.subtitle.trim(), tint,
    status: input.status, progress: 0, metaLine: 'created just now',
    siteUrl: '', repoUrl: '',
    meta: { version: '—', lastDeploy: 'not yet', stack: [], pushesThisWeek: 0 },
    resume: null,
  };
  write(key('projects'), [project, ...created]);
  return project;
}

// ---- activity (read-only in the prototype: "auto-generated per push") ----
export function getActivity(id: string): Activity[] {
  return read<Activity[]>(key(id, 'activity'), SEED_ACTIVITY[id] || []);
}

// ---- collections (bugs / roadmap / notes), persisted per project ----
function seedFor(id: string): Collections {
  return SEED_COLLECTIONS[id] || { bugs: [], roadmap: { ...EMPTY_ROADMAP }, notes: [] };
}

export function getBugs(id: string): Bug[] {
  return read<Bug[]>(key(id, 'bugs'), seedFor(id).bugs);
}
export function setBugs(id: string, bugs: Bug[]) { write(key(id, 'bugs'), bugs); }

export function getRoadmap(id: string): Roadmap {
  return read<Roadmap>(key(id, 'roadmap'), seedFor(id).roadmap);
}
export function setRoadmap(id: string, roadmap: Roadmap) { write(key(id, 'roadmap'), roadmap); }

export function getNotes(id: string): Note[] {
  return read<Note[]>(key(id, 'notes'), seedFor(id).notes);
}
export function setNotes(id: string, notes: Note[]) { write(key(id, 'notes'), notes); }
