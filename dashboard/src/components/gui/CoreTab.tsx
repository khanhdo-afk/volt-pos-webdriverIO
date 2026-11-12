import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CoreAutoTest,
  CoreGroup,
  CoreResultInput,
  CoreSession,
  CoreStatus,
  CoreTc,
  GuiRunner,
  LiveResult,
} from '../../lib/gui';
import { coreApi, usePersisted } from '../../lib/gui';

/** Runs started from this tab carry this label prefix, so their results are written back. */
export const CORE_LABEL = '✅ Core Retest';

type Scope = 'star' | 'all';
type Kind = 'all' | 'auto' | 'manual';
type StatusFilter = 'all' | 'todo' | 'bad';

const STATUS_TEXT: Record<CoreStatus, string> = {
  pass: 'PASS',
  fail: 'FAIL',
  blocked: 'BLOCKED',
  skip: 'Bỏ qua',
  todo: 'Chưa test',
};

const cleanTitle = (t: string): string => t.replace(/(\s+@[a-z][\w-]*)+\s*$/i, '').trim();

/** Catalogue titles keep `${…}` from template literals: match those parts loosely. */
function titleMatcher(title: string): (live: string) => boolean {
  if (!title.includes('${')) return (live) => live === title;
  const re = new RegExp(
    `^${title
      .split(/\$\{[^}]*\}/)
      .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*')}$`,
  );
  return (live) => re.test(live);
}

/** Latest live result of one automated test (last attempt wins). */
function liveOf(t: CoreAutoTest, results: LiveResult[]): LiveResult | undefined {
  const match = titleMatcher(t.title);
  let best: LiveResult | undefined;
  for (const r of results) {
    if (r.file !== t.spec || r.hook || !match(cleanTitle(r.title))) continue;
    if (!best || r.attempt >= best.attempt) best = r;
  }
  return best;
}

/** Result of a test case from the live run, or null when none of its tests ran. */
function autoVerdict(tc: CoreTc, results: LiveResult[]): CoreResultInput | null {
  const lives = tc.auto.map((t) => ({ t, r: liveOf(t, results) })).filter((x) => x.r);
  if (!lives.length) return null;
  const failed = lives.filter((x) => x.r!.state === 'failed');
  const passed = lives.filter((x) => x.r!.state === 'passed');
  const notRun = tc.auto.length - lives.length;
  const partial = tc.missing.length ? `Chưa tự động: ${tc.missing.join(', ')} — cần test tay phần này.` : '';
  if (failed.length) {
    return {
      key: tc.key,
      status: 'fail',
      source: 'auto',
      detail: failed
        .map((x) => `${x.t.spec.split('/').pop()} › ${cleanTitle(x.r!.title)}: ${(x.r!.error ?? '').split('\n')[0]}`)
        .join('\n'),
    };
  }
  if (passed.length === tc.auto.length) {
    return { key: tc.key, status: 'pass', source: 'auto', detail: partial || undefined };
  }
  const why = lives
    .filter((x) => x.r!.state === 'skipped')
    .map((x) => x.r!.skip?.text ?? 'skipped')
    .join('; ');
  return {
    key: tc.key,
    status: 'skip',
    source: 'auto',
    detail: `Test tự động bị bỏ qua${notRun ? ` (${notRun} test chưa chạy)` : ''}: ${why}`.slice(0, 400),
  };
}

/** Minimal, escaped markdown for the checklist bodies (bold, code, links, lists, quotes). */
function inlineMd(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="core-link" title="$2">$1</span>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>');
}

function MdBody({ md }: { md: string }): JSX.Element {
  const html = md
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => {
      if (/^\s+\d+\.\s/.test(l)) return `<div class="md-li num">${inlineMd(l.trim())}</div>`;
      if (/^\s+-\s/.test(l)) return `<div class="md-li">• ${inlineMd(l.trim().slice(2))}</div>`;
      if (l.startsWith('> ')) return `<div class="md-quote">${inlineMd(l.slice(2))}</div>`;
      if (l.startsWith('- ')) return `<div class="md-row">${inlineMd(l.slice(2))}</div>`;
      return `<div class="md-p">${inlineMd(l)}</div>`;
    })
    .join('');
  return <div className="core-md" dangerouslySetInnerHTML={{ __html: html }} />;
}

