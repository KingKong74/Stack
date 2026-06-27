// Single-row app settings — shared read helper + client shape. The HTTP layer
// lives in routes/settings.js; ingest and overview import readSettings() so the
// no-API model's switches take effect server-side.

import { q } from './db.js';
import { oneOf } from './util.js';

export const CHECKPOINT_DETAILS = ['brief', 'standard', 'detailed'];

const DEFAULTS = {
  auto_record: true,
  keep_resume_card: true,
  checkpoint_detail: 'standard',
  include_chores: false,
};

// Read the singleton row. Accepts an optional pg client (so ingest can read
// inside its transaction). Falls back to the defaults if the row is missing.
export async function readSettings(client) {
  const run = client ? (text, params) => client.query(text, params) : q;
  const { rows } = await run('SELECT * FROM settings WHERE id = true');
  if (!rows.length) return { ...DEFAULTS };
  const r = rows[0];
  return {
    auto_record: r.auto_record,
    keep_resume_card: r.keep_resume_card,
    checkpoint_detail: oneOf(r.checkpoint_detail, CHECKPOINT_DETAILS, 'standard'),
    include_chores: r.include_chores,
  };
}

export function settingsShape(s) {
  return {
    autoRecord: s.auto_record,
    keepResumeCard: s.keep_resume_card,
    checkpointDetail: s.checkpoint_detail,
    includeChores: s.include_chores,
  };
}
