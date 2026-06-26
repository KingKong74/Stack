import { q } from './db.js';

// Resolve a project row by slug for the per-project collection routers.
// Returns the row or null.
export async function projectBySlug(slug) {
  const { rows } = await q('SELECT * FROM projects WHERE slug = $1', [slug]);
  return rows[0] || null;
}
