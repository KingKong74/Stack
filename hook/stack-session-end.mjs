#!/usr/bin/env node
// Stack — Claude Code SessionEnd hook.
//
// Fires when a Claude Code session ends. Reads the session transcript, works out
// which project it belongs to (from git), summarises "where we are at", extracts
// candidate bugs and next-steps, and POSTs a checkpoint package to your
// self-hosted Stack API. Never blocks Claude Code: it always exits 0.
//
// Config (environment variables):
//   STACK_API     required  e.g. https://stack.example.com
//   STACK_TOKEN   required  must match the server's API_TOKEN
//   ANTHROPIC_API_KEY  optional  enables a structured AI summary + extraction.
//                                Without it, the hook sends the last assistant
//                                message as the summary and empty extraction lists.
//   STACK_MODEL   optional  default: claude-haiku-4-5-20251001
//   STACK_MIN_MESSAGES  optional  skip sessions shorter than this (default 2)
//
// Test without a real session:  node stack-session-end.mjs --demo

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Load secrets from ~/.stack/env (KEY=VALUE per line) if present, without
// overriding anything already set in the real environment. Keeps the token out
// of shell profiles and out of .claude/settings.json.
(function loadEnvFile() {
  const f = join(homedir(), '.stack', 'env');
  if (!existsSync(f)) return;
  try {
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      const s = line.trim();
      if (!s || s.startsWith('#')) continue;
      const eq = s.indexOf('=');
      if (eq < 0) continue;
      const k = s.slice(0, eq).trim();
      let v = s.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (k && process.env[k] === undefined) process.env[k] = v;
    }
  } catch { /* ignore */ }
})();

const DEMO = process.argv.includes('--demo');
const MODEL = process.env.STACK_MODEL || 'claude-haiku-4-5-20251001';
const MIN_MESSAGES = parseInt(process.env.STACK_MIN_MESSAGES || '2', 10);

const SEVERITIES = ['critical', 'high', 'medium', 'low'];
const BUCKETS = ['must', 'should', 'could', 'wont'];

function log(...a) { process.stderr.write(`[stack] ${a.join(' ')}\n`); }
function die0(msg) { if (msg) log(msg); process.exit(0); } // never block Claude Code

// ---- read the hook payload from stdin (or synthesise for --demo) ----
function readStdin() {
  try { return readFileSync(0, 'utf8'); } catch { return ''; }
}

function git(cwd, args) {
  try {
    return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return ''; }
}

// Normalise a git remote (ssh or https, with or without .git) into a browseable
// https URL so the app's "Repo" button can open it. Returns null if unknown.
function browseUrl(remote) {
  if (!remote) return null;
  const ssh = remote.match(/^git@([^:]+):(.+?)(?:\.git)?$/);   // git@host:owner/repo.git
  if (ssh) return `https://${ssh[1]}/${ssh[2]}`;
  const https = remote.match(/^https?:\/\/(.+?)(?:\.git)?$/);  // https://host/owner/repo.git
  if (https) return `https://${https[1]}`;
  return null;
}