interface Props {
  runner: GuiRunner;
  env: string;
  disabled: boolean;
  onRun: (req: { specs: string[]; titles: string[]; label: string }) => void;
}

export function CoreTab({ runner, env, disabled, onRun }: Props): JSX.Element {
  const [groups, setGroups] = useState<CoreGroup[]>([]);
  const [session, setSession] = useState<CoreSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = usePersisted<Scope>('core-scope', 'star');
  const [kind, setKind] = usePersisted<Kind>('core-kind', 'all');
  const [statusFilter, setStatusFilter] = usePersisted<StatusFilter>('core-status', 'all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [closedGroups, setClosedGroups] = usePersisted<number[]>('core-closed', []);
  const [exported, setExported] = useState<{ path: string; markdown: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const s = await coreApi.state();
      setGroups(s.groups);
      setSession(s.session);
      setError(null);
    } catch (e) {
      setError(String((e as Error).message ?? e));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const { run, running, results } = runner;
  const isCoreRun = !!run?.label.startsWith(CORE_LABEL);
  const allTcs = useMemo(() => groups.flatMap((g) => g.tcs), [groups]);

  /* Live verdicts of a Core run in progress — shown before they are saved. */
  const live = useMemo(() => {
    const m = new Map<string, CoreResultInput>();
    if (!isCoreRun) return m;
    for (const tc of allTcs) {
      if (!tc.auto.length) continue;
      const v = autoVerdict(tc, results);
      if (v) m.set(tc.key, v);
    }
    return m;
  }, [isCoreRun, allTcs, results]);

  /* Write the verdicts back once a Core run ends (once per run id). */
  const saved = useRef<string | null>(null);
  useEffect(() => {
    if (!run || running || !isCoreRun || saved.current === run.id || !live.size) return;
    saved.current = run.id;
    void coreApi
      .results([...live.values()])
      .then((r) => setSession(r.session))
      .catch((e) => setError(String(e)));
  }, [run, running, isCoreRun, live]);

  const statusOf = (tc: CoreTc): CoreStatus =>
    (running && live.get(tc.key)?.status) || session?.results[tc.key]?.status || 'todo';

  const visible = (tc: CoreTc): boolean => {
    if (scope === 'star' && !tc.star) return false;
    if (kind === 'auto' && !tc.auto.length) return false;
    if (kind === 'manual' && tc.auto.length) return false;
    const st = statusOf(tc);
    if (statusFilter === 'todo' && st !== 'todo') return false;
    if (statusFilter === 'bad' && !['fail', 'blocked'].includes(st)) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!`${tc.raw} ${tc.label} ${tc.body}`.toLowerCase().includes(q)) return false;
    }
    return true;
  };

  const scoped = allTcs.filter((tc) => scope === 'all' || tc.star);
  const tally = (list: CoreTc[]) => {
    const t = { pass: 0, fail: 0, blocked: 0, skip: 0, todo: 0 } as Record<CoreStatus, number>;
    for (const tc of list) t[statusOf(tc)] += 1;
    return t;
  };
  const total = tally(scoped);
  const done = scoped.length - total.todo;
  const autoCount = scoped.filter((tc) => tc.auto.length).length;

  const setResult = async (tc: CoreTc, status: CoreStatus, note?: string): Promise<void> => {
    try {
      const r = await coreApi.results([{ key: tc.key, status, note, source: 'manual' }]);
      setSession(r.session);
    } catch (e) {
      setError(String(e));
    }
  };

  const saveNote = async (tc: CoreTc, note: string): Promise<void> => {
    const cur = session?.results[tc.key];
    // A note belongs to a result: pick PASS / FAIL / BLOCKED first (the note is sent with it).
    if (!cur || cur.note === note) return;
    const r = await coreApi.results([{ key: tc.key, status: cur.status, note, source: cur.source, detail: cur.detail }]);
    setSession(r.session);
  };

  const runTcs = (tcs: CoreTc[], what: string): void => {
    const auto = tcs.filter((tc) => tc.auto.length);
    if (!auto.length) return;
    const tests = auto.flatMap((tc) => tc.auto);
    const specs = [...new Set(tests.map((t) => t.spec))];
    // A template title (`${…}`) cannot be grepped literally: grep its fixed prefix.
    const titles = [...new Set(tests.map((t) => (t.title.split('${')[0] ?? '').trim()).filter(Boolean))];
    onRun({ specs, titles, label: `${CORE_LABEL} · ${what} · ${auto.length} TC` });
  };

  const saveMeta = async (k: keyof CoreSession['meta'], v: string): Promise<void> => {
    if (!session || session.meta[k] === v) return;
    const r = await coreApi.meta({ [k]: v });
    setSession(r.session);
  };

  const newSession = async (): Promise<void> => {
    if (!window.confirm('Bắt đầu phiên re-test mới? Phiên hiện tại được lưu lại (reports/core-retest/session-*.json).'))
      return;
    const r = await coreApi.reset({ env });
    setSession(r.session);
    setExported(null);
  };

  const doExport = async (): Promise<void> => {
    try {
      setExported(await coreApi.exportReport());
    } catch (e) {
      setError(String(e));
    }
  };

  const toggleOpen = (key: string): void =>
    setOpen((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  const closed = new Set(closedGroups);
  const toggleGroup = (num: number): void =>
    setClosedGroups((prev) => (prev.includes(num) ? prev.filter((x) => x !== num) : [...prev, num]));

  const visibleTcs = allTcs.filter(visible);
  const pct = (n: number): string => `${scoped.length ? (n / scoped.length) * 100 : 0}%`;

  return (
    <div className="core">
      {error && (
        <div className="banner bad">
          {error}
          <button className="btn sm" onClick={() => setError(null)}>
            ✕
          </button>
        </div>
      )}

      <section className="core-head">
        <div className="core-title">
          <h2>Core Retest</h2>
          <p className="muted">
            Bộ TC chính cho mỗi lần có build mới — đọc từ <code>docs/qc/core-retest-checklist.md</code>. TC 🤖 có test
            tự động thì bấm Chạy; TC ✋ test tay rồi tick kết quả.
          </p>
        </div>
        {session && (
          <div className="core-meta">
            {(
              [
                ['build', 'Build', 'vd 1.1.115'],
                ['env', 'Môi trường', 'dev / staging / prod'],
                ['store', 'Tiệm', 'vd 14'],
                ['tester', 'Người test', ''],
              ] as const
            ).map(([k, label, ph]) => (
              <label key={`${session.id}-${k}`}>
                <span>{label}</span>
                <input
                  defaultValue={session.meta[k]}
                  placeholder={ph}
                  onBlur={(e) => void saveMeta(k, e.target.value.trim())}
                />
              </label>
            ))}
            <div className="core-meta-actions">
              <button className="btn sm" onClick={() => void newSession()} disabled={running}>
                ＋ Phiên mới
              </button>
              <button className="btn sm" onClick={() => void doExport()}>
                ⤓ Xuất báo cáo .md
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="core-kpis">
        <div className="core-kpi big">
          <b>
            {done}/{scoped.length}
          </b>
          <span>đã test ({scope === 'star' ? '⭐ smoke' : 'tất cả'})</span>
        </div>
        <div className="core-kpi ok">
          <b>{total.pass}</b>
          <span>PASS</span>
        </div>
        <div className="core-kpi bad">
          <b>{total.fail}</b>
          <span>FAIL</span>
        </div>
        <div className="core-kpi warn">
          <b>{total.blocked}</b>
          <span>BLOCKED</span>
        </div>
        <div className="core-kpi">
          <b>{total.skip}</b>
          <span>Bỏ qua</span>
        </div>
        <div className="core-kpi">
          <b>{total.todo}</b>
          <span>Chưa test</span>
        </div>
        <div className="core-kpi">
          <b>
            {autoCount}/{scoped.length}
          </b>
          <span>🤖 có test tự động</span>
        </div>
        <div className="core-bar" title="PASS · FAIL · BLOCKED · Bỏ qua">
          <i className="ok" style={{ width: pct(total.pass) }} />
          <i className="bad" style={{ width: pct(total.fail) }} />
          <i className="warn" style={{ width: pct(total.blocked) }} />
          <i className="skip" style={{ width: pct(total.skip) }} />
        </div>
      </section>

      {exported && (
        <div className="banner warn core-export">
          <span>
            Đã xuất <code>{exported.path}</code>
          </span>
          <span>
            <button className="btn sm" onClick={() => void navigator.clipboard?.writeText(exported.markdown)}>
              Copy markdown
            </button>{' '}
            <button className="btn sm" onClick={() => setExported(null)}>
              ✕
            </button>
          </span>
        </div>
      )}

      <section className="core-toolbar">
        <div className="seg-group">
          {(
            [
              ['star', '⭐ Smoke'],
              ['all', 'Tất cả'],
            ] as const
          ).map(([k, l]) => (
            <button key={k} className={`chip ${scope === k ? 'on' : ''}`} onClick={() => setScope(k)}>
              {l}
            </button>
          ))}
        </div>
        <div className="seg-group">
          {(
            [
              ['all', 'Mọi cách test'],
              ['auto', '🤖 Tự động'],
              ['manual', '✋ Tay'],
            ] as const
          ).map(([k, l]) => (
            <button key={k} className={`chip ${kind === k ? 'on' : ''}`} onClick={() => setKind(k)}>
              {l}
            </button>
          ))}
        </div>
        <div className="seg-group">
          {(
            [
              ['all', 'Mọi kết quả'],
              ['todo', 'Chưa test'],
              ['bad', 'FAIL / BLOCKED'],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              className={`chip ${statusFilter === k ? 'on' : ''} ${k === 'bad' ? 'bad' : ''}`}
              onClick={() => setStatusFilter(k)}
            >
              {l}
            </button>
          ))}
        </div>
        <input
          className="core-search"
          placeholder="Tìm mã TC, nội dung…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="spacer" />
        <button
          className="btn primary"
          disabled={disabled || !visibleTcs.some((tc) => tc.auto.length)}
          onClick={() => runTcs(visibleTcs, scope === 'star' ? '⭐ smoke' : 'đang lọc')}
          title="Chạy các test tự động của những TC đang hiện"
        >
          ▶ Chạy tự động ({visibleTcs.filter((tc) => tc.auto.length).length} TC ·{' '}
          {visibleTcs.reduce((n, tc) => n + tc.auto.length, 0)} test)
        </button>
      </section>

      {groups.map((g) => {
        const tcs = g.tcs.filter(visible);
        if (!tcs.length) return null;
        const t = tally(g.tcs.filter((tc) => scope === 'all' || tc.star));
        const isClosed = closed.has(g.num);
        return (
          <section key={g.num} className="core-group">
            <header className="core-group-head" onClick={() => toggleGroup(g.num)}>
              <span className="caret">{isClosed ? '▸' : '▾'}</span>
              <b>
                {g.num}. {g.name}
              </b>
              <span className="core-counts">
                {t.pass > 0 && <span className="c-ok">✓{t.pass}</span>}
                {t.fail > 0 && <span className="c-bad">✗{t.fail}</span>}
                {t.blocked > 0 && <span className="c-warn">⛔{t.blocked}</span>}
                <span className="muted">
                  {tcs.length} TC · 🤖 {tcs.filter((tc) => tc.auto.length).length}
                </span>
              </span>
              <span className="spacer" />
              <button
                className="btn sm"
                disabled={disabled || !tcs.some((tc) => tc.auto.length)}
                onClick={(e) => {
                  e.stopPropagation();
                  runTcs(tcs, `nhóm ${g.num}`);
                }}
              >
                ▶ Chạy nhóm
              </button>
            </header>
            {!isClosed && g.note && (
              <div className="core-note">
                <MdBody md={g.note} />
              </div>
            )}
            {!isClosed &&
              tcs.map((tc) => {
                const st = statusOf(tc);
                const r = session?.results[tc.key];
                const lv = live.get(tc.key);
                const isOpen = open.has(tc.key);
                return (
                  <div key={tc.key} className={`core-tc st-${st}`}>
                    <div className="core-tc-row" onClick={() => toggleOpen(tc.key)}>
                      <span className={`core-pill st-${st}`}>{STATUS_TEXT[st]}</span>
                      <span className="core-id">
                        {tc.star && '⭐ '}
                        {tc.raw}
                      </span>
                      <span className="core-label">{tc.label}</span>
                      <span className={`core-kind ${tc.auto.length ? 'auto' : 'manual'}`}>
                        {tc.auto.length ? `🤖 ${tc.auto.length} test` : '✋ Tay'}
                      </span>
                      {r?.note && <span className="core-hasnote" title={r.note}>📝</span>}
                    </div>
                    {isOpen && (
                      <div className="core-tc-body">
                        <MdBody md={tc.body} />
                        {tc.auto.length > 0 && (
                          <div className="core-auto">
                            <div className="core-sub">Test tự động</div>
                            {tc.auto.map((t) => {
                              const lr = liveOf(t, results);
                              return (
                                <div key={`${t.spec}::${t.title}`} className="core-auto-row">
                                  <i className={`tdot ${lr ? (lr.flaky ? 'flaky' : lr.state) : ''}`} />
                                  <code>{t.spec.replace(/^tests\//, '')}</code> › {t.title}
                                </div>
                              );
                            })}
                            {tc.missing.length > 0 && (
                              <div className="muted small">
                                Chưa tự động: {tc.missing.join(', ')} — test tay phần này.
                              </div>
                            )}
                            <button
                              className="btn sm"
                              disabled={disabled}
                              onClick={() => runTcs([tc], tc.raw)}
                            >
                              ▶ Chạy TC này
                            </button>
                          </div>
                        )}
                        {(lv?.detail || r?.detail) && (
                          <pre className="core-detail">{lv?.detail ?? r?.detail}</pre>
                        )}
                        <div className="core-actions">
                          {(['pass', 'fail', 'blocked', 'skip'] as const).map((s) => (
                            <button
                              key={s}
                              className={`btn sm core-set st-${s} ${st === s ? 'on' : ''}`}
                              onClick={(e) => {
                                const input = (e.currentTarget.parentElement?.querySelector(
                                  '.core-note-input',
                                ) as HTMLInputElement | null)?.value.trim();
                                void setResult(tc, st === s ? 'todo' : s, input ?? r?.note);
                              }}
                            >
                              {STATUS_TEXT[s]}
                            </button>
                          ))}
                          <input
                            key={`${session?.id}-${tc.key}-${r?.at ?? ''}`}
                            className="core-note-input"
                            placeholder="Ghi chú: mã bug VP-xxxx, lý do BLOCKED…"
                            defaultValue={r?.note ?? ''}
                            onBlur={(e) => void saveNote(tc, e.target.value.trim())}
                          />
                          {r && (
                            <span className="muted small">
                              {r.source === 'auto' ? '🤖' : '✋'} {new Date(r.at).toLocaleString('vi-VN')}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </section>
        );
      })}
      {!groups.length && !error && <div className="muted pad">Đang đọc checklist…</div>}
    </div>
  );
}
