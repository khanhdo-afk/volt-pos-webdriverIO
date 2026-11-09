/**
 * Shared steps for VP-3788 — Split Order, gift card short of the check: the check's tip
 * must ride to the remainder check instead of being folded into its amount.
 *
 * NOT a spec (`*.helpers.ts`). Builds on the volt-qc split port
 * (`src/pages/voltqc/promo-split/splitFlows.ts`). Orders are addressed by their CODE.
 */

import { btn, type VqcQuery } from '../../../src/constants/testids.voltqc-pos.js';
import { VqpsCheckout, VqpsSplit, vqpsTopClose } from '../../../src/constants/testids.voltqc-promo-split.js';
import { giftCardsFor, recordGiftCardBalance } from '../../../src/data/static/giftCardRotation.js';
import { settle } from '../../../src/helpers/wait.js';
import { voltQcProbe as P } from '../../../src/pages/voltqc/pos/VoltQcProbe.js';
import {
  backOutGiftCardDialogs,
  methodButton,
  payButton,
  selectCheck,
  unpaidChecks,
} from '../../../src/pages/voltqc/promo-split/splitFlows.js';
import { app, clickOrJs, field, money, visible } from '../../../src/pages/voltqc/promo-split/vqApp.js';

const env = (k: string): string => (process.env[k] ?? '').trim();
const list = (k: string): string[] =>
  env(k)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/** Service that makes the order (Dark Queen $103 → Check 1 ≈ $54.07 card / $52.49 gift card). */
export const SERVICE = env('VP3788_SERVICE') || 'Dark Queen';
/** Cashier tip on Check 1, cents typed on the keypad. */
export const TIP_CENTS = env('VP3788_TIP_CENTS') || '800';
export const TIP = Number(TIP_CENTS) / 100;

/**
 * Cards to try for the "short" case (balance $1 … `maxCents`, below the check's base − $1),
 * smallest first. Env cards go first. Balances come from the live record kept by
 * `giftCardRotation` — a card TC-03 emptied is recorded at $0 and never offered again,
 * so the next run picks the next card. Once the small cards run out, any card under
 * `maxCents` still works.
 */
export function shortCards(maxCents = 5_000): string[] {
  return giftCardsFor({ minCents: 100, maxCents, order: 'asc', prefer: list('VP3788_SHORT_CARDS') });
}

/** Cards to try for the refused case (balance ≥ base, small enough for a sane tip). Never charged. */
export function refuseCards(minCents = 5_300): string[] {
  const near = giftCardsFor({
    minCents,
    maxCents: 20_000,
    order: 'asc',
    prefer: list('VP3788_REFUSE_CARDS'),
  });
  // Fallback: any card covering the base — the tip is sized off its balance, so it still works.
  return [...new Set([...near, ...giftCardsFor({ minCents, order: 'asc' })])];
}

/** The short card was redeemed in full by "Create New Check": remember it is empty now. */
export function markCardEmptied(code: string): void {
  recordGiftCardBalance(code, 0);
}

/* ------------------------------------------------------------------- *
 * Split screen
 * ------------------------------------------------------------------- */

/** Receipt Details panel (right of the split screen): Tip and Total in dollars. */
export async function panel(): Promise<{ tip: number; total: number; totalPaid: number; text: string }> {
  const t = await app.text('main');
  return {
    tip: money(field(t, 'Tip')),
    total: money(field(t, 'Total')),
    totalPaid: money(field(t, 'Total Paid')),
    text: t,
  };
}

/**
 * The selected check. 1.1.113: the `Select #id-n` round button carries no aria-checked;
 * the selected one is filled (`bg-primary`) and holds an inner dot, the others are hollow.
 */
export async function selectedCheck(id: string): Promise<number | null> {
  const label = await P.exec<string>(
    `var id = arguments[0];
     var all = document.querySelectorAll('main [aria-label^="Select #' + id + '-"]');
     for (var i = 0; i < all.length; i++) {
       var e = all[i];
       var on = e.getAttribute('aria-checked') === 'true' || /(^|\\s)bg-primary(\\s|$)/.test(e.getAttribute('class') || '');
       if (on) return e.getAttribute('aria-label') || '';
     }
     return '';`,
    id,
  );
  const m = /-(\d+)$/.exec(label);
  return m ? Number(m[1]) : null;
}

/** Open the cashier Tip dialog of the selected check, read its amount, close it. */
export async function readSelectedCheckTip(): Promise<number> {
  await clickOrJs(VqpsSplit.tip);
  const d = VqpsCheckout.cashierTipDialog;
  await P.waitFor([d, btn('Add')], 5_000, 'Tip dialog');
  const txt = (await P.rawText(d)) ?? '';
  await P.clickQ(vqpsTopClose);
  await P.waitGoneQ([d, btn('Add')], 5_000);
  await settle(300);
  return money(/\$[\d,.]+/.exec(txt)?.[0]);
}