function projectFromGit(cwd) {
  const remote = git(cwd, ['config', '--get', 'remote.origin.url']);
  const branch = git(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']) || null;
  let repo = null, name = null, slug = null;
  const m = remote.match(/[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
  if (m) {
    repo = m[1];                          // owner/repo
    name = repo.split('/').pop();
    slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  if (!name) {                            // fallback to directory name
    name = (cwd || '').split('/').filter(Boolean).pop() || 'untitled';
    slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  const commit = git(cwd, ['rev-parse', '--short', 'HEAD']) || null;
  return { repo, repo_url: browseUrl(remote), name, slug, branch, commit };
}

// ---- transcript parsing ----
const EDIT_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'str_replace', 'create_file']);

function parseTranscript(path) {
  let raw = '';
  try { raw = readFileSync(path, 'utf8'); } catch { return null; }
  const turns = [];      // { role, text }
  const tools = new Set();
  const files = new Set();
  let model = null;

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let ev;
    try { ev = JSON.parse(line); } catch { continue; }
    const msg = ev.message || ev;
    const role = msg.role || ev.type;
    if (ev.model) model = ev.model;
    if (msg.model) model = msg.model;

    const content = msg.content;
    if (typeof content === 'string') {
      if (role === 'user' || role === 'assistant') turns.push({ role, text: content });
      continue;
    }
    if (!Array.isArray(content)) continue;

    for (const block of content) {
      if (!block || typeof block !== 'object') continue;
      if (block.type === 'text' && block.text) {
        if (role === 'user' || role === 'assistant') turns.push({ role, text: block.text });
      } else if (block.type === 'tool_use' && block.name) {
        tools.add(block.name);
        const fp = block.input?.file_path || block.input?.path || block.input?.notebook_path;
        if (fp && EDIT_TOOLS.has(block.name)) files.add(String(fp));
      }
    }
  }
  return {
    turns,
    tools: [...tools],
    files: [...files],
    model,
    messageCount: turns.length,
  };
}

// ---- summarisation + extraction ----

// The full structured shape, with empty extraction lists. Used as the no-key
// fallback and as the base every AI result is merged onto.
function emptyStructured() {
  return {
    summary: null, current_phase: null, blockers: [],
    in_progress: [], next_up: [], working_well: [],
    tags: [], bugs: [], next_steps: [],
  };
}

function fallbackSummary(t) {
  const lastAssistant = [...t.turns].reverse().find((x) => x.role === 'assistant');
  const summary = (lastAssistant?.text || '').replace(/\s+/g, ' ').trim().slice(0, 700) || null;
  return { ...emptyStructured(), summary };
}

function compactTranscript(t) {
  // Last ~60 turns, each text trimmed, to keep the prompt cheap.
  const recent = t.turns.slice(-60);
  return recent
    .map((x) => `${x.role.toUpperCase()}: ${x.text.replace(/\s+/g, ' ').trim().slice(0, 1400)}`)
    .join('\n\n');
}

const strList = (v, max = 5) =>
  Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, max) : [];
const oneOf = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback);

// Normalise whatever the model returned onto the strict structured shape.
function sanitiseStructured(parsed) {
  const out = emptyStructured();
  out.summary = parsed.summary ? String(parsed.summary) : null;
  out.current_phase = parsed.current_phase ? String(parsed.current_phase) : null;
  out.blockers = strList(parsed.blockers);
  out.in_progress = strList(parsed.in_progress);
  out.next_up = strList(parsed.next_up);
  out.working_well = strList(parsed.working_well);
  out.tags = strList(parsed.tags, 4).map((s) => s.toLowerCase());
  out.bugs = Array.isArray(parsed.bugs)
    ? parsed.bugs
        .map((b) => ({ title: String(b?.title || '').trim(), severity: oneOf(b?.severity, SEVERITIES, 'medium') }))
        .filter((b) => b.title)
        .slice(0, 10)
    : [];
  out.next_steps = Array.isArray(parsed.next_steps)
    ? parsed.next_steps
        .map((s) => ({ title: String(s?.title || '').trim(), priority: oneOf(s?.priority, BUCKETS, 'should') }))
        .filter((s) => s.title)
        .slice(0, 10)
    : [];
  return out;
}

