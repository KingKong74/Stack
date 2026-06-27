#!/usr/bin/env node
// Stack — /checkpoint poster.
//
// Reads a JSON checkpoint on stdin and POSTs it to STACK_API/api/ingest as a
// rich, Claude-authored checkpoint (authored = true). The /checkpoint slash
// command composes the JSON; this script just loads the token from ~/.stack/env
// (never printing it) and ships it. Shares its POST/env/git logic with the
// SessionEnd hook via stack-post.mjs.
//
// Usage:
//   node ~/.stack/stack-checkpoint.mjs            # read checkpoint JSON on stdin and post
//   node ~/.stack/stack-checkpoint.mjs --settings # print current settings JSON (for the command)
//
// Install: copy alongside the hooks into ~/.stack/ (with stack-post.mjs).

import { readFileSync } from 'node:fs';
import {
  loadStackEnv, logStderr, projectFromGit, fetchSettings, postIngest,
} from './stack-post.mjs';

loadStackEnv();

function readStdin() {
  try { return readFileSync(0, 'utf8'); } catch { return ''; }
}

(async () => {
  if (!process.env.STACK_API || !process.env.STACK_TOKEN) {
    logStderr('STACK_API and STACK_TOKEN must be set in ~/.stack/env.');
    process.exit(1);
  }

  // --settings: emit the current settings so /checkpoint can honour
  // checkpoint_detail and include_chores. Token stays inside this process.
  if (process.argv.includes('--settings')) {
    const s = await fetchSettings();
    process.stdout.write(JSON.stringify(s));
    process.exit(0);
  }

  let input = {};
  try { input = JSON.parse(readStdin() || '{}'); } catch {
    logStderr('checkpoint stdin was not valid JSON.');
    process.exit(1);
  }

  // Fill the project identity from git if the caller didn't provide one.
  const cwd = input.cwd || input.session?.cwd || process.cwd();
  const fromGit = projectFromGit(cwd);
  const project = {
    slug: input.project?.slug || fromGit.slug,
    name: input.project?.name || fromGit.name,
    repo: input.project?.repo || fromGit.repo,
    repo_url: input.project?.repo_url || fromGit.repo_url,
  };

  // Force the authored flag and fill commit/branch from git when absent.
  const session = {
    ...(input.session || {}),
    authored: true,
    commit_hash: input.session?.commit_hash || fromGit.commit,
    branch: input.session?.branch || fromGit.branch,
    cwd,
  };

  const body = {
    project,
    session,
    extract: input.extract || { bugs: [], next_steps: [] },
  };

  const result = await postIngest(body);
  if (!result.ok) {
    logStderr(`checkpoint failed${result.status ? ` (HTTP ${result.status})` : ''}${result.reason ? `: ${result.reason}` : ''}`);
    process.exit(1);
  }
  logStderr(`checkpoint saved for ${project.slug}${session.commit_hash ? ` @ ${session.commit_hash}` : ''}`);
  process.exit(0);
})();
