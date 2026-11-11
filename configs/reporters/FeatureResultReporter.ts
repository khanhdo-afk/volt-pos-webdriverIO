/**
 * Profile-lane result reporter (staging / production feature runs).
 *
 * Every worker appends its TCs to reports/<target>/runs/<FEATURE_RUN_ID>/<cid>.json,
 * so the summary (scripts/production-summary.ts) sees the WHOLE run — not just the
 * last worker, which is what latest.json holds when specs run one worker each.
 */
import fs from 'node:fs';
import path from 'node:path';
import WDIOReporter, { type RunnerStats, type TestStats } from '@wdio/reporter';
import { Paths } from '../constants/paths.js';

export interface FeatureResult {
  file: string;
  suite: string;
  title: string;
  state: 'passed' | 'failed' | 'skipped';
  error: string;
  /** Reason printed by itNeeds() / data checks ("[SKIP] title — reason"). */
  reason: string;
  ms: number;
}

export const runDir = (target: string, runId: string): string =>
  path.join(Paths.REPORTS, target, 'runs', runId);

export default class FeatureResultReporter extends WDIOReporter {
  private results: FeatureResult[] = [];
  private file = '';

  constructor(options: Record<string, unknown>) {
    super({ ...options, stdout: false });
  }

  override onRunnerStart(runner: RunnerStats): void {
    this.file = (runner.specs[0] ?? '').replace(/^file:\/\/\//, '');
  }

  private push(t: TestStats, state: FeatureResult['state']): void {
    const err = t.error?.message ?? '';
    this.results.push({
      file: this.file,
      suite: t.parent,
      title: t.title,
      state,
      error: err.split('\n').slice(0, 6).join('\n'),
      reason:
        state === 'skipped'
          ? ((globalThis as unknown as { __featureSkip?: Record<string, string> }).__featureSkip?.[t.title] ??
            '')
          : '',
      ms: t._duration,
    });
  }

  override onTestPass(t: TestStats): void {
    this.push(t, 'passed');
  }
  override onTestFail(t: TestStats): void {
    this.push(t, 'failed');
  }
  override onTestSkip(t: TestStats): void {
    this.push(t, 'skipped');
  }

  override onRunnerEnd(runner: RunnerStats): void {
    const target = process.env.TARGET ?? 'unknown';
    const runId = process.env.FEATURE_RUN_ID ?? 'adhoc';
    const dir = runDir(target, runId);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, `${runner.cid}.json`),
      JSON.stringify({ store: process.env.STORE_ID ?? '', file: this.file, results: this.results }, null, 2),
    );
  }
}
