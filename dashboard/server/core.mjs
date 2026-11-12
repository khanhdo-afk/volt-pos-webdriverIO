/**
 * Core Retest — the "re-test the important parts" checklist as a GUI tab.
 *
 * Source of truth is docs/qc/core-retest-checklist.md (one `### ` block per test case,
 * grouped under `## N. …`). This module:
 *   - parses that file into groups → test cases (steps / expected kept as markdown),
 *   - maps each test case to the automated `it(...)` tests that cover it (by TC id in
 *     the test title), so the GUI can run those and fill the result in by itself,
 *   - keeps one re-test session (build, env, store, tester + a result per test case)
 *     in reports/core-retest/current.json, and exports it as a markdown report.
 *
 * Test cases with no automated test are tested by hand and ticked in the GUI.
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const CHECKLIST = ['docs', 'qc', 'core-retest-checklist.md'];
const STATUSES = new Set(['pass', 'fail', 'blocked', 'skip', 'todo']);

/**
 * Test cases kept manual even if a test title mentions them: Version Update is never
 * automated (QC rule), and the smoke / receipt rows are a hand check of the real app.
 */
const MANUAL_ONLY = new Set(['Smoke', 'Version Update', '(Order History)']);

/** Ids reused by several documents (TC-01, RO-06 …): only match in specs that cite the TC's source doc. */
const GENERIC = /^(TC-\d+|RO-\d+|SPL-\d+|TC-\d+(\/\d+)+)$/;

/* ── Checklist parsing ─────────────────────────────────────────────────── */

