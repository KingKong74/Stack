import { Router } from 'express';
import { q } from '../db.js';

export const projects = Router();

// GET /api/projects  -> all projects with live state, resume-order
projects.get('/', async (req, res) => {
  const { rows } = await q(
    `SELECT id, slug, name, repo, status, current_phase, summary,
            next_steps, blockers, pinned, last_session_at, updated_at,
            (SELECT count(*)::int FROM sessions s WHERE s.project_id = p.id) AS session_count
       FROM projects p
      ORDER BY pinned DESC, last_session_at DESC NULLS LAST, updated_at DESC`
  );
  res.json(rows);
});

// GET /api/projects/:slug  -> one project + recent checkpoints
projects.get('/:slug', async (req, res) => {
  const { rows } = await q(`SELECT * FROM projects WHERE slug = $1`, [req.params.slug]);
  if (!rows.length) return res.status(404).json({ error: 'No such project.' });
  const project = rows[0];
  const sessions = await q(
    `SELECT id, session_id, summary, current_phase, next_steps, blockers,
            files_touched, tools_used, branch, cwd, model, reason,
            message_count, source, created_at
       FROM sessions WHERE project_id = $1
      ORDER BY created_at DESC LIMIT 50`,
    [project.id]
  );
  res.json({ ...project, sessions: sessions.rows });
});

const PATCHABLE = new Set([
  'name', 'repo', 'status', 'current_phase', 'summary', 'next_steps', 'blockers', 'pinned',
]);

// PATCH /api/projects/:slug  -> manual override of live state
projects.patch('/:slug', async (req, res) => {
  const fields = [];
  const values = [];
  let i = 1;
  for (const [key, val] of Object.entries(req.body || {})) {
    if (!PATCHABLE.has(key)) continue;
    if (key === 'next_steps' || key === 'blockers') {
      fields.push(`${key} = $${i}::jsonb`);
      values.push(JSON.stringify(Array.isArray(val) ? val : []));
    } else if (key === 'pinned') {
      fields.push(`pinned = $${i}`);
      values.push(Boolean(val));
    } else {
      fields.push(`${key} = $${i}`);
      values.push(val === '' ? null : val);
    }
    i++;
  }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update.' });

  values.push(req.params.slug);
  const { rows } = await q(
    `UPDATE projects SET ${fields.join(', ')}, updated_at = now()
      WHERE slug = $${i} RETURNING *`,
    values
  );
  if (!rows.length) return res.status(404).json({ error: 'No such project.' });
  res.json(rows[0]);
});

// DELETE /api/projects/:slug  -> remove a project and its checkpoints
projects.delete('/:slug', async (req, res) => {
  const { rowCount } = await q(`DELETE FROM projects WHERE slug = $1`, [req.params.slug]);
  if (!rowCount) return res.status(404).json({ error: 'No such project.' });
  res.json({ ok: true });
});
