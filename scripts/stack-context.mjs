#!/usr/bin/env node
// Stack — export the portable agent-context template to stdout.
//
// The template at templates/stack-agent-context.md is the single source of
// truth. This prints it verbatim, optionally stamped with a project's slug and
// the API base so a fresh Claude session knows exactly which project + endpoint
// it is bound to. Pipe it where you want it:
//
//   node scripts/stack-context.mjs                                   # generic template
//   node scripts/stack-context.mjs --slug stack --api https://…      # stamped
//   node scripts/stack-context.mjs --slug stack >> CLAUDE.md         # append to a project
//   node scripts/stack-context.mjs --api https://… >> ~/.claude/CLAUDE.md
//
// Zero dependencies. Exits non-zero only if the template can't be read.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const argv = process.argv.slice(2);
function flag(name) {
  const i = argv.indexOf(`--${name}`);
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.slice(name.length + 3) : null;
}

const slug = flag('slug');
const api = (flag('api') || '').replace(/\/$/, '');

const here = dirname(fileURLToPath(import.meta.url));
const templatePath = join(here, '..', 'templates', 'stack-agent-context.md');

let body;
try {
  body = readFileSync(templatePath, 'utf8').trimEnd();
} catch (e) {
  process.stderr.write(`[stack] could not read template at ${templatePath}: ${e.message}\n`);
  process.exit(1);
}

// When a slug and/or API base are supplied, stamp a binding footer so the
// reader knows which project + endpoint this copy is wired to.
const out = [body];
if (slug || api) {
  out.push('', '---', '', '## This copy is bound to', '');
  if (slug) out.push(`- **Project slug:** \`${slug}\``);
  if (api) {
    out.push(`- **API base:** \`${api}\``);
    if (slug) out.push(`- **Live state:** \`GET ${api}/api/projects/${slug}\``);
  }
}

process.stdout.write(out.join('\n') + '\n');
