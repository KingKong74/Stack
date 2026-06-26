import type { Project, Activity, Collections } from './types';

// Cover tints in dashboard order.
export const SEED_PROJECTS: Project[] = [
  {
    id: 'trailmark', name: 'Trailmark', subtitle: 'Hiking log + trail discovery web app',
    tint: '#e3d4c8', status: 'live', progress: 64, metaLine: 'pushed 2h ago',
    siteUrl: 'https://trailmark.app', repoUrl: 'https://github.com/KingKong74/trailmark',
    meta: { version: 'v1.4.2', lastDeploy: '2h ago', stack: ['React', 'TypeScript', 'Supabase', 'Tailwind'], pushesThisWeek: 12 },
    resume: {
      when: '2h ago', ref: 'a3f9c1',
      summary: "You were finishing the elevation-chart tooltip and migrating auth to Supabase magic links. The tooltip renders now but mis-positions on mobile. Magic-link login works end to end — session refresh is still stubbed with a temporary token hack.",
      inProgress: ['Elevation chart tooltip — mobile positioning is off', 'Session refresh after magic-link login (stubbed)'],
      nextUp: ['Finish session refresh, then remove the temporary token hack', 'Add a test for the difficulty filter you just shipped'],
      liked: ['Magic-link login flow feels clean — keep it', 'New difficulty-filter UX with URL sync'],
    },
  },
  {
    id: 'quill', name: 'Quill', subtitle: 'Markdown-first writing & publishing app',
    tint: '#d3ddcf', status: 'live', progress: 90, metaLine: 'pushed 1d ago',
    siteUrl: 'https://quill.ink', repoUrl: 'https://github.com/KingKong74/quill',
    meta: { version: 'v2.1.0', lastDeploy: '1d ago', stack: ['SvelteKit', 'TypeScript', 'Postgres'], pushesThisWeek: 5 },
    resume: {
      when: '1d ago', ref: 'c81a07',
      summary: 'Shipped the slash-command menu and inline image paste. Export to static HTML is feature-complete; just polishing the typography presets before the 2.1 tag.',
      inProgress: ['Typography preset picker — last two presets unstyled'],
      nextUp: ['Tag v2.1 and write the release notes', 'Smoke-test image paste on Safari'],
      liked: ['Slash menu keyboard nav is snappy', 'Static export output is clean and tiny'],
    },
  },
  {
    id: 'beacon', name: 'Beacon', subtitle: 'Status page + uptime notifier',
    tint: '#cdd9e0', status: 'building', progress: 45, metaLine: 'pushed 3h ago',
    siteUrl: 'https://beacon.sh', repoUrl: 'https://github.com/KingKong74/beacon',
    meta: { version: 'v0.6.0-rc', lastDeploy: '3h ago', stack: ['Go', 'React', 'SQLite'], pushesThisWeek: 9 },
    resume: {
      when: '3h ago', ref: 'd40b9e',
      summary: 'Built the incident timeline and wired the first notifier (email). Webhook + Slack notifiers are scaffolded but not sending yet. Check scheduler still drifts under load.',
      inProgress: ['Slack notifier — payload builds, delivery untested', 'Check scheduler drifts past 200 monitors'],
      nextUp: ['Pin the scheduler with a leaky-bucket queue', 'Wire Slack delivery and add a retry'],
      liked: ['Incident timeline component is reusable', 'Go check runner is fast and lean'],
    },
  },
  {
    id: 'pantry', name: 'Pantry', subtitle: 'Recipes + smart grocery lists',
    tint: '#e6dcc4', status: 'live', progress: 78, metaLine: 'pushed 4d ago',
    siteUrl: 'https://pantry.kitchen', repoUrl: 'https://github.com/KingKong74/pantry',
    meta: { version: 'v1.2.4', lastDeploy: '4d ago', stack: ['Next.js', 'TypeScript', 'Prisma'], pushesThisWeek: 3 },
    resume: {
      when: '4d ago', ref: '5e2c11',
      summary: 'Recipe scaling and the auto-merged grocery list both ship. Working on pantry-stock subtraction so the list only shows what you actually need to buy.',
      inProgress: ['Subtract on-hand pantry stock from generated lists'],
      nextUp: ['Handle unit conversions (cups ↔ grams) in the merge', 'Add a "staples" list you never have to re-add'],
      liked: ['Recipe scaler keeps fractions readable', 'Drag-to-reorder list feels great on mobile'],
    },
  },
  {
    id: 'cadence', name: 'Cadence', subtitle: 'Habit & routine tracker',
    tint: '#e6d6d6', status: 'paused', progress: 31, metaLine: 'paused 3w ago',
    siteUrl: 'https://cadence.day', repoUrl: 'https://github.com/KingKong74/cadence',
    meta: { version: 'v0.3.0', lastDeploy: '3w ago', stack: ['React Native', 'Expo', 'SQLite'], pushesThisWeek: 0 },
    resume: {
      when: '3w ago', ref: '9aa120',
      summary: 'Paused mid-redesign of the streak view. The new heatmap calendar is half-built; the old list view is still wired up behind a flag so the app runs.',
      inProgress: [],
      nextUp: ['Decide: finish the heatmap or revert to the list view', 'Reminders need the notification permission flow'],
      liked: ['Local-first SQLite sync model held up well', 'The minimal check-off interaction is satisfying'],
    },
  },
  {
    id: 'dispatch', name: 'Dispatch', subtitle: 'Courier dispatch & route board',
    tint: '#dcdac9', status: 'live', progress: 100, metaLine: 'pushed 1w ago',
    siteUrl: 'https://dispatch.run', repoUrl: 'https://github.com/KingKong74/dispatch',
    meta: { version: 'v3.0.0', lastDeploy: '1w ago', stack: ['Rails', 'Hotwire', 'Postgres', 'Redis'], pushesThisWeek: 2 },
    resume: {
      when: '1w ago', ref: 'f1d6b3',
      summary: 'v3 shipped and is stable. Live driver tracking and the auto-assign algorithm are both in production. This round is done — only small ops follow-ups remain.',
      inProgress: [],
      nextUp: ['Watch auto-assign metrics for a week before tweaking', 'Document the dispatcher onboarding flow'],
      liked: ['Hotwire live board updates with zero custom JS', 'Auto-assign cut idle time noticeably'],
    },
  },
  {
    id: 'glyph', name: 'Glyph', subtitle: 'Browser-based SVG icon editor',
    tint: '#ddd2cd', status: 'building', progress: 12, metaLine: 'pushed 5h ago',
    siteUrl: 'https://glyph.tools', repoUrl: 'https://github.com/KingKong74/glyph',
    meta: { version: 'v0.1.0', lastDeploy: '5h ago', stack: ['Vue', 'TypeScript', 'Canvas'], pushesThisWeek: 14 },
    resume: {
      when: '5h ago', ref: '2b77ce',
      summary: 'Early days. The canvas renders a path and you can drag anchor points. Boolean operations and the export pipeline are the big unknowns still ahead.',
      inProgress: ['Bezier handle editing — dragging works, snapping does not'],
      nextUp: ['Spike a boolean-ops library before committing to one', 'Decide on the project file format'],
      liked: ['Canvas + pointer-events architecture feels right'],
    },
  },
  {
    id: 'ferry', name: 'Ferry', subtitle: 'End-to-end encrypted file transfer',
    tint: '#d2d6dc', status: 'paused', progress: 22, metaLine: 'paused 1mo ago',
    siteUrl: 'https://ferry.to', repoUrl: 'https://github.com/KingKong74/ferry',
    meta: { version: 'v0.2.1', lastDeploy: '1mo ago', stack: ['TypeScript', 'WebRTC', 'libsodium'], pushesThisWeek: 0 },
    resume: {
      when: '1mo ago', ref: '7c0e55',
      summary: 'Paused after getting a direct WebRTC transfer working between two tabs. The relay fallback for restrictive networks is the hard part still untouched.',
      inProgress: [],
      nextUp: ['Stand up a TURN relay for the fallback path', 'Add a resumable-transfer chunk protocol'],
      liked: ['libsodium key exchange wrapper is tidy', 'Drag-and-drop send UX is dead simple'],
    },
  },
];

