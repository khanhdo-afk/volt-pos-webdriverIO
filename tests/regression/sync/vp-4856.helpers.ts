/**
 * VP-4856 helpers — the puller must not re-apply a stale `pending` echo over an
 * order that was just completed.
 *
 * NOT a spec. Builds on the volt-qc CD layer (`cdApp` / `customerScreen`) and
 * adds:
 *   - an in-page watcher that reads the local order every 300 ms over the POS
 *     GraphQL command, so the whole pay → echo window is recorded even while
 *     WebDriver is busy on the customer window;
 *   - a Card checkout driver that answers tip + signature on the customer
 *     display (the base `driveToSuccess` only answers the tip);
 *   - terminal detection, so Card cases skip on a PC without a terminal.
 *
 * Test data (env, merchant #14 defaults, dev only):
 *   VP4856_PHONE         — customer attached to every order (2052051122, Tuti)
 *   VP4856_REQUIRE_CARD  — "1": a missing terminal fails the Card cases instead of skipping them
 */

import { browser } from '@wdio/globals';
import { Timeouts } from '../../../configs/constants/timeouts.js';
import { env } from '../../../configs/env/loadEnv.js';
import { CdCustomer, CdMain } from '../../../src/constants/testids.voltqc-cd-e2e.js';
import { settle } from '../../../src/helpers/wait.js';
import { switchToMain } from '../../../src/helpers/window.js';
import { customerDisplayPage } from '../../../src/pages/index.js';
import { app, type TipChoice } from '../../../src/pages/voltqc/cd-e2e/cdApp.js';
import { cust } from '../../../src/pages/voltqc/cd-e2e/customerScreen.js';
import { voltQcProbe as P } from '../../../src/pages/voltqc/pos/VoltQcProbe.js';
import { parseMoney } from '../../../src/utils/money.js';

export const vp4856 = {
  phone: (process.env.VP4856_PHONE ?? '').replace(/\D/g, '') || '2052051122',
  requireCard: process.env.VP4856_REQUIRE_CARD === '1',
} as const;

/* ----------------------------------------------------------------------- *
 * In-page watcher
 * ----------------------------------------------------------------------- */

/** One read of the local order row (only kept when it differs from the previous one). */
export interface OrderSnap {
  t: string;
  status: string;
  tipAmount: number | null;
  customerId: string | null;
  updatedAt: string;
  completedAt: string | null;
  total: number;
}

/*
 * Runs in the STAFF window (the customer webview answers `graphql` against a
 * reduced schema). The interval keeps running while WebDriver drives the
 * customer window; it stops itself after 10 minutes.
 */
const START_WATCH = `
var code = arguments[0];
var Q = 'query vp4856Watch($c: String!) { orderList(where: { orderCode: { eq: $c } }) { status tipAmount customerId updatedAt completedAt total } }';
if (window.__vp4856 && window.__vp4856.timer) clearInterval(window.__vp4856.timer);
var w = window.__vp4856 = { code: code, log: [], last: '', errors: 0, timer: 0 };
function snap() {
  window.__TAURI_INTERNALS__.invoke('graphql', { query: Q, variables: { c: code }, operation: null }).then(function (r) {
    var d = typeof r === 'string' ? JSON.parse(r) : r;
    var o = d && d.data && d.data.orderList && d.data.orderList[0];
    if (!o) return;
    var k = JSON.stringify([o.status, o.tipAmount, o.customerId, o.updatedAt, o.total]);
    if (k === w.last) return;
    w.last = k;
    w.log.push({ t: new Date().toISOString().slice(11, 23), status: o.status, tipAmount: o.tipAmount, customerId: o.customerId, updatedAt: o.updatedAt, completedAt: o.completedAt, total: o.total });
  }).catch(function () { w.errors += 1; });
}
snap();
w.timer = setInterval(snap, 300);
setTimeout(function () { clearInterval(w.timer); }, 600000);
return true;`;

/** Start recording the local row of `code` (replaces any previous watcher). */
export async function startWatch(code: string): Promise<void> {
  await switchToMain();
  await P.exec<boolean>(START_WATCH, code);
}

/** Every distinct read so far. */
export async function watchLog(): Promise<OrderSnap[]> {
  await switchToMain();
  return P.exec<OrderSnap[]>('return (window.__vp4856 && window.__vp4856.log) || [];');
}

/** Stop the watcher. */
export async function stopWatch(): Promise<void> {
  await switchToMain().catch(() => undefined);
  await P.exec<null>('if (window.__vp4856) clearInterval(window.__vp4856.timer); return null;').catch(
    () => undefined,
  );
}

/** Keep the watcher running for `ms`, then return the log. */
export async function watchFor(ms: number): Promise<OrderSnap[]> {
  await settle(ms);
  return watchLog();
}

/** Reads from the first `successful` one onwards. */
export function afterComplete(log: readonly OrderSnap[]): OrderSnap[] {
  const i = log.findIndex((s) => s.status === 'successful');
  return i < 0 ? [] : log.slice(i);
}

/** Reads after `fromIndex` that break `ok` — empty means the order held. */
export function regressions(log: readonly OrderSnap[], ok: (s: OrderSnap) => boolean): OrderSnap[] {
  return log.filter((s) => !ok(s));
}

/**
 * Card only: did the POS write the tip draft (row still `pending` but
 * `updatedAt` moved after the first read)? This is the prod precondition.
 */
