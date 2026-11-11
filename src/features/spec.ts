/**
 * Spec helpers shared by both environments.
 *
 * `itNeeds(['card'], title, fn)` declares what a TC needs; when the active
 * profile/run does not allow it, the TC is reported SKIPPED with the reason
 * (e.g. "PENDING Card — production charges real money…"), never as a pass.
 */
import type { StoreData } from '../../configs/profiles/index.js';
import { missingData } from './discover.js';
import { type Capability, deniedReason } from './policy.js';

/**
 * `needs` = store-data fields the TC uses. They are checked when the TC RUNS
 * (data is discovered in the root before-all), so a store without e.g. a $25
 * service or a test customer reports SKIP with the reason instead of failing.
 * TCs that create orders need at least staffA + cheap by default.
 */
/** Skip reasons by TC title — read by configs/reporters/FeatureResultReporter.ts. */
const skipReasons = ((globalThis as unknown as { __featureSkip?: Record<string, string> }).__featureSkip ??=
  {});
export function noteSkip(title: string, reason: string): void {
  skipReasons[title] = reason;
  console.log(`[SKIP] ${title} — ${reason}`);
}

export function itNeeds(
  caps: Capability[],
  title: string,
  fn: (this: Mocha.Context) => Promise<void>,
  needs: (keyof StoreData)[] = caps.includes('writes') ? ['staffA', 'cheap'] : [],
): void {
  const reason = caps.map(deniedReason).find((r) => r !== '') ?? '';
  const label = caps.includes('card') ? `[CARD] ${title}` : title;
  if (!reason) {
    it(label, async function (this: Mocha.Context) {
      const miss = missingData(needs);
      if (miss) {
        noteSkip(label, miss);
        this.skip();
      }
      await fn.call(this);
    });
    return;
  }
  it(label, function (this: Mocha.Context) {
    noteSkip(label, reason);
    this.skip();
  });
}

/** Card TC shorthand. */
export const cardIt = (
  title: string,
  fn: (this: Mocha.Context) => Promise<void>,
  needs?: (keyof StoreData)[],
): void => itNeeds(['card', 'writes'], title, fn, needs);

/** Run `body`, always running `cleanup` after (cleanup errors are logged, not thrown). */
export async function withCleanup<T>(body: () => Promise<T>, cleanup: () => Promise<void>): Promise<T> {
  try {
    return await body();
  } finally {
    await cleanup().catch((e: unknown) => console.warn(`[cleanup] ${(e as Error).message}`));
  }
}