async function aiSummary(t, project) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return fallbackSummary(t);

  const system =
    'You summarise a coding session so the developer can resume later with zero re-reading, ' +
    'and you triage what changed. Return ONLY a JSON object, no prose, no markdown fences, with keys: ' +
    '"summary" (2-4 sentences, plain en-AU, what was actually done and the current state), ' +
    '"current_phase" (short label, <8 words, or null), ' +
    '"in_progress" (array of <=5 short strings — things mid-flight right now, or []), ' +
    '"next_up" (array of <=5 short imperative strings — the suggested next moves, or []), ' +
    '"working_well" (array of <=5 short strings — things to keep/that are paying off, or []), ' +
    '"blockers" (array of short strings for anything unresolved/broken, or []), ' +
    '"tags" (array of up to 4 short lowercase labels for the push, e.g. "backend", "in progress"), ' +
    '"bugs" (array of {title, severity} for bugs introduced or found this session; ' +
    'severity is one of critical|high|medium|low; [] if none), ' +
    '"next_steps" (array of {title, priority} concrete follow-up tasks; ' +
    'priority is one of must|should|could|wont, default should; [] if none). ' +
    'Be concrete and specific to this session. Do not invent bugs or next steps that were not implied.';

  const user =
    `Project: ${project.name}${project.repo ? ` (${project.repo})` : ''}\n` +
    `Branch: ${project.branch || 'unknown'}\n` +
    `Files touched: ${t.files.slice(0, 30).join(', ') || 'none recorded'}\n\n` +
    `Session transcript (most recent turns):\n\n${compactTranscript(t)}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    if (!res.ok) { log(`summary API ${res.status}; using fallback`); return fallbackSummary(t); }
    const data = await res.json();
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    const clean = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    return sanitiseStructured(JSON.parse(clean));
  } catch (e) {
    log(`summary failed (${e.message}); using fallback`);
    return fallbackSummary(t);
  }
}

// ---- main ----
(async () => {
  const api = process.env.STACK_API;
  const token = process.env.STACK_TOKEN;
  if (!api || !token) die0('STACK_API and STACK_TOKEN must be set; skipping.');

  let payload = {};
  if (!DEMO) {
    const stdin = readStdin();
    try { payload = JSON.parse(stdin || '{}'); } catch { payload = {}; }
  }

  const cwd = DEMO ? process.cwd() : (payload.cwd || process.cwd());
  const project = projectFromGit(cwd);

  // The session checkpoint (resume state) and the extraction package.
  let session = {
    session_id: payload.session_id || null,
    commit_hash: project.commit,
    reason: payload.reason || (DEMO ? 'demo' : 'exit'),
    cwd,
    branch: project.branch,
    model: null,
    summary: null,
    current_phase: null,
    next_steps: [],
    blockers: [],
    in_progress: [],
    next_up: [],
    working_well: [],
    tags: [],
    files_touched: [],
    tools_used: [],
    message_count: 0,
  };
  let extract = { bugs: [], next_steps: [] };

  if (DEMO) {
    session = {
      ...session,
      model: MODEL,
      summary:
        'Moved Stack off localStorage onto the Postgres-backed API and wired the post-push ingest ' +
        'loop so a push auto-extracts bugs and next-steps. Confirmed the demo checkpoint lands end to end.',
      current_phase: 'Persistence cutover',
      in_progress: ['Wiring store.ts to the live API', 'Token gate first-load screen'],
      next_up: ['Ship the API token gate', 'Document the ingest package shape'],
      working_well: ['One-module persistence boundary held up', 'Idempotent migrations on boot'],
      tags: ['backend', 'in progress'],
      next_steps: ['Ship the API token gate', 'Document the ingest package shape'],
      blockers: [],
      files_touched: ['web/src/store.ts', 'server/src/routes/ingest.js'],
      tools_used: ['Write', 'Edit', 'Bash'],
      message_count: 12,
    };
    extract = {
      bugs: [{ title: 'Resume card mis-positions on mobile', severity: 'medium' }],
      next_steps: [
        { title: 'Ship the API token gate', priority: 'must' },
        { title: 'Document the ingest package shape', priority: 'should' },
      ],
    };
  } else {
    const t = parseTranscript(payload.transcript_path);
    if (t && t.messageCount >= MIN_MESSAGES) {
      const s = await aiSummary(t, project);
      session = {
        ...session,
        model: t.model,
        summary: s.summary,
        current_phase: s.current_phase,
        next_steps: s.next_up,           // legacy column mirrors the resume "next up"
        blockers: s.blockers,
        in_progress: s.in_progress,
        next_up: s.next_up,
        working_well: s.working_well,
        tags: s.tags,
        files_touched: t.files,
        tools_used: t.tools,
        message_count: t.messageCount,
      };
      extract = { bugs: s.bugs, next_steps: s.next_steps };
    }
    // If transcript is missing/too short, we still POST a thin package so
    // "last touched" updates; the server keeps the previous richer summary.
  }

  const body = {
    project: { slug: project.slug, name: project.name, repo: project.repo, repo_url: project.repo_url },
    session,
    extract,
  };

  try {
    const res = await fetch(`${api.replace(/\/$/, '')}/api/ingest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) die0(`ingest returned ${res.status}`);
    log(`stack saved for ${project.slug}${project.commit ? ` @ ${project.commit}` : ''}`);
  } catch (e) {
    die0(`could not reach ${api}: ${e.message}`);
  }
  process.exit(0);
})();
