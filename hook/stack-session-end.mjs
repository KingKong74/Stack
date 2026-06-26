#!/usr/bin/env node
// Stack — Claude Code SessionEnd hook.
//
// Fires when a Claude Code session ends. Reads the session transcript, works out
// which project it belongs to (from git), summarises "where we are at", and POSTs
// a checkpoint to your self-hosted Stack API. Never blocks Claude Code: it
// always exits 0, even on failure.
//
// Config (environment variables):
//   STACK_API     required  e.g. https://stack.example.com
//   STACK_TOKEN   required  must match the server's API_TOKEN
//   ANTHROPIC_API_KEY  optional  enables a structured AI summary (else falls back
//                                to the last assistant message)
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
  return { repo, name, slug, branch };
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

// ---- summarisation ----
function fallbackSummary(t) {
  const lastAssistant = [...t.turns].reverse().find((x) => x.role === 'assistant');
  let summary = (lastAssistant?.text || '').replace(/\s+/g, ' ').trim().slice(0, 700);
  return { summary: summary || null, current_phase: null, next_steps: [], blockers: [] };
}

function compactTranscript(t) {
  // Last ~60 turns, each text trimmed, to keep the prompt cheap.
  const recent = t.turns.slice(-60);
  return recent
    .map((x) => `${x.role.toUpperCase()}: ${x.text.replace(/\s+/g, ' ').trim().slice(0, 1400)}`)
    .join('\n\n');
}

async function aiSummary(t, project) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return fallbackSummary(t);

  const system =
    'You summarise a coding session so the developer can resume later with zero re-reading. ' +
    'Return ONLY a JSON object, no prose, no markdown fences, with keys: ' +
    '"summary" (2-4 sentences, plain en-AU, what was actually done and the current state), ' +
    '"current_phase" (short label, <8 words, or null), ' +
    '"next_steps" (array of <=5 short imperative strings, or []), ' +
    '"blockers" (array of short strings for anything unresolved/broken, or []). ' +
    'Be concrete and specific to this session. Do not invent next steps that were not implied.';

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
        max_tokens: 700,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    if (!res.ok) { log(`summary API ${res.status}; using fallback`); return fallbackSummary(t); }
    const data = await res.json();
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    const clean = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(clean);
    return {
      summary: parsed.summary ? String(parsed.summary) : null,
      current_phase: parsed.current_phase ? String(parsed.current_phase) : null,
      next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps.map(String) : [],
      blockers: Array.isArray(parsed.blockers) ? parsed.blockers.map(String) : [],
    };
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

  let session = {
    session_id: payload.session_id || null,
    reason: payload.reason || (DEMO ? 'demo' : 'exit'),
    cwd,
    branch: project.branch,
    model: null,
    summary: null,
    current_phase: null,
    next_steps: [],
    blockers: [],
    files_touched: [],
    tools_used: [],
    message_count: 0,
  };

  if (DEMO) {
    session = {
      ...session,
      model: MODEL,
      summary: 'Demo stack. Wired the SessionEnd hook to the Stack API and confirmed end-to-end ingest works.',
      current_phase: 'Hook integration',
      next_steps: ['Add STACK_API + STACK_TOKEN to the real environment', 'End a real session to capture an auto summary'],
      blockers: [],
      files_touched: ['.claude/settings.json'],
      tools_used: ['Write', 'Bash'],
      message_count: 8,
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
        next_steps: s.next_steps,
        blockers: s.blockers,
        files_touched: t.files,
        tools_used: t.tools,
        message_count: t.messageCount,
      };
    }
    // If transcript is missing/too short, we still POST a thin stack so
    // "last touched" updates; the server keeps the previous richer summary.
  }

  const body = {
    project: { slug: project.slug, name: project.name, repo: project.repo },
    session,
  };

  try {
    const res = await fetch(`${api.replace(/\/$/, '')}/api/ingest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) die0(`ingest returned ${res.status}`);
    log(`stack saved for ${project.slug}`);
  } catch (e) {
    die0(`could not reach ${api}: ${e.message}`);
  }
  process.exit(0);
})();
