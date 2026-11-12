/**
 * `npm run production:summary [-- --run <FEATURE_RUN_ID>] [--target staging]`
 *
 * Final PASS / FAIL / SKIP of a profile-lane run, from every worker's file in
 * reports/<target>/runs/<runId>/ (FeatureResultReporter). When the Card TCs were
 * re-run after the operator confirmed a real card, the later result of a TC wins.
 * SKIP is split into Card (PENDING real money) and other (data gap / read-only store).
 * Writes reports/<target>/<runId>-summary.md and prints it.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { FeatureResult } from '../configs/reporters/FeatureResultReporter.js';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')),
  '..',
);
const argv = process.argv.slice(2);
const arg = (n: string): string | undefined => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const target = arg('target') ?? process.env.TARGET ?? 'production';
const runsDir = path.join(ROOT, 'reports', target, 'runs');
if (!fs.existsSync(runsDir)) {
  console.log(`No runs in ${runsDir}`);
  process.exit(0);
}
const runId = arg('run') ?? fs.readdirSync(runsDir).sort().at(-1) ?? '';
const dir = path.join(runsDir, runId);

interface WorkerFile {
  store: string;
  file: string;
  results: FeatureResult[];
}
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => ({ f, st: fs.statSync(path.join(dir, f)).mtimeMs }))
  .sort((a, b) => a.st - b.st)
  .map(({ f }) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as WorkerFile);

const project = (file: string): string => {
  const m = file.replace(/\\/g, '/').match(/tests\/features\/([^/]+)\//);
  return m?.[1] ?? 'preflight';
};

// Later results of the same TC (Card re-run) replace earlier ones.
const byKey = new Map<string, FeatureResult & { project: string }>();
let store = '';
for (const w of files) {
  store ||= w.store;
  for (const r of w.results)
    byKey.set(`${r.file}::${r.suite}::${r.title}`, { ...r, project: project(r.file) });
}
const rows = [...byKey.values()];
const isCard = (r: { title: string; project: string }): boolean =>
  r.title.startsWith('[CARD]') || r.project === 'zz-card';
const n = (rs: typeof rows, f: (r: (typeof rows)[number]) => boolean): number => rs.filter(f).length;

const out: string[] = [];
out.push(`# ${target} feature run ${runId} — store ${store}`, '');
out.push('| Project | Total | PASS | FAIL | SKIP (Card) | SKIP (other) |', '|---|---|---|---|---|---|');
const projects = [...new Set(rows.map((r) => r.project))].sort();
for (const p of projects) {
  const rs = rows.filter((r) => r.project === p);
  out.push(
    `| ${p} | ${rs.length} | ${n(rs, (r) => r.state === 'passed')} | ${n(rs, (r) => r.state === 'failed')} | ` +
      `${n(rs, (r) => r.state === 'skipped' && isCard(r))} | ${n(rs, (r) => r.state === 'skipped' && !isCard(r))} |`,
  );
}
out.push(
  `| **Total** | **${rows.length}** | **${n(rows, (r) => r.state === 'passed')}** | **${n(rows, (r) => r.state === 'failed')}** | ` +
    `**${n(rows, (r) => r.state === 'skipped' && isCard(r))}** | **${n(rows, (r) => r.state === 'skipped' && !isCard(r))}** |`,
  '',
);
const fails = rows.filter((r) => r.state === 'failed');
if (fails.length) {
  out.push('## FAIL', '');
  for (const r of fails)
    out.push(
      `- **${r.project}** — ${r.title}`,
      `  \`${r.error.split('\n').slice(0, 3).join(' ⏎ ').slice(0, 300)}\``,
    );
  out.push('');
}
const skips = rows.filter((r) => r.state === 'skipped');
if (skips.length) {
  out.push('## SKIP', '');
  for (const r of skips)
    out.push(
      `- ${isCard(r) ? '💳 Card' : 'other'} · **${r.project}** — ${r.title}${r.reason ? ` — _${r.reason.slice(0, 200)}_` : ''}`,
    );
  out.push('');
}
// Coverage of the Verified-Production catalog (docs/production/verified-production-catalog.json):
// a task is PASS when every TC naming it passed, FAIL when one failed, SKIP when all skipped.
const catFile = path.join(ROOT, 'docs', 'production', 'verified-production-catalog.json');
if (fs.existsSync(catFile)) {
  const cat = JSON.parse(fs.readFileSync(catFile, 'utf8')) as { id: string; title: string; area: string }[];
  const ids = (title: string): string[] => {
    const found: string[] = [];
    for (const m of title.matchAll(/VP-?(\d+)((?:\/\d+)*)/g)) {
      found.push(`VP-${m[1] ?? ''}`);
      for (const extra of (m[2] ?? '').split('/').filter(Boolean)) found.push(`VP-${extra}`);
    }
    return found;
  };
  const per = new Map<string, string[]>();
  for (const r of rows)
    for (const id of new Set([...ids(r.title), ...ids(r.suite)]))
      per.set(id, [...(per.get(id) ?? []), r.state]);
  const verdict = (id: string): string => {
    const st = per.get(id);
    if (!st) return 'not automated';
    if (st.includes('failed')) return 'FAIL';
    if (st.every((x) => x === 'skipped')) return 'SKIP';
    return 'PASS';
  };
  const tally: Record<string, number> = {};
  for (const c of cat) tally[verdict(c.id)] = (tally[verdict(c.id)] ?? 0) + 1;
  out.push('## Verified Production tasks (catalog)', '');
  out.push(
    `${String(cat.length)} POS tasks · ${Object.entries(tally)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(' · ')}`,
    '',
  );
  out.push('| Task | Area | Result | Title |', '|---|---|---|---|');
  for (const c of cat.filter((x) => per.has(x.id)))
    out.push(`| ${c.id} | ${c.area} | ${verdict(c.id)} | ${c.title.slice(0, 80)} |`);
  out.push('');
}
const text = out.join('\n');
const outFile = path.join(ROOT, 'reports', target, `${runId}-summary.md`);
fs.writeFileSync(outFile, text);
console.log(`\n${text}\nSaved ${outFile}`);
