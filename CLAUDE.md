# CLAUDE.md — working notes for Stack

Context for any Claude (or human) picking this repo up in a terminal. Read this first.

## What Stack is

A self-hosted side-project command centre. The point is **frictionless resume**: open a project and
the "pick up where you left off" card tells you exactly where you were. Built from the Atlas design
handoff (mid-to-high fidelity — colours, type, spacing, copy and interactions are intended to match).

## Architecture

```
web/    Vite + React 18 + TS (strict). Hash-routed, two screens. Persistence is localStorage TODAY,
        isolated entirely inside src/store.ts.
server/ Express + Postgres. Idempotent schema migrate on boot, retries first DB connect (survives
        compose start order). Bearer-token auth on every route except GET /api/health; fails closed
        if API_TOKEN is unset.
hook/   Zero-dependency Node ESM SessionEnd hook. Reads hook JSON on stdin, parses the transcript,
        optional Anthropic summary, POSTs to /api/ingest. Always exits 0.
```

### Frontend structure (`web/src`)
- `seed.ts` — the eight sample projects + per-project activity + collections (bugs/roadmap/notes).
  Trailmark carries the exact handoff content; the others are tailored so the app feels alive.
- `store.ts` — **the only persistence module.** `getProjects / getProject / createProject /
  getActivity / getBugs+setBugs / getRoadmap+setRoadmap / getNotes+setNotes`. Swap these to fetch/POST
  against the API and nothing else in the UI changes.
- `types.ts` — Project, Bug, Roadmap, Note, Activity, Collections.
- `lib/ui.ts` — `PRODUCT_NAME`, label/colour maps, `isAccentTag`. `lib/route.ts` — hash router.
- `screens/` Dashboard, ProjectDetail (container: owns tab/modal/collection state, persists on mutate).
- `detail/` Overview, Bugs, Roadmap, Notes, Activity (presentational, callback-driven).
- `components/` Modal + NewProject/Bug/Roadmap modals.
- `styles.css` — all design tokens as CSS vars + component classes. Severity/status/priority colour
  variants live at the bottom.

### Backend shape (`server/src`)
- `schema.sql` — `projects` (slug, name, repo, status, current_phase, summary, next_steps jsonb,
  blockers jsonb, pinned, last_session_at) + `sessions` (immutable checkpoint log; maps to the
  activity feed).
- `routes/ingest.js` — `POST /api/ingest`: upsert project by slug, insert a session row, then update
  the project's live state with COALESCE so a thin checkpoint never wipes a richer previous summary.
- `routes/projects.js` — `GET /api/projects` (pinned first, then most-recently-touched),
  `GET /api/projects/:slug` (+ recent checkpoints), `PATCH`, `DELETE`.

## The gap to close (next steps, in order)

1. **Persist collections server-side.** Add tables + routes for `bugs`, `roadmap_items`, `notes`,
   keyed by project. Suggested: `GET/POST/PATCH /api/projects/:slug/bugs` etc. Keep the response
   shapes identical to `types.ts` so the frontend swap is mechanical.
2. **Add project-detail fields** the dashboard/detail use that the schema lacks: `subtitle`, `tint`,
   `progress`, `site_url`, plus a place for the resume card's `in_progress / next_up / liked` lists
   (the schema already has `summary`, `current_phase`, `next_steps`, `blockers` to build on).
3. **Reconcile the status vocabulary.** Frontend uses `live | building | paused`; the server schema
   uses `active | paused | done | archived`. Pick one (frontend's reads better for this product) and
   migrate.
4. **Point `web/src/store.ts` at the API.** Add a token gate (store the bearer in localStorage, send
   as `Authorization: Bearer`). This is the only file that should change in the UI.
5. **Wire the resume card generation.** Either synthesise it server-side from the latest N checkpoints,
   or have the hook's structured summary populate `in_progress / next_up / liked` directly.

## Conventions

- **en-AU spelling** everywhere.
- **No secrets in the repo.** `.env` (server) and `~/.stack/env` (hook) are gitignored and load at
  runtime. The hook never reads tokens from the shell profile or settings.json.
- Frontend is **strict TS** with `noUnusedLocals`/`noUnusedParameters` on — keep it clean.
- Persistence stays behind `store.ts`. Components never touch `localStorage` or `fetch` directly.
- Hook must **always exit 0** and log only to stderr — never block Claude Code shutdown.

## Gotchas

- `server` retries the first Postgres connection — don't "fix" that; it's what survives compose order.
- Ingest uses COALESCE on update so short/empty checkpoints don't overwrite a good summary. Preserve
  that property when extending.
- The web Dockerfile is multi-stage (Vite build → nginx). nginx does SPA fallback **and** proxies
  `/api` to `server:4000` on the compose network. In local `npm run dev`, Vite proxies `/api` to
  `localhost:4000` instead (see `vite.config.ts`).
- Hashes/branches in the seed are illustrative; once the hook is live they come from real sessions.

## Quick commands

```bash
cd web && npm install && npm run dev     # frontend on :5173
cd web && npm run build                  # strict typecheck + production bundle
node hook/stack-session-end.mjs --demo   # fire a synthetic checkpoint
docker compose up -d --build             # full stack
```
