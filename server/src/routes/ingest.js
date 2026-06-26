import { Router } from 'express';
import { q, pool } from '../db.js';

export const ingest = Router();

// Normalise an array-of-strings field coming from the hook.
function asList(v) {
  if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean).slice(0, 50);
  return [];
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'untitled';
}

/**
 * POST /api/ingest
 * Body shape (all session.* optional except a project identity):
 * {
 *   project: { slug?, name?, repo? },
 *   session: {
 *     session_id?, summary?, current_phase?, next_steps?[], blockers?[],
 *     files_touched?[], tools_used?[], branch?, cwd?, model?, reason?,
 *     message_count?, started_at?, ended_at?
 *   }
 * }
 */
ingest.post('/', async (req, res) => {
  const body = req.body || {};
  const p = body.project || {};
  const s = body.session || {};

  const slug = slugify(p.slug || p.name || s.cwd?.split('/').pop());
  const name = (p.name || p.slug || slug).toString().slice(0, 200);
  const repo = p.repo ? String(p.repo).slice(0, 300) : null;

  const session = {
    session_id: s.session_id ? String(s.session_id).slice(0, 200) : null,
    summary: s.summary ? String(s.summary).slice(0, 8000) : null,
    current_phase: s.current_phase ? String(s.current_phase).slice(0, 400) : null,
    next_steps: asList(s.next_steps),
    blockers: asList(s.blockers),
    files_touched: asList(s.files_touched),
    tools_used: asList(s.tools_used),
    branch: s.branch ? String(s.branch).slice(0, 200) : null,
    cwd: s.cwd ? String(s.cwd).slice(0, 500) : null,
    model: s.model ? String(s.model).slice(0, 100) : null,
    reason: s.reason ? String(s.reason).slice(0, 100) : null,
    message_count: Number.isFinite(s.message_count) ? Math.trunc(s.message_count) : null,
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Upsert project identity. Keep repo fresh if supplied.
    const up = await client.query(
      `INSERT INTO projects (slug, name, repo, last_session_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (slug) DO UPDATE
         SET name = EXCLUDED.name,
             repo = COALESCE(EXCLUDED.repo, projects.repo),
             last_session_at = now(),
             updated_at = now()
       RETURNING id`,
      [slug, name, repo]
    );
    const projectId = up.rows[0].id;

    // Record the session as an immutable checkpoint.
    await client.query(
      `INSERT INTO sessions
         (project_id, session_id, summary, current_phase, next_steps, blockers,
          files_touched, tools_used, branch, cwd, model, reason, message_count, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'hook')`,
      [
        projectId, session.session_id, session.summary, session.current_phase,
        JSON.stringify(session.next_steps), JSON.stringify(session.blockers),
        JSON.stringify(session.files_touched), JSON.stringify(session.tools_used),
        session.branch, session.cwd, session.model, session.reason, session.message_count,
      ]
    );

    // The newest checkpoint becomes the project's live "where we are at".
    // Only overwrite fields the session actually carried, so a thin checkpoint
    // doesn't wipe a richer previous state.
    await client.query(
      `UPDATE projects SET
         summary       = COALESCE($2, summary),
         current_phase = COALESCE($3, current_phase),
         next_steps    = CASE WHEN $4::jsonb = '[]'::jsonb THEN next_steps ELSE $4::jsonb END,
         blockers      = $5::jsonb,
         status        = CASE WHEN status = 'archived' THEN status ELSE 'active' END,
         updated_at    = now()
       WHERE id = $1`,
      [
        projectId, session.summary, session.current_phase,
        JSON.stringify(session.next_steps), JSON.stringify(session.blockers),
      ]
    );

    await client.query('COMMIT');
    res.json({ ok: true, project: slug });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ingest failed:', err);
    res.status(500).json({ error: 'Ingest failed.' });
  } finally {
    client.release();
  }
});