function expandIds(raw) {
  const parts = raw
    .replace(/\s*\(.*?\)/g, '')
    .split(/\s+\/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const out = [];
  for (let p of parts) {
    if (/^\d+$/.test(p) && out.length) p = out[out.length - 1].replace(/\d+$/, p);
    out.push(p);
  }
  return out;
}

export function parseChecklist(md) {
  const groups = [];
  let group = null;
  for (const blk of md.split(/\n(?=## |### )/)) {
    if (blk.startsWith('## ')) {
      const m = blk.match(/^## (\d+)\. ([^\n—]+)/);
      group = m ? { num: Number(m[1]), name: m[2].trim(), note: '', tcs: [] } : null;
      if (group) {
        const note = blk
          .split('\n')
          .filter((l) => l.startsWith('> '))
          .map((l) => l.slice(2))
          .join('\n');
        group.note = note;
        groups.push(group);
      }
      continue;
    }
    if (!blk.startsWith('### ') || !group) continue;
    const [headLine, ...rest] = blk.split('\n');
    let head = headLine.slice(4).trim();
    const star = head.startsWith('⭐');
    head = head.replace('⭐', '').trim();
    const dot = head.indexOf('·');
    const raw = head.slice(0, dot).trim();
    const label = head.slice(dot + 1).trim();
    const body = rest
      .filter((l) => !l.startsWith('- **Kết quả:**'))
      .join('\n')
      .trim();
    const sources = [...blk.matchAll(/\*Nguồn: \[([^\]]+)\]\(([^)]+)\)\*/g)].map((m) => ({
      name: m[1],
      href: m[2],
    }));
    group.tcs.push({
      key: `${group.num}:${raw}`,
      group: group.num,
      raw,
      ids: expandIds(raw),
      label,
      star,
      body,
      sources,
      manualOnly: MANUAL_ONLY.has(raw),
    });
  }
  return groups;
}

/* ── Automated coverage ────────────────────────────────────────────────── */

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function idVariants(id) {
  const v = [id];
  const m = id.match(/^TC-(\d+)$/);
  if (m) v.push(`TC-ORDERFLOW-${m[1].padStart(2, '0')}`);
  return v;
}

/** True when `title` sits on a commented-out line of `src` (catalog.mjs reads those too). */
function commentedOut(src, title) {
  const at = src.indexOf(title.slice(0, 40));
  if (at < 0) return false;
  const lineStart = src.lastIndexOf('\n', at) + 1;
  return /^\s*(\/\/|\*)/.test(src.slice(lineStart, at));
}

/**
 * For each test case: the automated tests that cover it — [{ id, spec, title }].
 * Skips manual stubs, recovery probes, `.skip`, commented-out and `PENDING` tests.
 */
export function mapAutomated(groups, catalog, repoRoot) {
  const files = catalog
    .flatMap((f) => f.files)
    .filter((f) => !f.path.includes('/_manual/') && !f.path.startsWith('tests/_recovery/'))
    .map((f) => {
      let src = '';
      try {
        src = readFileSync(path.join(repoRoot, f.path), 'utf8');
      } catch {
        /* unreadable spec: no source match */
      }
      return { ...f, src };
    });
  for (const g of groups) {
    for (const tc of g.tcs) {
      tc.auto = [];
      tc.missing = [];
      if (tc.manualOnly) continue;
      const srcNames = tc.sources.map((s) => s.name.replace(/\.md$/, ''));
      for (const id of tc.ids) {
        const re = new RegExp(`(?<![A-Za-z0-9-])(${idVariants(id).map(escapeRe).join('|')})(?![0-9])`);
        const generic = GENERIC.test(id);
        let found = false;
        for (const f of files) {
          if (generic && !srcNames.some((n) => f.src.includes(n))) continue;
          for (const t of f.tests) {
            if (t.skip || /PENDING/.test(t.title) || !re.test(t.title)) continue;
            if (commentedOut(f.src, t.title)) continue;
            tc.auto.push({ id, spec: f.path, title: t.title });
            found = true;
          }
        }
        if (!found) tc.missing.push(id);
      }
    }
  }
  return groups;
}

/* ── Session store ─────────────────────────────────────────────────────── */

export function createCore(repoRoot, getCatalog) {
  const dir = path.join(repoRoot, 'reports', 'core-retest');
  const currentFile = path.join(dir, 'current.json');
  let cache = null; // { mtime, groups }

  const load = () => {
    const file = path.join(repoRoot, ...CHECKLIST);
    const md = readFileSync(file, 'utf8');
    if (!cache || cache.md !== md || cache.catalog !== getCatalog()) {
      const groups = mapAutomated(parseChecklist(md), getCatalog(), repoRoot);
      cache = { md, catalog: getCatalog(), groups };
    }
    return cache.groups;
  };

  const newSession = (meta = {}) => ({
    id: new Date().toISOString().replace(/[:.]/g, '-'),
    startedAt: new Date().toISOString(),
    meta: { build: '', env: 'dev', store: '', tester: '', ...meta },
    results: {},
  });

  const readSession = () => {
    try {
      return JSON.parse(readFileSync(currentFile, 'utf8'));
    } catch {
      return newSession();
    }
  };

  const writeSession = (s) => {
    mkdirSync(dir, { recursive: true });
    const tmp = `${currentFile}.tmp`;
    writeFileSync(tmp, JSON.stringify(s, null, 2));
    renameSync(tmp, currentFile);
    return s;
  };

  function state() {
    return { groups: load(), session: readSession() };
  }

  /** results: [{ key, status, note?, source?, detail? }] — `todo` clears the entry. */
  function setResults(results) {
    const s = readSession();
    for (const r of results ?? []) {
      if (!r?.key || !STATUSES.has(r.status)) continue;
      if (r.status === 'todo') {
        delete s.results[r.key];
        continue;
      }
      const prev = s.results[r.key] ?? {};
      s.results[r.key] = {
        status: r.status,
        note: r.note ?? prev.note ?? '',
        source: r.source ?? 'manual',
        detail: r.detail ?? (r.source === 'auto' ? undefined : prev.detail),
        at: new Date().toISOString(),
      };
    }
    return writeSession(s);
  }

  function setMeta(meta) {
    const s = readSession();
    s.meta = { ...s.meta, ...meta };
    return writeSession(s);
  }

  /** Archive the current session (if it has results) and start a clean one. */
  function reset(meta) {
    const old = readSession();
    if (existsSync(currentFile) && Object.keys(old.results).length) {
      renameSync(currentFile, path.join(dir, `session-${old.id}.json`));
    }
    return writeSession(newSession({ ...old.meta, ...meta }));
  }

  function exportReport() {
    const groups = load();
    const s = readSession();
    const md = renderReport(groups, s);
    mkdirSync(dir, { recursive: true });
    const name = `core-retest-${s.id}.md`;
    writeFileSync(path.join(dir, name), md);
    return { path: `reports/core-retest/${name}`, markdown: md };
  }

  return { state, setResults, setMeta, reset, exportReport };
}

/* ── Markdown report ───────────────────────────────────────────────────── */

const ICON = { pass: '✅ PASS', fail: '❌ FAIL', blocked: '⛔ BLOCKED', skip: '⏭ Bỏ qua', todo: '⬜ Chưa test' };

export function renderReport(groups, s) {
  const all = groups.flatMap((g) => g.tcs);
  const st = (tc) => s.results[tc.key]?.status ?? 'todo';
  const count = (list, k) => list.filter((tc) => st(tc) === k).length;
  const m = s.meta;
  const lines = [
    `# Kết quả Core Retest — Volt POS`,
    '',
    `- **Build:** ${m.build || '—'} · **Môi trường:** ${m.env || '—'} · **Tiệm:** ${m.store || '—'} · **Người test:** ${m.tester || '—'}`,
    `- **Bắt đầu:** ${s.startedAt} · **Xuất báo cáo:** ${new Date().toISOString()}`,
    '',
    `**Tổng ${all.length} TC:** ✅ ${count(all, 'pass')} · ❌ ${count(all, 'fail')} · ⛔ ${count(all, 'blocked')} · ⏭ ${count(all, 'skip')} · ⬜ ${count(all, 'todo')}`,
    '',
    '| Nhóm | TC | ⭐ | ✅ | ❌ | ⛔ | ⏭ | ⬜ |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...groups.map(
      (g) =>
        `| ${g.num}. ${g.name} | ${g.tcs.length} | ${g.tcs.filter((t) => t.star).length} | ${count(g.tcs, 'pass')} | ${count(g.tcs, 'fail')} | ${count(g.tcs, 'blocked')} | ${count(g.tcs, 'skip')} | ${count(g.tcs, 'todo')} |`,
    ),
    '',
  ];
  const fails = all.filter((tc) => ['fail', 'blocked'].includes(st(tc)));
  if (fails.length) {
    lines.push('## ❌ FAIL / ⛔ BLOCKED', '');
    for (const tc of fails) {
      const r = s.results[tc.key];
      lines.push(`- ${ICON[r.status]} **${tc.raw}** · ${tc.label}${r.note ? ` — ${r.note}` : ''}`);
      if (r.detail) lines.push(`  - ${String(r.detail).split('\n')[0].slice(0, 300)}`);
    }
    lines.push('');
  }
  for (const g of groups) {
    lines.push(`## ${g.num}. ${g.name}`, '', '| TC | Nội dung | Cách test | Kết quả | Ghi chú |', '| --- | --- | --- | --- | --- |');
    for (const tc of g.tcs) {
      const r = s.results[tc.key];
      const how = r?.source === 'auto' ? '🤖 Tự động' : tc.auto?.length ? '🤖 (chưa chạy)' : '✋ Tay';
      const note = (r?.note || (r?.source === 'auto' ? r?.detail : '') || '').replace(/\|/g, '\\|').replace(/\n/g, ' ').slice(0, 200);
      lines.push(`| ${tc.star ? '⭐ ' : ''}${tc.raw} | ${tc.label.replace(/\|/g, '\\|')} | ${how} | ${ICON[st(tc)]} | ${note} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