export const SEED_ACTIVITY: Record<string, Activity[]> = {
  trailmark: [
    { hash: 'a3f9c1', branch: 'main', when: '2h ago', summary: 'Fixed elevation chart tooltip rendering, but it still mis-positions on small screens — flagged for follow-up. Touched ChartTooltip.tsx and useElevation.ts.', tags: ['charts', 'in progress'] },
    { hash: '7b1e44', branch: 'main', when: '1d ago', summary: 'Added trail filtering by difficulty (easy / moderate / hard) with a new filter store and URL sync. No tests yet.', tags: ['feature', 'needs tests'] },
    { hash: 'e0c982', branch: 'main', when: '3d ago', summary: 'Bumped dependencies and rewrote the README setup steps. Routine maintenance, no behavior changes.', tags: ['chore'] },
    { hash: '4d77a0', branch: 'auth', when: '4d ago', summary: 'Switched login to Supabase magic links and removed the password fields. Session refresh left as a stub — see the TODO in auth.ts.', tags: ['auth', 'in progress'] },
    { hash: '9f0b21', branch: 'main', when: '5d ago', summary: 'Reworked trail search to be diacritic-insensitive on the client. Server-side normalization still pending.', tags: ['search'] },
  ],
  quill: [
    { hash: 'c81a07', branch: 'main', when: '1d ago', summary: 'Added the slash-command menu with keyboard navigation and inline image paste. Image paste needs a Safari check.', tags: ['editor', 'needs tests'] },
    { hash: 'b209f4', branch: 'main', when: '2d ago', summary: 'Static HTML export is feature-complete — clean markup, inlined critical CSS, tiny output.', tags: ['export'] },
    { hash: 'a7e3d0', branch: 'main', when: '4d ago', summary: 'Reworked the typography preset system; two presets still need styling before the tag.', tags: ['design', 'in progress'] },
  ],
  beacon: [
    { hash: 'd40b9e', branch: 'main', when: '3h ago', summary: 'Built the incident timeline component and shipped the email notifier. Slack and webhook notifiers scaffolded but not delivering.', tags: ['notifiers', 'in progress'] },
    { hash: 'c1a8f2', branch: 'main', when: '8h ago', summary: 'Added the monitor check runner in Go. Fast, but the scheduler drifts past ~200 monitors.', tags: ['scheduler', 'todo'] },
    { hash: '90b3aa', branch: 'main', when: '1d ago', summary: 'Status-page public view now renders historical uptime bars from SQLite.', tags: ['feature'] },
  ],
  pantry: [
    { hash: '5e2c11', branch: 'main', when: '4d ago', summary: 'Recipe scaling keeps fractions readable; the auto-merged grocery list dedupes across recipes.', tags: ['feature'] },
    { hash: '4b1907', branch: 'main', when: '6d ago', summary: 'Started subtracting on-hand pantry stock from generated lists — unit conversions still missing.', tags: ['lists', 'in progress'] },
  ],
  cadence: [
    { hash: '9aa120', branch: 'redesign', when: '3w ago', summary: 'Half-built the heatmap streak calendar; old list view kept behind a flag so the app still runs. Paused here.', tags: ['design', 'in progress'] },
    { hash: '81c7e0', branch: 'main', when: '4w ago', summary: 'Local-first SQLite check-off model working with offline sync.', tags: ['sync'] },
  ],
  dispatch: [
    { hash: 'f1d6b3', branch: 'main', when: '1w ago', summary: 'Tagged v3.0.0. Live driver tracking and auto-assign both in production and stable.', tags: ['release'] },
    { hash: 'e9a204', branch: 'main', when: '2w ago', summary: 'Auto-assign algorithm cut average idle time; added a manual override for dispatchers.', tags: ['feature'] },
  ],
  glyph: [
    { hash: '2b77ce', branch: 'main', when: '5h ago', summary: 'Anchor-point dragging works on the canvas; snapping to grid does not yet.', tags: ['canvas', 'in progress'] },
    { hash: '1f50ab', branch: 'main', when: '9h ago', summary: 'Set up the Vue + Canvas + pointer-events architecture and rendered a first editable path.', tags: ['setup'] },
  ],
  ferry: [
    { hash: '7c0e55', branch: 'main', when: '1mo ago', summary: 'Direct WebRTC transfer working tab-to-tab with a libsodium key exchange. Relay fallback untouched. Paused.', tags: ['transfer', 'in progress'] },
  ],
};

