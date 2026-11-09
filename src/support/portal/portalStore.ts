import { join } from 'node:path';
import { browser } from '@wdio/globals';
import { gql } from '../../api/index.js';
import { returnToHome } from '../../flows/index.js';
import { PortalStoreSettingsCdp } from '../../pages/web/PortalStoreSettingsCdp.js';
import { moduleLogger } from '../../utils/logger.js';
import { PortalCdp } from './PortalCdp.js';
import {
  compensationGroupOf,
  resolveField,
  type PortalValue,
  type PosSnapshot,
} from './portalStoreFields.js';

const log = moduleLogger('portal-store');

/** How long POS may take to pull a Portal change into its local DB. */
const POS_SYNC_TIMEOUT = Number(process.env.PORTAL_POS_SYNC_TIMEOUT ?? 180_000);
/** Settings with no known POS mirror: give the sync loop this long, then go on. */
const UNMAPPED_SETTLE_MS = 20_000;

const SNAPSHOT = `
  query portalStoreSnapshot {
    merchantSettingList { cashDiscountPercentage serviceFeePercentage taxPercentage signatureSetting
      signatureTiming tipActive tipPaymentTypes tipTiming tipType }
    sysSettingList { key value }
  }
`;

interface SnapshotResponse {
  merchantSettingList: Array<Record<string, unknown>> | null;
  sysSettingList: Array<{ key: string; value: string | null }> | null;
}

/** What the till holds right now, flattened as `ms.<field>` / `sys.<key>` (JSON parsed). */
export async function posSettingsSnapshot(): Promise<PosSnapshot> {
  const data = await gql().query<SnapshotResponse>(SNAPSHOT, { operationName: 'portalStoreSnapshot' });
  const out: PosSnapshot = {};
  for (const [k, v] of Object.entries(data.merchantSettingList?.[0] ?? {})) out[`ms.${k}`] = v;
  for (const row of data.sysSettingList ?? []) {
    let v: unknown = row.value;
    try {
      v = row.value === null ? null : JSON.parse(row.value);
    } catch {
      /* plain string */
    }
    out[`sys.${row.key}`] = v;
  }
  return out;
}

export type PortalWant = Record<string, PortalValue>;

/**
 * Reload the till's webview and land on /home.
 *
 * POS writes a synced setting into its local DB at once, but the screens keep the
 * value they loaded (checkout kept computing tax at the OLD rate right after the
 * Portal changed it — verified 08/11/2026, PAY-083/099/101). A reload makes every
 * screen read the new value.
 */
export async function reloadPos(): Promise<void> {
  await browser.execute(() => {
    setTimeout(() => location.reload(), 0);
  });
  await browser.pause(1_500);
  await browser.waitUntil(
    async () =>
      browser
        .execute(() => document.readyState === 'complete' && !location.pathname.startsWith('/splash'))
        .catch(() => false),
    { timeout: 60_000, interval: 1_000, timeoutMsg: 'POS webview did not come back after reload' },
  );
  await returnToHome();
}

/**
 * "This test case runs under THESE store settings" — Portal driven in the same run.
 *
 * ```ts
 * const portal = new PortalStore(shotDir);
 * before(async function () { if (!(await portal.available())) this.skip(); });
 * after(() => portal.restore());
 *
 * it('SF 5% + tax 10%', async () => {
 *   await portal.ensure({ serviceFeePct: 5, productTaxPct: 10, serviceTaxPct: 10 });
 *   // … POS steps now run under those values …
 * });
 * it('tip only on card', async () => {
 *   await portal.ensure({ tipOnCash: false, tipTiming: 'before_payment' });
 * });
 * ```
 *
 * - {@link ensure} opens the Portal tab(s), changes only what differs, Saves,
 *   re-reads the Portal, then waits until **POS itself** reads every value that
 *   has a known POS mirror (see `portalStoreFields.ts`).
 * - The first time a key is touched its Portal value is remembered; {@link restore}
 *   (describe `after`) puts every touched key back and waits for POS again — even
 *   when the cases failed — so a run never leaves the merchant changed.
 * - Store-wide: tag the spec `Tag.EXCLUSIVE` so nothing else runs meanwhile.
 *
 * Names: see `PORTAL_FIELDS` — `serviceFeePct`, `cashDiscountPct`, `productTaxPct`,
 * `serviceTaxPct`, `applyServiceFeeToGiftCard`, `discountOwnerPct`/`discountStaffPct`,
 * `tipOnCash`…, `tipTiming`, `tipType`, `tipSplitMethod`, `signatureRequired`,
 * `checkoutType`, `pointRateCash`…, `earnOnTip`, `turnValue`, `passcode.refund`…,
 * `showPointsOnCustomerDisplay`, `defaultScreen`, `fontSize`, `compensationType`,
 * `commission.cashCheckSplit`, `salary.salarySetting`, …
 */
export class PortalStore {
  private cdp: PortalCdp | null = null;
  private page: PortalStoreSettingsCdp | null = null;
  private signedIn: boolean | null = null;
  private readonly original: PortalWant = {};

