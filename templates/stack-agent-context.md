<!--
  Stack — portable agent operating manual.
  This file is the single source of truth. If the API or hook contract changes,
  update THIS file (it is exported verbatim by scripts/stack-context.mjs).
  Pipe it into a project's CLAUDE.md or your global ~/.claude/CLAUDE.md.
-->
# Working with my projects through Stack

Stack is my self-hosted side-project command centre. Each project has a live
"where you left off" resume card, an activity feed, a bug tracker, a MoSCoW
roadmap and sticky notes. State is **auto-managed** — you don't have to curate it.

## Trust the injected context

Two Claude Code hooks keep Stack in sync with reality:

- **SessionStart** injects a concise *"where you left off"* block at the top of the
  session — the resume summary, current phase, what's in progress / next up, any
  blockers, the open-bug count and the last few activity entries.
- **SessionEnd** captures the commit, summarises the session, and posts a
  checkpoint that refreshes the resume card and auto-extracts candidate bugs and
  next-steps into the trackers.

When a "where you left off" block is present, **trust it** rather than
reconstructing context by re-reading the whole repo. It reflects the live state
as of the last push. Only dig deeper when the task needs detail the block omits.

## Reading a project's live state on demand

The block is a snapshot. For the current state at any moment, read the API:

- `GET /api/projects` — all projects with computed progress.
- `GET /api/projects/<slug>` — one project plus its activity, bugs, roadmap and
  notes. This is the authoritative "how is this project doing right now".

The base URL and slug for the project you're in are stamped at the bottom of this
file when it was exported (or are blank in the generic template).

## Auth

Every route except `GET /api/health` needs a bearer token. The token lives in
`~/.stack/env` as `STACK_TOKEN` (alongside `STACK_API`). The hooks load it from
there. **Never print, echo, log or commit the token**, and never read it from a
shell profile or settings file — `~/.stack/env` is the only source.

## Don't hand-create duplicates

Bugs and roadmap items **auto-extract from sessions** and dedupe by a fingerprint
of their title. So:

- Don't manually re-add a bug or next-step the hook will extract anyway — you'll
  just create a near-duplicate.
- Deleting an auto item tombstones it, so the next push won't resurrect it.
- Manual items are never touched by the extractor. Reach for a manual bug/roadmap
  item/note when you want something the session summary wouldn't capture.

## House rules

- **en-AU spelling** everywhere (colour, behaviour, summarise, …).
- **`web/src/store.ts` is the only module that talks to the network.** If you add
  a data call, it goes there — components never `fetch` or touch storage directly.
- **Both hooks must always exit 0** and log only to stderr. They must never block
  or delay Claude Code starting or stopping.
- **No secrets in the repo.** Secrets load at runtime from `.env` (server) and
  `~/.stack/env` (hooks).
