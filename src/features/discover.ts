/**
 * Store discovery — makes every feature spec run on ANY store (20258, 2949, …)
 * without hard-coded names. At the start of each worker the profile's StoreData
 * is completed IN PLACE from the signed-in app:
 *
 *   staffA / staffB   first two staff tiles on Home
 *   cheap…cheap3      the three cheapest priced services on Home's service grid
 *   svc25 / svc25b    two services priced exactly $25.00 (else the two closest ≥ $20)
 *   customer(2)       two customers whose name matches TEST_CUSTOMER_PATTERN
 *                     (default /^(checkin|qc|test)\b/i) — real customers are never picked
 *   giftCardActive    an active gift card with a balance (only ever read / cancelled)
 *   giftCardLow       NEVER discovered — consuming a balance needs an explicit card
 *
 * Fields already set in configs/profiles/<target>.<store>.json win. Anything that
 * cannot be found stays '' and the TCs needing it SKIP with the reason.
 * The result is cached per run in .tmp/store-data-<target>-<store>.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Paths } from '../../configs/constants/paths.js';
import type { StoreData } from '../../configs/profiles/index.js';
import { profile } from './policy.js';
import { go, gql, mainText } from './pos.js';

const cacheFile = (): string => {
  const p = profile();
  return path.join(Paths.ROOT, '.tmp', `store-data-${p.target}-${p.store}.json`);
};

/** Signed-in store id + name, from the app's own merchant settings. */
export async function signedInStore(): Promise<{ id: string; name: string }> {
  const d = await gql<{ merchantSettingList: { id: number | string; businessName: string | null }[] }>(
    'query{ merchantSettingList{ id businessName } }',
  );
  const m = d.merchantSettingList[0];
  return { id: String(m?.id ?? ''), name: m?.businessName ?? '' };
}

/** "Name\n$1.23" pairs of Home's service grid, in screen order. */
export function parseServiceGrid(text: string): { name: string; cents: number }[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const out: { name: string; cents: number }[] = [];
  for (let i = 0; i + 1 < lines.length; i++) {
    const price = lines[i + 1]?.match(/^\$([\d,]+\.\d{2})$/);
    const name = lines[i] ?? '';
    if (price?.[1] && !/^\$/.test(name) && !/^\d+ (Services|Products)$/.test(name)) {
      out.push({ name, cents: Math.round(Number(price[1].replace(/,/g, '')) * 100) });
    }
  }
  return out;
}

async function discoverFromApp(): Promise<Partial<StoreData>> {
  const found: Partial<StoreData> = {};
  await go('/home', 2500);

  const { browser } = await import('@wdio/globals');
  const staff = await browser.execute(() =>
    [...document.querySelectorAll('[data-testid^="staff-tile-"]')]
      .map((e) => (e as HTMLElement).innerText.split('\n')[0]?.trim() ?? '')
      .filter(Boolean),
  );
  [found.staffA, found.staffB] = [staff[0] ?? '', staff[1] ?? staff[0] ?? ''];

  const grid = parseServiceGrid(await mainText()).filter((s) => !staff.includes(s.name));
  const priced = grid.filter((s) => s.cents > 0).sort((a, b) => a.cents - b.cents);
  // cheap / cheap2 must be splittable into two checks (>= 2 cents); a 1-cent service goes to cheap3.
  const even = priced.filter((s) => s.cents >= 2);
  const ordered = [...even.slice(0, 2), ...priced.filter((s) => s.cents < 2), ...even.slice(2)];
  [found.cheap, found.cheap2, found.cheap3] = [
    ordered[0]?.name ?? '',
    ordered[1]?.name ?? '',
    ordered[2]?.name ?? '',
  ];
  found.prices = Object.fromEntries(grid.map((s) => [s.name, s.cents]));
  const exact25 = grid.filter((s) => s.cents === 2500).map((s) => s.name);
  const near = priced.filter((s) => s.cents >= 2000).map((s) => s.name);
  const pick25 = [...new Set([...exact25, ...near])];
  [found.svc25, found.svc25b] = [pick25[0] ?? '', pick25[1] ?? ''];

  const pattern = new RegExp(process.env.TEST_CUSTOMER_PATTERN ?? '^(checkin|qc|test)\\b', 'i');
  const cs = await gql<{ customerList: { name: string | null; phone: string | null }[] }>(
    'query{ customerList(limit: 5000){ name phone } }',
  ).catch(() => ({ customerList: [] }));
  // Only names that exist ONCE (duplicate records split points between ids) and have a phone.
  const count = new Map<string, number>();
  for (const c of cs.customerList) {
    const n = (c.name ?? '').trim();
    if (pattern.test(n) && c.phone) count.set(n, (count.get(n) ?? 0) + 1);
  }
  const ranked = [...count]
    .filter(([, k]) => k === 1)
    .map(([n]) => n)
    .sort((a, b) => a.localeCompare(b));
  [found.customer, found.customer2] = [ranked[0] ?? '', ranked[1] ?? ''];
  // Search text that finds BOTH customers: their common prefix (else the first word).
  let pre = '';
  if (found.customer && found.customer2) {
    while (
      pre.length < found.customer.length &&
      found.customer2.startsWith(found.customer.slice(0, pre.length + 1))
    ) {
      pre = found.customer.slice(0, pre.length + 1);
    }
  }
  found.customerSearch = pre.trim().length >= 3 ? pre.trim() : (found.customer.split(/\s+/)[0] ?? '');

  const gc = await gql<{
    giftCardList: { code: string | null; status: string | null; currentBalance: number }[];
  }>('query{ giftCardList(limit: 500, where:{status:{eq:"active"}}){ code status currentBalance } }').catch(
    () => ({ giftCardList: [] }),
  );
  const active = gc.giftCardList
    .filter((g) => g.code && g.currentBalance > 0)
    .sort((a, b) => a.currentBalance - b.currentBalance);
  found.giftCardActive = active[Math.floor(active.length / 2)]?.code ?? '';
  return found;
}

/** Complete profile().data in place (declared values win). Safe to call many times. */
export async function discoverStoreData(): Promise<StoreData> {
  const data = profile().data;
  let found: Partial<StoreData> | null = null;
  const file = cacheFile();
  const runId = process.env.FEATURE_RUN_ID ?? '';
  try {
    const c = JSON.parse(fs.readFileSync(file, 'utf8')) as { runId: string; data: Partial<StoreData> };
    if (runId && c.runId === runId) found = c.data;
  } catch {
    /* no cache */
  }
  if (!found) {
    found = await discoverFromApp();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ runId, data: found }, null, 2));
  }
  const keys = Object.keys(found) as (keyof StoreData)[];
  for (const k of keys) {
    if (k === 'readOnly' || k === 'giftCardLow') continue;
    if (k === 'prices') {
      data.prices = { ...(found.prices ?? {}), ...(data.prices ?? {}) };
      continue;
    }
    if (!data[k]) (data as unknown as Record<string, unknown>)[k] = found[k] ?? '';
  }
  return data;
}

/** Catalogue price (cents) of a Home-grid service, from discovery. */
export function priceOf(name: string): number {
  const c = profile().data.prices?.[name];
  if (c === undefined) throw new Error(`no discovered price for service "${name}"`);
  return c;
}

/** '' when the store data has every field `need` lists, else a skip reason. */
export function missingData(need: (keyof StoreData)[]): string {
  const d = profile().data;
  const miss = need.filter((k) => !d[k]);
  return miss.length
    ? `store ${profile().store} has no ${miss.join(', ')} (not configured and not discoverable)`
    : '';
}