  constructor(
    private readonly shotDir?: string,
    /** keepOpen: leave the Portal Edge window running after restore() (shared session). */
    private readonly opts: { keepOpen?: boolean } = {},
  ) {}

  /** Open the Portal once; false when its session expired (`npm run portal:login`). */
  async available(): Promise<boolean> {
    if (this.signedIn !== null) return this.signedIn;
    try {
      this.cdp = await new PortalCdp().start();
      this.page = new PortalStoreSettingsCdp(this.cdp);
      this.signedIn = await this.page.open('payment-transactions');
    } catch (error) {
      log.warn(`Portal unavailable: ${(error as Error).message}`);
      this.signedIn = false;
    }
    return this.signedIn;
  }

  /** The Portal's current values for `keys` (`fresh` = reload the tab first). */
  async read(keys: string[], fresh = false): Promise<PortalWant> {
    return this.requirePage().read(keys, fresh);
  }

  /** Poll the Portal (reloading) until `want` shows — a change made on POS syncing UP. */
  async waitPortalShows(want: PortalWant, timeout = POS_SYNC_TIMEOUT): Promise<void> {
    const keys = Object.keys(want);
    let last: PortalWant = {};
    await browser.waitUntil(
      async () => {
        last = await this.read(keys, true);
        return keys.every((k) => String(last[k]) === String(want[k]));
      },
      {
        timeout,
        interval: 5_000,
        timeoutMsg: `Portal never showed ${JSON.stringify(want)} (last ${JSON.stringify(last)})`,
      },
    );
  }

  /** Make the Portal hold `want` and wait until POS runs under it. */
  async ensure(want: PortalWant, shotName?: string): Promise<PortalWant> {
    if (!(await this.available()))
      throw new Error(
        'Portal session missing/expired in .portal-profile/ — run `npm run portal:login` (QR once).',
      );
    const page = this.requirePage();

    // Touching a compensation field switches the default type (its sub-tab): remember it too.
    const keys = Object.keys(want);
    if (keys.some((k) => compensationGroupOf(k)) && !('compensationType' in this.original))
      keys.push('compensationType');
    const fresh = keys.filter((k) => !(k in this.original));
    if (fresh.length) Object.assign(this.original, await page.read(fresh));

    const after = await page.set(want);
    log.info(`Portal ← ${JSON.stringify(want)}`);
    if (shotName && this.shotDir && this.cdp) {
      await page.scrollTo(Object.keys(want)[0] as string);
      await this.cdp.screenshot(join(this.shotDir, `${shotName}.png`));
    }
    await this.waitPos(want);
    if (page.lastSaved) await reloadPos();
    return after;
  }

  /** Close the Portal window WITHOUT putting anything back (the change is the new baseline). */
  async close(): Promise<void> {
    if (!this.opts.keepOpen) await this.cdp?.stop().catch(() => undefined);
    this.cdp = null;
    this.page = null;
    this.signedIn = null;
    for (const k of Object.keys(this.original)) delete this.original[k];
  }

  /** Put every touched key back, wait for POS, close Edge. */
  async restore(): Promise<void> {
    try {
      if (this.page && Object.keys(this.original).length) {
        const back = { ...this.original };
        await this.page.set(back);
        await this.waitPos(back).catch((e: Error) => log.warn(`restore: ${e.message}`));
        if (this.page.lastSaved)
          await reloadPos().catch((e: Error) => log.warn(`restore reload: ${e.message}`));
        log.info(`Portal restored → ${JSON.stringify(back)}`);
      }
    } finally {
      if (!this.opts.keepOpen) await this.cdp?.stop().catch(() => undefined);
      this.cdp = null;
      this.page = null;
      this.signedIn = null;
      for (const k of Object.keys(this.original)) delete this.original[k];
    }
  }

  private requirePage(): PortalStoreSettingsCdp {
    if (!this.page) throw new Error('PortalStore: call available() first');
    return this.page;
  }

  /** Until POS reads each mapped value; unmapped keys get a fixed settle beat. */
  private async waitPos(want: PortalWant): Promise<void> {
    const mapped = Object.entries(want)
      .map(([k, v]) => ({ spec: resolveField(k), v }))
      .filter(({ spec }) => spec.pos);
    const unmapped = Object.keys(want).length - mapped.length;
    let last = '';
    if (mapped.length) {
      await browser.waitUntil(
        async () => {
          const snap = await posSettingsSnapshot();
          const off = mapped.filter(({ spec, v }) => {
            const expect = spec.toPos ? spec.toPos(v) : v;
            const got = spec.pos?.(snap);
            return typeof expect === 'number' ? Math.abs(Number(got) - expect) > 1e-6 : got !== expect;
          });
          last = off.map(({ spec }) => `${spec.key}=${JSON.stringify(spec.pos?.(snap))}`).join(', ');
          return off.length === 0;
        },
        {
          timeout: POS_SYNC_TIMEOUT,
          interval: 3_000,
          timeoutMsg: `POS never read ${JSON.stringify(want)} from the Portal (still: ${last})`,
        },
      );
    }
    if (unmapped) await browser.pause(UNMAPPED_SETTLE_MS);
  }
}
