/**
 * Gift-card rotation — lets gift-card specs pass run after run.
 *
 * The catalog (`giftCards.json`) is a snapshot: every redemption drains a card, so a
 * spec pinned to one number passes once and then fails with "not Enough Balance".
 * This module remembers the balance the POS last SHOWED for each card (verdict dialog
 * "Current Balance $x", or a card a spec just emptied) in `.tmp/giftcard-balances.json`
 * (git-ignored, per merchant), and hands out cards ordered by that live figure, so an
 * emptied card is skipped and the next one is used.
 *
 * Balances are in CENTS everywhere here.
 */

import fs from 'node:fs';
import path from 'node:path';
import { activeGiftCards, GIFT_CARD_CATALOG_MERCHANT, type GiftCardRecord } from './giftCards.js';

const CACHE = path.resolve(process.cwd(), '.tmp', 'giftcard-balances.json');

interface Seen {
  balance: number;
  at: string;
}
type CacheFile = Record<string, Record<string, Seen>>;

function readCache(): CacheFile {
  try {
    return JSON.parse(fs.readFileSync(CACHE, 'utf8')) as CacheFile;
  } catch {
    return {};
  }
}

function writeCache(c: CacheFile): void {
  try {
    fs.mkdirSync(path.dirname(CACHE), { recursive: true });
    fs.writeFileSync(CACHE, JSON.stringify(c, null, 2));
  } catch (e) {
    console.warn(`giftCardRotation: cannot write ${CACHE}: ${(e as Error).message}`);
  }
}

const merchant = (): string => GIFT_CARD_CATALOG_MERCHANT;

/** Balance the POS last showed for `code` (cents), or undefined when never seen. */
export function observedBalance(code: string): number | undefined {
  return readCache()[merchant()]?.[code]?.balance;
}

/** Remember the balance the POS just showed for `code` (cents). Ignores NaN / negative. */
export function recordGiftCardBalance(code: string, cents: number): void {
  if (!code || !Number.isFinite(cents) || cents < 0) return;
  const c = readCache();
  const m = (c[merchant()] ??= {});
  m[code] = { balance: Math.round(cents), at: new Date().toISOString() };
  writeCache(c);
}

/** `code` just paid `spentCents`: lower its remembered balance (floor 0). */
export function recordGiftCardSpend(code: string, spentCents: number): void {
  const before = effectiveBalance(code);
  recordGiftCardBalance(code, Math.max(0, before - Math.round(spentCents)));
}

/** Live figure when seen, else the catalog snapshot. */
export function effectiveBalance(code: string): number {
  const seen = observedBalance(code);
  if (seen !== undefined) return seen;
  return activeGiftCards.find((c) => c.code === code)?.balance ?? 0;
}

export interface CardQuery {
  /** Only cards holding at least this much (cents). */
  minCents?: number;
  /** Only cards holding at most this much (cents). */
  maxCents?: number;
  /** 'asc' = smallest first (cards meant to fall short), 'desc' = richest first (default). */
  order?: 'asc' | 'desc';
  /** Codes to put first, in this order, when they still qualify (e.g. env overrides). */
  prefer?: readonly string[];
  /** Codes to leave out. */
  exclude?: readonly string[];
}

/**
 * Active cards that (by their live-or-snapshot balance) fit the query, best first.
 * Emptied cards drop out on their own once a spec recorded them.
 */
export function giftCardsFor(q: CardQuery = {}): string[] {
  const min = q.minCents ?? 1;
  const max = q.maxCents ?? Number.POSITIVE_INFINITY;
  const skip = new Set(q.exclude ?? []);
  const fits = (code: string): boolean => {
    const b = effectiveBalance(code);
    return b >= min && b <= max && !skip.has(code);
  };
  const ranked = activeGiftCards
    .map((c: GiftCardRecord) => ({ code: c.code, b: effectiveBalance(c.code) }))
    .filter((c) => fits(c.code))
    .sort((a, b) => (q.order === 'asc' ? a.b - b.b : b.b - a.b))
    .map((c) => c.code);
  // Env overrides are tried first even with no balance on record (they may be new cards).
  const preferred = (q.prefer ?? []).filter((c) => !skip.has(c) && (observedBalance(c) ?? min) >= min);
  return [...new Set([...preferred, ...ranked])];
}

/** Parsed gift-card verdict dialog ("Gift Card Accepted" / "not Enough Balance" / invalid). */
export interface GiftCardVerdictInfo {
  accepted: boolean;
  /** Balance short of what the check needs. */
  insufficient: boolean;
  /** Card unknown / inactive / not valid here. */
  invalid: boolean;
  /** "Current Balance" / "Balance" on the dialog, cents; undefined when not printed. */
  balanceCents?: number;
  /** "Amount Needed", cents; undefined when not printed. */
  neededCents?: number;
}

function centsOf(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const n = Number(s.replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) : undefined;
}

/** Read a verdict dialog's text (newlines may be collapsed to " | "). */
export function parseGiftCardVerdict(text: string): GiftCardVerdictInfo {
  const t = text.replace(/\s*\n+\s*/g, ' | ');
  return {
    accepted: /Gift Card Accepted/i.test(t),
    insufficient: /not Enough Balance|insufficient/i.test(t),
    invalid: /not valid|invalid|inactive|not found/i.test(t),
    balanceCents: centsOf(/(?:Current )?Balance:? \|? ?(\$[\d,.]+)/i.exec(t)?.[1]),
    neededCents: centsOf(/Amount Needed:? \|? ?(\$[\d,.]+)/i.exec(t)?.[1]),
  };
}

/** Record what a verdict dialog revealed about `code` (no-op when it printed no balance). */
export function learnFromVerdict(code: string, text: string): GiftCardVerdictInfo {
  const v = parseGiftCardVerdict(text);
  if (v.balanceCents !== undefined) recordGiftCardBalance(code, v.balanceCents);
  else if (v.invalid && !v.accepted) recordGiftCardBalance(code, 0);
  return v;
}
