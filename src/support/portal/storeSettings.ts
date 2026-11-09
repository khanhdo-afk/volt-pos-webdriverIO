import { moduleLogger } from '../../utils/logger.js';
import { PortalStore, posSettingsSnapshot, type PortalWant } from './portalStore.js';
import { resolveField } from './portalStoreFields.js';

const log = moduleLogger('store-settings');

/**
 * "This test case needs the store set up like THIS" — for ANY spec, one call.
 *
 * ```ts
 * await requireStore({ tipActive: true, tipOnCash: true });   // in a test or a before()
 * await requireStore({ 'passcode.orderHistory': true });
 * if (!(await requireStore({ serviceFeePct: 3, cashDiscountPct: 3 }))) this.skip();
 * ```
 *
 * - When the till ALREADY runs under `want` (read off POS, no browser), it returns
 *   at once — most runs never open the Portal.
 * - Otherwise the Portal is opened (Edge on `.portal-profile/`, CDP), changed,
 *   saved, POS waited on and reloaded ({@link PortalStore.ensure}).
 * - Whatever was changed is put back by the root `afterAll` (tests/setup/rootHooks.ts,
 *   once per spec file, also between grouped ⚡ files) via {@link restoreStore}.
 *
 * Returns false when the Portal cannot be used (profile signed out, `PORTAL_AUTO=0`,
 * prod run): the caller then keeps its old behaviour (usually `this.skip()`).
 */
export async function requireStore(want: PortalWant): Promise<boolean> {
  if (await posAlreadyHas(want)) return true;
  if (!portalAllowed()) return false;
  session ??= new PortalStore(undefined, { keepOpen: true });
  if (!(await session.available())) {
    log.warn('Portal unavailable (run `npm run portal:login`) — store settings left as they are');
    return false;
  }
  await session.ensure(want);
  return true;
}

/**
 * The store-14 settings every payment spec is written against: tips on for every
 * tender, Service Fee 3 % / Cash Discount 3 %, tax 5 % / 5 %. Checked (one POS read)
 * before EVERY spec file; when something drifted (a crashed restore, a manual edit,
 * another session) it is put back through the Portal BEFORE anything is charged —
 * and NOT undone afterwards (this is the baseline, not a per-test change).
 */
export const STORE_BASELINE: PortalWant = {
  tipActive: true,
  tipOnCard: true,
  tipOnCash: true,
  tipOnGiftCard: true,
  tipOnOther: true,
  serviceFeePct: 3,
  cashDiscountPct: 3,
  serviceTaxPct: 5,
  productTaxPct: 5,
};

export async function ensureStoreBaseline(): Promise<boolean> {
  if (process.env.STORE_BASELINE === '0') return true;
  if (await posAlreadyHas(STORE_BASELINE)) return true;
  if (!portalAllowed()) return false;
  const s = new PortalStore(undefined, { keepOpen: false });
  if (!(await s.available())) {
    log.warn('store baseline drifted but the Portal is unavailable (npm run portal:auth)');
    return false;
  }
  log.info('store baseline drifted — putting tip / fee / tax back through the Portal');
  try {
    await s.ensure(STORE_BASELINE);
  } finally {
    await s.close();
  }
  return true;
}

/** Put back every store setting changed through {@link requireStore} in this spec file. */
export async function restoreStore(): Promise<void> {
  const s = session;
  session = null;
  if (s) await s.restore().catch((e: Error) => log.warn(`restore failed: ${e.message}`));
}

let session: PortalStore | null = null;

function portalAllowed(): boolean {
  if (process.env.PORTAL_AUTO === '0') return false;
  const env = (process.env.ENV ?? 'dev').toLowerCase();
  return env !== 'prod' && env !== 'production';
}

/** True when every key of `want` has a POS mirror and POS already holds the value. */
async function posAlreadyHas(want: PortalWant): Promise<boolean> {
  const specs = Object.entries(want).map(([k, v]) => ({ spec: resolveField(k), v }));
  if (specs.some(({ spec }) => !spec.pos)) return false;
  try {
    const snap = await posSettingsSnapshot();
    return specs.every(({ spec, v }) => {
      const expect = spec.toPos ? spec.toPos(v) : v;
      const got = spec.pos?.(snap);
      return typeof expect === 'number' ? Math.abs(Number(got) - expect) < 1e-6 : got === expect;
    });
  } catch {
    return false;
  }
}

/** POS route → the Portal passcode switch that gates it. */
export const GATE_KEY_BY_ROUTE: Record<string, string> = {
  '/order-history': 'passcode.orderHistory',
  '/incomes/income-summary': 'passcode.summaryIncome',
  '/incomes/income-daily': 'passcode.dailyIncome',
  '/incomes/income-staff': 'passcode.staffIncome',
  '/incomes/staff-payroll': 'passcode.staffPayroll',
  '/batch-history': 'passcode.batchHistory',
  '/time-tracking': 'passcode.timeTracking',
  '/settings': 'passcode.settingsPage',
};

/** Turn the passcode gate of `route` ON (Portal) when it is off. False = unknown route / no Portal. */
export async function requireGate(route: string): Promise<boolean> {
  const base = Object.keys(GATE_KEY_BY_ROUTE).find(
    (r) => route === r || route.startsWith(`${r}/`) || route.startsWith(`${r}?`),
  );
  const key = base ? GATE_KEY_BY_ROUTE[base] : undefined;
  if (!key) return false;
  return requireStore({ [key]: true });
}

/** Every payment method may take a tip, tips are on, percent presets, after-payment timing. */
export const TIP_FULL: PortalWant = {
  tipActive: true,
  tipOnCard: true,
  tipOnCash: true,
  tipOnGiftCard: true,
  tipOnOther: true,
};

/** A Service Fee / Cash Discount pair, so Card ≠ Cash (the store-14 baseline). */
export const FEE_ON: PortalWant = { serviceFeePct: 3, cashDiscountPct: 3 };

/** Tax on services and products (the store-14 baseline). */
export const TAX_ON: PortalWant = { serviceTaxPct: 5, productTaxPct: 5 };