/** Replace the cashier tip of the selected check: Tip → backspace ×8 → cents → Add. */
export async function setSelectedCheckTip(cents: string): Promise<void> {
  await clickOrJs(VqpsSplit.tip);
  const d = VqpsCheckout.cashierTipDialog;
  await P.waitFor([d, btn('Add')], 5_000, 'Tip dialog');
  // The backspace key is the last icon-only button of the keypad.
  const back: readonly VqcQuery[] = [d, { css: 'button:has(svg):not(:has(span))', nth: -1 }];
  for (let i = 0; i < 8; i += 1) await P.clickQ(back).catch(() => undefined);
  for (const k of cents) await P.clickQ([d, btn(k, 0)]);
  await P.clickQ([d, btn('Add')]);
  await P.waitGoneQ([d, btn('Add')], 5_000);
  await settle(500);
}

/* ------------------------------------------------------------------- *
 * Gift card verdict
 * ------------------------------------------------------------------- */

export type Verdict = 'accepted' | 'create' | 'refused' | 'other';

export interface GcVerdict {
  kind: Verdict;
  /** Whitespace-collapsed dialog text. */
  text: string;
  balance: number;
  needed: number;
}

function parseVerdict(text: string, create: boolean, refuse: boolean): GcVerdict {
  const balance = money(/Current Balance \| (\$[\d,.]+)/.exec(text)?.[1]);
  const needed = money(/Amount Needed \| (\$[\d,.]+)/.exec(text)?.[1]);
  let kind: Verdict = 'other';
  if (/Gift Card Accepted/i.test(text)) kind = 'accepted';
  else if (create) kind = 'create';
  else if (refuse) kind = 'refused';
  return { kind, text, balance, needed };
}

/** Check n → Gift Card → Pay → Input Gift Card Code → `code` → Confirm. Leaves the verdict dialog open. */
export async function giftCardVerdict(id: string, n: number, code: string): Promise<GcVerdict> {
  await selectCheck(id, n);
  await clickOrJs(methodButton('Gift Card'), 3_000);
  await settle(300);
  await clickOrJs(payButton, 3_000);
  await app.reachGiftCardInput();
  const { info } = await app.confirmGiftCardCode(code);
  await settle(500);
  return parseVerdict(
    info,
    await visible(VqpsCheckout.gcCreateNewCheck),
    await visible(VqpsCheckout.gcSelectAnotherMethod),
  );
}

/** Back out of any gift-card dialog without paying (Cancel / Select Another Method / Close). */
export const backOutOfGiftCard = backOutGiftCardDialogs;

/**
 * Try `cards` on check n until one gives a verdict of `want`; leaves THAT verdict dialog
 * open and returns it with the card. Throws listing every card's verdict when none fits.
 */
export async function findCard(
  id: string,
  n: number,
  cards: readonly string[],
  want: Verdict,
): Promise<{ code: string; v: GcVerdict }> {
  const tried: string[] = [];
  for (const code of cards) {
    const v = await giftCardVerdict(id, n, code);
    if (v.kind === want) return { code, v };
    tried.push(`${code}: ${v.kind} (bal $${v.balance.toFixed(2)})`);
    await backOutOfGiftCard();
  }
  throw new Error(`No gift card gave "${want}" on check ${String(n)} — tried ${tried.join('; ') || 'none'}`);
}

/** Highest-numbered unpaid check (the remainder check after Create New Check). */
export async function lastUnpaidCheck(id: string): Promise<number> {
  const left = await unpaidChecks(id);
  const last = left[left.length - 1];
  if (last === undefined) throw new Error('No unpaid check left');
  return last;
}

/* ------------------------------------------------------------------- *
 * Local DB (read-only graphql IPC)
 * ------------------------------------------------------------------- */

export interface Tx {
  paymentType: string;
  amount: number;
  tip: number | null;
  isCancelled: boolean | null;
}

export interface OrderDb {
  status: string;
  tipAmount: number | null;
  total: number;
  txs: Tx[];
}

/** Order + its transactions from the POS local DB (cents). Null when unreadable. */
export async function orderDb(code: string): Promise<OrderDb | null> {
  return P.exec<OrderDb | null>(
    `var q = 'query($c:String!){ orderList(where:{orderCode:{eq:$c}}){ status tipAmount total orderTransactionListById{ paymentType amount tip isCancelled } } }';
     try {
       return window.__TAURI_INTERNALS__.invoke('graphql', { query: q, variables: { c: arguments[0] }, operation: null }).then(function (res) {
         var o = (((res && res.data) || {}).orderList || [])[0];
         if (!o) return null;
         return { status: o.status, tipAmount: o.tipAmount, total: o.total, txs: o.orderTransactionListById || [] };
       }).catch(function () { return null; });
     } catch (e) { return null; }`,
    code,
  ).catch(() => null);
}