export const SEED_COLLECTIONS: Record<string, Collections> = {
  trailmark: {
    bugs: [
      { id: 'BUG-31', title: 'Elevation tooltip mis-positions on mobile', severity: 'high', status: 'fixing', meta: 'reported 2h ago', linkRef: 'a3f9c1' },
      { id: 'BUG-30', title: 'Session not refreshed after magic-link login', severity: 'critical', status: 'fixing', meta: 'reported 4d ago', linkRef: '4d77a0' },
      { id: 'BUG-28', title: 'Trail search ignores diacritics', severity: 'medium', status: 'investigating', meta: 'reported 5d ago', linkRef: '9f0b21' },
      { id: 'BUG-27', title: 'Map tiles flash on theme switch', severity: 'low', status: 'open', meta: 'reported 1w ago', linkRef: null },
      { id: 'BUG-22', title: 'GPX import fails on Garmin files over 5MB', severity: 'high', status: 'investigating', meta: 'reported 1w ago', linkRef: null },
      { id: 'BUG-19', title: 'Duplicate hikes after offline sync', severity: 'medium', status: 'fixed', meta: 'closed 2w ago', linkRef: null },
    ],
    roadmap: {
      must: [
        { title: 'Fix session refresh', note: 'Blocks reliable logout / login' },
        { title: 'Mobile tooltip positioning', note: 'Charts unusable on phone' },
        { title: 'Offline map caching', note: 'Core promise of the app' },
      ],
      should: [
        { title: 'Share a trail to a public link', note: '' },
        { title: 'GPX import for large files', note: '' },
        { title: 'Tests for the difficulty filter', note: '' },
      ],
      could: [
        { title: 'Dark map theme', note: '' },
        { title: 'Weather overlay on trails', note: '' },
        { title: 'Strava import', note: '' },
      ],
      wont: [
        { title: 'Social feed', note: 'Out of scope for v1' },
        { title: 'Native mobile app', note: '' },
      ],
    },
    notes: [
      { id: 'n1', text: 'Try clustering trail markers when zoomed out — the map gets noisy', color: '#fef4a8', when: '2d ago' },
      { id: 'n2', text: 'Idea: weekly email digest of your hikes', color: '#e6f0d8', when: '3d ago' },
      { id: 'n3', text: "Don't forget to revoke the old API token before launch", color: '#dce8f0', when: '5d ago' },
    ],
  },
  quill: {
    bugs: [
      { id: 'BUG-12', title: 'Image paste drops alt text on Safari', severity: 'medium', status: 'investigating', meta: 'reported 1d ago', linkRef: 'c81a07' },
      { id: 'BUG-9', title: 'Slash menu stays open after Escape', severity: 'low', status: 'open', meta: 'reported 3d ago', linkRef: null },
    ],
    roadmap: {
      must: [{ title: 'Style the last two typography presets', note: 'Blocks the 2.1 tag' }],
      should: [{ title: 'Safari image-paste fix', note: '' }, { title: 'Release notes for 2.1', note: '' }],
      could: [{ title: 'Custom CSS per document', note: '' }],
      wont: [{ title: 'Real-time collaboration', note: 'Maybe v3' }],
    },
    notes: [{ id: 'qn1', text: 'Consider a focus/zen mode that hides everything but the text', color: '#f0e7d2', when: '2d ago' }],
  },
  beacon: {
    bugs: [
      { id: 'BUG-7', title: 'Scheduler drifts past 200 monitors', severity: 'high', status: 'fixing', meta: 'reported 3h ago', linkRef: 'c1a8f2' },
      { id: 'BUG-5', title: 'Slack notifier builds payload but never sends', severity: 'high', status: 'open', meta: 'reported 3h ago', linkRef: 'd40b9e' },
    ],
    roadmap: {
      must: [{ title: 'Pin scheduler with a leaky-bucket queue', note: 'Drift makes checks unreliable' }, { title: 'Working Slack delivery', note: '' }],
      should: [{ title: 'Webhook notifier with retries', note: '' }],
      could: [{ title: 'Status-page custom domains', note: '' }],
      wont: [{ title: 'Built-in on-call scheduling', note: 'Integrate, do not rebuild' }],
    },
    notes: [{ id: 'bn1', text: 'Notifier interface should make adding new channels a 10-minute job', color: '#dce8f0', when: '4h ago' }],
  },
  pantry: {
    bugs: [{ id: 'BUG-14', title: 'Unit merge double-counts when cups meet grams', severity: 'medium', status: 'investigating', meta: 'reported 4d ago', linkRef: '4b1907' }],
    roadmap: {
      must: [{ title: 'Pantry-stock subtraction', note: 'List should show only what you need to buy' }],
      should: [{ title: 'Unit conversions in the merge', note: '' }, { title: 'A "staples" list', note: 'Never re-add milk again' }],
      could: [{ title: 'Barcode scan to add stock', note: '' }],
      wont: [],
    },
    notes: [{ id: 'pn1', text: 'Recipe import from a URL would be magic but is a rabbit hole', color: '#f3dfe1', when: '5d ago' }],
  },
  cadence: {
    bugs: [{ id: 'BUG-4', title: 'Streak resets at the wrong timezone midnight', severity: 'high', status: 'open', meta: 'reported 3w ago', linkRef: null }],
    roadmap: {
      must: [{ title: 'Decide: finish heatmap or revert', note: 'App is half in two states' }],
      should: [{ title: 'Notification permission flow', note: '' }],
      could: [{ title: 'Weekly review screen', note: '' }],
      wont: [{ title: 'Social streaks / friends', note: '' }],
    },
    notes: [{ id: 'cn1', text: 'Picking this back up: start by ripping out the feature flag and choosing one view', color: '#fef4a8', when: '3w ago' }],
  },
  dispatch: {
    bugs: [{ id: 'BUG-2', title: 'Rare double-assign when two dispatchers act at once', severity: 'low', status: 'open', meta: 'reported 1w ago', linkRef: null }],
    roadmap: {
      must: [],
      should: [{ title: 'Dispatcher onboarding docs', note: '' }],
      could: [{ title: 'Driver mobile app polish', note: '' }],
      wont: [{ title: 'Customer-facing tracking page', note: 'Separate product' }],
    },
    notes: [{ id: 'dn1', text: 'Let auto-assign metrics bake for a week before touching the weights', color: '#e6f0d8', when: '1w ago' }],
  },
  glyph: {
    bugs: [{ id: 'BUG-3', title: 'Anchor drag jitters at high zoom', severity: 'medium', status: 'open', meta: 'reported 5h ago', linkRef: '2b77ce' }],
    roadmap: {
      must: [{ title: 'Pick a boolean-ops approach', note: 'Union/subtract is core' }, { title: 'Choose a project file format', note: '' }],
      should: [{ title: 'Grid snapping for handles', note: '' }],
      could: [{ title: 'Multi-path layers panel', note: '' }],
      wont: [{ title: 'Raster editing', note: 'Vectors only' }],
    },
    notes: [{ id: 'gn1', text: 'Steal interaction ideas from Figma pen tool but keep it way simpler', color: '#dce8f0', when: '5h ago' }],
  },
  ferry: {
    bugs: [{ id: 'BUG-6', title: 'Transfer stalls behind symmetric NAT', severity: 'high', status: 'open', meta: 'reported 1mo ago', linkRef: null }],
    roadmap: {
      must: [{ title: 'TURN relay fallback', note: 'Direct WebRTC fails on strict networks' }],
      should: [{ title: 'Resumable chunk protocol', note: '' }],
      could: [{ title: 'Transfer link expiry settings', note: '' }],
      wont: [{ title: 'Account system', note: 'Stays anonymous' }],
    },
    notes: [{ id: 'fn1', text: 'The whole pitch is "no accounts, no cloud" — protect that when adding the relay', color: '#f0e7d2', when: '1mo ago' }],
  },
};

export const NOTE_PALETTE = ['#fef4a8', '#e6f0d8', '#dce8f0', '#f3dfe1', '#f0e7d2'];
