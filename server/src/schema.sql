-- Stack schema. Idempotent: safe to run on every boot.

CREATE TABLE IF NOT EXISTS projects (
  id              SERIAL PRIMARY KEY,
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  repo            TEXT,
  status          TEXT NOT NULL DEFAULT 'active',      -- active | paused | done | archived
  current_phase   TEXT,
  summary         TEXT,                                -- latest "where we are at"
  next_steps      JSONB NOT NULL DEFAULT '[]'::jsonb,
  blockers        JSONB NOT NULL DEFAULT '[]'::jsonb,
  pinned          BOOLEAN NOT NULL DEFAULT false,
  last_session_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id            SERIAL PRIMARY KEY,
  project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id    TEXT,
  summary       TEXT,
  current_phase TEXT,
  next_steps    JSONB NOT NULL DEFAULT '[]'::jsonb,
  blockers      JSONB NOT NULL DEFAULT '[]'::jsonb,
  files_touched JSONB NOT NULL DEFAULT '[]'::jsonb,
  tools_used    JSONB NOT NULL DEFAULT '[]'::jsonb,
  branch        TEXT,
  cwd           TEXT,
  model         TEXT,
  reason        TEXT,                                  -- session end reason (exit | clear | ...)
  message_count INTEGER,
  source        TEXT NOT NULL DEFAULT 'hook',          -- hook | manual
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_touch  ON projects (pinned DESC, last_session_at DESC NULLS LAST);
