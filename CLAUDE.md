# CLAUDE.md — working notes for Stack

Context for any Claude (or human) picking this repo up in a terminal. Read this first.

## What Stack is

A self-hosted side-project command centre. The point is **frictionless resume**: open a project and
the "pick up where you left off" card tells you exactly where you were. A push also auto-extracts
bugs and next-steps into the trackers, and the dashboard progress is computed, not hand-set. Built
from the Atlas design handoff (colours, type, spacing, copy and interactions are intended to match).

## Architecture

```
web/    Vite + React 18 + TS (strict). Hash-routed, two screens. Persistence is the Postgres API,
        reached ONLY through src/store.ts (every function async, bearer-token auth). Token gate on
        first load; any 401 clears the token and returns to the gate.
server/ Express + Postgres. Idempotent schema migrate on boot, retries first DB connect (survives
        compose start order). Bearer-token auth on every route except GET /api/health; fails closed
        if API_TOKEN is unset.
hook/   Zero-dependency Node ESM SessionEnd hook. Reads hook JSON on stdin, captures the commit,
        parses the transcript, optional Anthropic summary + extraction, POSTs to /api/ingest.
        Always exits 0.
```

### Frontend structure (`web/src`)
- `store.ts` — **the only module that touches the network.** Auth helpers (`getToken/setToken/
  clearToken/onAuthChange/verifyToken`) + async data calls: `getProjects`, `getProjectDetail`,
  `createProject/patchProject/deleteProject`, `getBugs/createBug/patchBug/deleteBug`,
  `getRoadmap/createRoadmapItem/patchRoadmapItem/deleteRoadmapItem`, `getNotes/createNote/deleteNote`.
  `request()` attaches the bearer and throws `AuthError` on 401 (which clears the token).
- `types.ts` — Project, Bug, RoadmapItem, Note, Activity, Resume. Status is `live | building |
  paused | archived`. Bug/RoadmapItem/Note carry `source: 'hook' | 'manual'` (drives the "auto" cue).
- `components/TokenGate.tsx` — first-load token screen; `App.tsx` shows it whenever there's no token.
- `lib/ui.ts` — `PRODUCT_NAME`, label/colour maps, `isAccentTag`. `lib/route.ts` — hash router.
- `screens/` Dashboard (async load, status filters, computed progress on cards),
  ProjectDetail (loads project+activity+collections, owns tab/modal state, persists on mutate).
- `detail/` Overview, Bugs (auto cue), Roadmap (done toggle + auto cue), Notes, Activity.
- `styles.css` — design tokens + component classes. Roadmap done/auto cues, token gate and the
  status/severity/priority colour variants live near the bottom.

### Backend shape (`server/src`)
- `schema.sql` — idempotent (ADD COLUMN IF NOT EXISTS + convergent data migrations). Tables:
  - `projects` — + `subtitle, site_url, tint, in_progress, next_up, working_well` (jsonb resume
    sub-lists). Status default `building`; legacy `active` rows migrate to `live`.
  - `sessions` — the activity feed. + `commit_hash`, `tags` jsonb.
  - `bugs` — `bug_key` (BUG-N per project), title, severity, status, `link_ref` (commit), `source`,
    `fingerprint`. Partial unique index on (project, fingerprint) WHERE source='hook'.
  - `roadmap_items` — `bucket`, title, note, `done`, `position`, `source`, `fingerprint`.
  - `notes` — text, `colour`, `source`.
  - `dismissed_items` — tombstones, keyed (project, kind `bug|roadmap`, fingerprint).
- `util.js` — `slugify`, `fingerprint` (title normalised: lowercased, punctuation + extra
  whitespace stripped), `relativeTime`, palettes, and **`computeProgress` — the one documented
  progress model** (see below).
- `shape.js` — row → client-shape mappers (bug/roadmap/note/activity/project).
- `routes/ingest.js` — `POST /api/ingest`: see the package + behaviour below.
- `routes/projects.js` — list (computed progress), combined detail, create, extended PATCH, delete.
- `routes/{bugs,roadmap,notes}.js` — per-project collection CRUD, mounted under
  `/api/projects/:slug/...` (mergeParams).
- `seed.js` — optional `npm run seed`, NOT run on boot.

