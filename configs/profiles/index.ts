/**
 * The TWO environments this suite targets — one test codebase, two profiles.
 *
 *   staging    = backend https://volt-pos.v2.dev-fastboypay.com (internal ENV=dev), stores 14 / 100004
 *   production = backend https://volt-pos.v2.fastboypay.com     (internal ENV=prod), ANY store
 *                (default 20258; e.g. STORE_ID=2949). A store JSON is optional — whatever
 *                it leaves empty is discovered from the signed-in app at run start
 *                (src/features/discover.ts). `"readOnly": true` stores never get writes.
 *
 * Feature specs (tests/features/**) are written once and read everything that
 * differs — store, catalogue names, customers, gift cards, and what they are
 * ALLOWED to do — from the active profile. The internal ENV name is kept
 * (dev / prod) so the existing dev code paths keep working unchanged.
 *
 * Select with TARGET=staging|production (set by the npm scripts) and STORE_ID.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type Target = 'staging' | 'production';
export type Capability = 'writes' | 'settings' | 'card' | 'resetDb' | 'relaunch';

export interface StoreData {
  /** Real merchant whose data must not change: writes / settings / card are denied. */
  readOnly?: boolean;
  staffA: string;
  staffB: string;
  /** Services priced a few cents (production) — keep every order tiny. */
  cheap: string;
  cheap2: string;
  cheap3: string;
  /** Two $25 services (receipt/service-fee and split cases). */
  svc25: string;
  svc25b: string;
  /** Test customer name and the search text that finds it. */
  customer: string;
  customerSearch: string;
  /** A second test customer (reopen: change customer A → B). */
  customer2: string;
  /** Active gift card with a balance (may be '' — then the gift-card TCs skip). */
  giftCardActive: string;
  /** Gift card whose balance is BELOW a $60 check (VP-3788); '' → skip. */
  giftCardLow: string;
  /** Home-grid catalogue prices in cents (discovered). */
  prices?: Record<string, number>;
}

export interface Profile {
  target: Target;
  env: 'dev' | 'prod';
  backend: string;
  store: string;
  stores: string[];
  data: StoreData;
  /** Static policy; `card` on production is further gated at run time (see src/features/policy.ts). */
  allows: Record<Capability, boolean>;
  /** Highest card charge per transaction, cents. */
  cardMaxCents: number;
  retries: number;
  attachOnly: boolean;
}

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const EMPTY_STORE_DATA: StoreData = {
  staffA: '',
  staffB: '',
  cheap: '',
  cheap2: '',
  cheap3: '',
  svc25: '',
  svc25b: '',
  customer: '',
  customerSearch: '',
  customer2: '',
  giftCardActive: '',
  giftCardLow: '',
};

const BASE: Record<Target, Omit<Profile, 'store' | 'data'>> = {
  staging: {
    target: 'staging',
    env: 'dev',
    backend: 'https://volt-pos.v2.dev-fastboypay.com',
    stores: ['14', '100004'],
    allows: { writes: true, settings: true, card: true, resetDb: true, relaunch: true },
    cardMaxCents: Number.MAX_SAFE_INTEGER,
    retries: 1,
    attachOnly: false,
  },
  production: {
    target: 'production',
    env: 'prod',
    backend: 'https://volt-pos.v2.fastboypay.com',
    // Any production store can be targeted (STORE_ID); the first is the default test store.
    stores: (process.env.PROD_STORES ?? '20258,2949')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    allows: { writes: true, settings: true, card: true, resetDb: false, relaunch: false },
    cardMaxCents: 50,
    retries: 0,
    attachOnly: true,
  },
};

let cached: Profile | null = null;

export function profile(): Profile {
  if (cached) return cached;
  const target = (process.env.TARGET ?? '') as Target;
  if (target !== 'staging' && target !== 'production') {
    throw new Error(`TARGET must be "staging" or "production" (got "${String(process.env.TARGET)}").`);
  }
  const base = BASE[target];
  const store = (process.env.STORE_ID ?? base.stores[0] ?? '').trim();
  if (!/^\d+$/.test(store)) throw new Error(`STORE_ID must be a store number (got "${store}").`);
  if (target === 'staging' && !base.stores.includes(store)) {
    throw new Error(`Store ${store} is not part of the ${target} profile (${base.stores.join(', ')}).`);
  }
  // Store JSON is optional: empty fields are discovered from the app (src/features/discover.ts).
  const file = path.join(HERE, `${target}.${store}.json`);
  const data: StoreData = {
    ...EMPTY_STORE_DATA,
    ...(fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<StoreData>) : {}),
  };
  // A read-only (real) store gets writes only when the operator names it explicitly.
  const readOnly = data.readOnly === true && process.env.ALLOW_STORE_WRITES !== store;
  const allows = readOnly ? { ...base.allows, writes: false, settings: false, card: false } : base.allows;
  const cap = Number.parseInt(process.env.PROD_CARD_MAX_CENTS ?? '', 10);
  cached = {
    ...base,
    allows,
    store,
    data,
    cardMaxCents:
      target === 'production' && Number.isFinite(cap) && cap > 0 ? Math.min(cap, 50) : base.cardMaxCents,
  };
  return cached;
}
