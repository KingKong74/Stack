# Stack

A self-hosted command centre for your side projects. Open it and instantly know where every
project stands — the signature element is a **"pick up where you left off"** resume card that
removes the friction of re-loading context when you jump between projects.

Each project tracks its live site, repo, deploy status, an auto-generated **activity feed**
(one summary per session/push), a **bug tracker**, a **MoSCoW roadmap**, and freeform
**sticky notes**. Two screens: a cover-forward **projects dashboard** and a five-tab
**project detail** (Overview · Bugs · Roadmap · Notes · Activity).

A push does more than feed the resume card: the SessionEnd hook **auto-extracts candidate bugs
and next-steps** into the trackers, and the dashboard **progress bar is computed** from
roadmap/bug completion — never set by hand.

The UI is a faithful build of the Atlas design handoff. Product name is **Stack** — it's a single
constant (`web/src/lib/ui.ts` → `PRODUCT_NAME`) if you ever want to change it.

## Repo layout

```
stack/
  web/      Vite + React + TypeScript frontend (the dashboard + detail UI)
  server/   Express + Postgres API (ingest + projects + collections)
  hook/     Claude Code SessionEnd hook — posts a checkpoint + extraction package per session
  docker-compose.yml   db + server + web, for the mini-PC deploy
```

## Current state

- **The app runs against the live API.** Persistence is Postgres, reached entirely through one
  module, `web/src/store.ts` (every function is async and calls `/api/*` with a bearer token).
  There is no localStorage data layer any more — the API is the source of truth.
- **A first-load token gate** asks for the shared API token, keeps it in `localStorage`, and sends
  it on every request. Any `401` clears it and returns to the gate.
- **The ingest loop is complete:** a push upserts the project, records the session/activity row,
  refreshes the resume fields (COALESCE so a thin checkpoint never wipes a good summary), and lands
  auto-extracted bugs + roadmap items (deduped by fingerprint, tombstoned on delete, never touching
  manual items).

## Run the full stack (compose)

```bash
cp .env.example .env
# set POSTGRES_PASSWORD and API_TOKEN — generate a token with: openssl rand -hex 24
docker compose up -d --build
```

Open the web container (host **`WEB_PORT`**, default **8787**), paste your **API_TOKEN** into the
token gate, and you're in. nginx serves the static bundle and reverse-proxies `/api` to the server
container. Point your Cloudflare Tunnel / Tailscale at that host port.

Optional — drop in a couple of demo projects (off by default):

```bash
docker compose exec server npm run seed
```

## Run the frontend in dev

```bash
cd web
npm install
npm run dev      # http://localhost:5173
```

Vite proxies `/api` to `http://localhost:4000`, so you need the **server running** (compose, or
`cd server && npm install && npm run dev` with `DATABASE_URL` + `API_TOKEN` set). The app opens on
the token gate; paste the same `API_TOKEN` to continue.

## The SessionEnd hook (auto-fill "where you left off" + extraction)

When a Claude Code session ends, the hook derives the project from your git remote/branch, captures
the current commit (short `rev-parse`), parses the transcript, and — if `ANTHROPIC_API_KEY` is set —
asks a cheap model for a structured summary **plus** the resume sub-lists, a couple of tags,
candidate bugs and prioritised next-steps. It POSTs that package to `STACK_API/api/ingest`. Without
an API key it falls back to the last-message summary and empty extraction lists. It never blocks
Claude Code shutting down (always exits 0).

Three-step install on whichever machine runs Claude Code:

```bash
# 1. drop the script
mkdir -p ~/.stack && cp hook/stack-session-end.mjs ~/.stack/

# 2. create ~/.stack/env  (this file holds the secrets; never commit it)
cat > ~/.stack/env <<'ENV'
STACK_API=https://stack.your-domain
STACK_TOKEN=the-same-value-as-API_TOKEN
# optional — enables structured AI summaries + extraction instead of a raw last-message fallback:
ANTHROPIC_API_KEY=sk-ant-...
ENV

# 3. merge hook/settings.snippet.json into ~/.claude/settings.json
```

Test it without a real session (fires a synthetic checkpoint with a demo bug + next-steps):

```bash
node ~/.stack/stack-session-end.mjs --demo
```

## Conventions

- en-AU spelling throughout.
- No secrets in the repo. Secrets load at runtime from `.env` (server) and `~/.stack/env` (hook).
- `web/src/store.ts` is the only module that touches the network — keep it that way.