export function sawTipDraft(log: readonly OrderSnap[]): boolean {
  const pending = log.filter((s) => s.status === 'pending');
  return pending.length >= 2 && new Set(pending.map((s) => s.updatedAt)).size >= 2;
}

/* ----------------------------------------------------------------------- *
 * Checkout
 * ----------------------------------------------------------------------- */

/** Card tender chosen: is Complete Payment usable (a terminal is paired)? */
export async function cardTerminalReady(): Promise<boolean> {
  await app.selectMethod('Card');
  await settle(500);
  return !(await app.isDisabled(CdMain.completePayment));
}

/**
 * Complete Payment on the Card tender, pick `tip` on the customer display,
 * sign when the pad appears, and wait for Payment Successful.
 */
export async function driveCardToSuccess(tip: TipChoice, timeout = 120_000): Promise<void> {
  await P.clickQ(CdMain.completePayment);
  const deadline = Date.now() + timeout;
  let tipped = false;
  let signed = false;
  while (Date.now() < deadline) {
    if (/payment-success/.test(await P.path())) return;
    if (await app.passcodeShown()) {
      await app.passcodeIfAsked(Timeouts.ANIMATION);
      continue;
    }
    if (!tipped && (await cust.has(CdCustomer.addTip))) {
      await cust.chooseTipAndContinue(tip);
      tipped = true;
      continue;
    }
    if (tipped && !signed && (await customerDisplayPage.isSignaturePadShown(500).catch(() => false))) {
      await customerDisplayPage.signAndContinue();
      signed = true;
      continue;
    }
    await switchToMain();
    await settle(400);
  }
  throw new Error(
    `Card payment never reached Payment Successful within ${String(timeout / 1000)}s (path ${await P.path()}).`,
  );
}

/** "Total Tip: $x.xx" on the Payment Successful page, in cents (NaN when absent). */
export async function successTipCents(): Promise<number> {
  await switchToMain();
  // "Total Tip: $4.50" is one text node, so the `| label | value |` dump that
  // `moneyField` expects never has it as a separate cell.
  const m = /Total Tip:\s*(-?\$[\d,]+\.\d{2})/.exec(await app.successText());
  return m?.[1] ? parseMoney(m[1]) : Number.NaN;
}

/** Adjust Tip on the Payment Successful page; waits until the page shows the new tip. */
export async function adjustTipOnSuccess(cents: number): Promise<void> {
  await switchToMain();
  // Not `app.adjustTip`: its passcode probe (`passcodeDialog.isPrompting`) takes
  // the Adjust Tip digit keypad for a passcode guard and types the code into it.
  // Here the guard is told apart by its title text instead.
  await P.clickQ(CdMain.adjustTip);
  await answerStaffCodeGuard();
  await P.waitFor(CdMain.adjustTipDialog, Timeouts.MEDIUM, 'Adjust Tip keypad');
  // The keypad opens prefilled with the current tip: backspace it to $0.00.
  for (let i = 0; i < 8 && !/Enter Amount\s*\$0\.00/.test(await P.textOf(CdMain.adjustTipDialog)); i += 1) {
    await P.exec<null>(
      'var d = Array.prototype.filter.call(document.querySelectorAll("[role=dialog]"), function (x) { return /Current Tip/.test(x.innerText); }).pop();' +
        'var b = d ? Array.prototype.filter.call(d.querySelectorAll("button"), function (x) { return !String(x.innerText || "").trim(); }).pop() : null;' +
        'document.querySelectorAll("[data-vp4856-bksp]").forEach(function (x) { x.removeAttribute("data-vp4856-bksp"); });' +
        'if (b) b.setAttribute("data-vp4856-bksp", "1"); return null;',
    );
    await P.clickQ({ css: '[data-vp4856-bksp="1"]' });
  }
  for (const d of String(cents))
    await P.clickQ([CdMain.adjustTipDialog, { role: 'button', name: d, nth: 0 }]);
  await P.clickQ([CdMain.adjustTipDialog, { role: 'button', name: 'Save', nth: 0 }]);
  await answerStaffCodeGuard();
  await P.waitGoneQ(CdMain.adjustTipDialog, Timeouts.MEDIUM, 'Adjust Tip keypad');
  await browser.waitUntil(async () => (await successTipCents()) === cents, {
    timeout: Timeouts.MEDIUM,
    interval: 500,
    timeoutMsg: `Payment Successful page never showed tip ${String(cents)}¢ after Adjust Tip`,
  });
}

/** Answer an "Enter staff code" guard if one comes up within `timeout` (found by its title). */
async function answerStaffCodeGuard(timeout = 2_500): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await P.has(CdMain.passcodeDialog)) {
      const code = env.STAFF_PASSCODE || env.OWNER_PASSCODE;
      for (const c of code) await P.clickQ([CdMain.passcodeDialog, { role: 'button', name: c, nth: 0 }]);
      await P.waitGoneQ(CdMain.passcodeDialog, Timeouts.MEDIUM, 'staff code guard');
      return;
    }
    await settle(250);
  }
}

/** Order History list shows `code` with a Successful badge. */
export async function orderHistoryShowsSuccessful(code: string): Promise<boolean> {
  await switchToMain();
  const text = await app.text('body');
  return new RegExp(`${code}[\\s\\S]{0,60}Successful`).test(text);
}
