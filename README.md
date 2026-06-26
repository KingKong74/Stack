# Stack

A self-hosted command centre for your side projects. Open it and instantly know where every
project stands — the signature element is a **"pick up where you left off"** resume card that
removes the friction of re-loading context when you jump between projects.

Each project tracks its live site, repo, deploy status, an auto-generated **activity feed**
(one summary per session/push), a **bug tracker**, a **MoSCoW roadmap**, and freeform
**sticky notes**. Two screens: a cover-forward **projects dashboard** and a five-tab
**project detail** (Overview · Bugs · Roadmap · Notes · Activity).

The UI is a faithful build of the Atlas design handoff. Product name is **Stack** — it's a single
constant (`web/src/lib/ui.ts` → `PRODUCT_NAME`) if you ever want to change it.

## Repo layout

```
stack/
  web/      Vite + React + TypeScript frontend (the dashboard + detail UI)
  server/   Express + Postgres API (ingest + projects) — the backend foundation
  hook/     Claude Code SessionEnd hook — posts a checkpoint when a session ends
  docker-compose.yml   db + server + web, for the mini-PC deploy
```

## Current state

- **Frontend is complete and runnable today** against `localStorage` — all eight sample projects,
  every tab, both modals, all interactions. Persistence lives behind one module,
  `web/src/store.ts`, which is the single swap point for the real API.
- **Backend + hook are the foundation**, carried in and syntax-checked. The `server` persists
  projects and per-session checkpoints (which map onto the resume card + activity feed). Bug/roadmap/
  note persistence and a few project-detail fields are the next backend step — see `CLAUDE.md`.

## Run the frontend (no backend needed)

```bash
cd web
npm install
npm run dev      # http://localhost:5173
```

Data seeds into `localStorage` on first load. Everything you add (bugs, roadmap items, notes,
new projects) persists in the browser.

## Run the full stack (compose)

```bash
cp .env.example .env
# set POSTGRES_PASSWORD and API_TOKEN — generate a token with: openssl rand -hex 24
docker compose up -d --build
```

The **web** container binds `WEB_PORT` (default **8787**) — point your Cloudflare Tunnel / Tailscale
at that. nginx serves the static bundle and reverse-proxies `/api` to the server container.

## The SessionEnd hook (auto-fill "where you left off")

When a Claude Code session ends, the hook derives the project from your git remote/branch, parses the
transcript for what changed, optionally asks a cheap model for a structured summary, and POSTs a
checkpoint to `STACK_API/api/ingest`. It never blocks Claude Code shutting down (always exits 0).

Three-step install on whichever machine runs Claude Code:

```bash
# 1. drop the script
mkdir -p ~/.stack && cp hook/stack-session-end.mjs ~/.stack/

# 2. create ~/.stack/env  (this file holds the secrets; never commit it)
cat > ~/.stack/env <<'ENV'
STACK_API=https://stack.your-domain
STACK_TOKEN=the-same-value-as-API_TOKEN
# optional — enables structured AI summaries instead of a raw last-message fallback:
ANTHROPIC_API_KEY=sk-ant-...
ENV

# 3. merge hook/settings.snippet.json into ~/.claude/settings.json
```

Test it without a real session:

```bash
node ~/.stack/stack-session-end.mjs --demo
```

## Conventions

- en-AU spelling throughout.
- No secrets in the repo. Secrets load at runtime from `.env` (server) and `~/.stack/env` (hook).
- `web/src/store.ts` is the only module that touches persistence — keep it that way.