## The ingest package (what the hook sends)

```jsonc
{
  "project": { "slug": "stack", "name": "Stack", "repo": "owner/repo" },
  "session": {
    "session_id": "…", "commit_hash": "6234a79", "branch": "main",
    "cwd": "…", "model": "…", "reason": "exit", "message_count": 12,
    "summary": "…", "current_phase": "…",
    "next_steps": ["…"], "blockers": ["…"],
    "in_progress": ["…"], "next_up": ["…"], "working_well": ["…"],
    "tags": ["backend", "in progress"],
    "files_touched": ["…"], "tools_used": ["…"]
  },
  "extract": {
    "bugs":       [{ "title": "…", "severity": "critical|high|medium|low" }],
    "next_steps": [{ "title": "…", "priority": "must|should|could|wont" }]
  }
}
```

Ingest, in one transaction: upsert the project by slug (first push creates it + assigns a tint by
cycling the palette); record the session, **idempotent on commit_hash / session_id** (re-running the
hook for the same push updates that row, never duplicates the activity); refresh the live resume
fields with COALESCE / keep-if-empty; then land extraction — each bug becomes an open bug with
`link_ref` = the commit (so the bug→activity chip resolves), each next-step a roadmap item in its
bucket (default `should`). Dedup by fingerprint: an existing auto item is re-pointed at the commit,
not duplicated; a fingerprint in `dismissed_items` is skipped; manual items are never touched.

## Progress model (`util.computeProgress`)

The single, tweakable definition of "how done is a project". Only Must/Should roadmap items count; a
done Must weighs double a done Should; `progress = doneWeight / totalWeight` as a 0–100 integer;
capped at 90% while any critical/high bug is open; 0% when there are no Must/Should items. Exposed on
every project payload (`progress`) and recomputed on the dashboard each load.

## Routes (all behind bearer auth except GET /api/health)

- `POST /api/ingest`
- `GET /api/projects` · `POST /api/projects` · `GET /api/projects/:slug` (project + activity +
  collections + progress) · `PATCH /api/projects/:slug` (subtitle, site_url, status, pin, …) ·
  `DELETE /api/projects/:slug`
- `GET|POST /api/projects/:slug/bugs` · `PATCH|DELETE /api/projects/:slug/bugs/:bugKey`
- `GET|POST /api/projects/:slug/roadmap` · `PATCH|DELETE /api/projects/:slug/roadmap/:id`
- `GET|POST /api/projects/:slug/notes` · `DELETE /api/projects/:slug/notes/:id`

Deleting a `source='hook'` bug or roadmap item tombstones its fingerprint so the next push won't
re-create it.

## Conventions

- **en-AU spelling** everywhere.
- **No secrets in the repo.** `.env` (server) and `~/.stack/env` (hook) are gitignored and load at
  runtime. The hook never reads tokens from the shell profile or settings.json.
- Frontend is **strict TS** with `noUnusedLocals`/`noUnusedParameters` on — keep it clean.
- All persistence/network stays behind `store.ts`. Components never `fetch` or touch storage directly.
- Hook must **always exit 0** and log only to stderr — never block Claude Code shutdown.

## Gotchas

- `server` retries the first Postgres connection — don't "fix" that; it's what survives compose order.
- Ingest uses COALESCE / keep-if-empty on update so short/empty checkpoints don't overwrite a good
  summary. Preserve that property when extending.
- Ingest is idempotent on commit_hash / session_id; auto-extraction dedups on fingerprint and honours
  the tombstone table. Keep all three when touching ingest.
- The web Dockerfile is multi-stage (Vite build → nginx). nginx does SPA fallback **and** proxies
  `/api` to `server:4000` on the compose network. In local `npm run dev`, Vite proxies `/api` to
  `localhost:4000` instead (see `vite.config.ts`).
- Status vocabulary is `live | building | paused | archived`. The old `active` migrates to `live`.

## Quick commands

```bash
cd web && npm install && npm run dev     # frontend on :5173 (needs the server running)
cd web && npm run build                  # strict typecheck + production bundle
docker compose up -d --build             # full stack
docker compose exec server npm run seed  # optional demo projects (off by default)
node hook/stack-session-end.mjs --demo   # fire a synthetic checkpoint + extraction
```
