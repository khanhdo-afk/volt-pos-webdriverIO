/**
 * VP-4856 — a few seconds after `completeOrder` the puller re-applied the
 * server's stale `pending` echo of the tip-draft push over the completed row
 * (torn read of fences vs push queue). The order showed unpaid after a card
 * payment. Fix: PR volt-pos#3260 (develop 06/11, >= 1.1.113) reads both in one
 * snapshot.
 *
 * docs/qc/volt-qc/vp-tickets/VP-4856-sync-stale-echo-completed-order-test-cases.md (TC-VP4856-01..07)
 *
 *   npm run test:attach -- --spec tests/regression/sync/vp-4856-stale-echo.spec.ts
 *
 * The race itself (a few ms) cannot be forced through the UI; these cases are
 * the end-to-end regression around it: pay with the tip chosen on the customer
 * display, then record the local row every 300 ms (in-page watcher) through
 * the echo window and assert it never leaves `successful` / loses tip or
 * customer. Card cases need a paired terminal and skip without one
 * (VP4856_REQUIRE_CARD=1 turns the skip into a failure).
 *
 * CREATES AND PAYS ORDERS. dev / staging only.
 */

import { expect } from '@wdio/globals';
import { CdCustomer, CdMain } from '../../../src/constants/testids.voltqc-cd-e2e.js';
import { returnToHome } from '../../../src/flows/index.js';
import { settle } from '../../../src/helpers/wait.js';
import { switchToMain } from '../../../src/helpers/window.js';
import { app, type TipChoice } from '../../../src/pages/voltqc/cd-e2e/cdApp.js';
import { cust } from '../../../src/pages/voltqc/cd-e2e/customerScreen.js';
import { Tag, title } from '../../../src/types/testTags.js';
import { customerByPhone, orderRow, waitOrderRow } from '../customer-display/vp-5195.helpers.js';
import { ensure, note, resetTill, track, untrack } from '../volt-qc/cd-e2e/cd-e2e.helpers.js';
import {
  adjustTipOnSuccess,
  afterComplete,
  cardTerminalReady,
  driveCardToSuccess,
  orderHistoryShowsSuccessful,
  type OrderSnap,
  regressions,
  sawTipDraft,
  startWatch,
  stopWatch,
  successTipCents,
  vp4856,
  watchFor,
  watchLog,
} from './vp-4856.helpers.js';

/** How long the row is watched after Payment Successful / after Adjust Tip. */
const ECHO_WINDOW_MS = 40_000;
const ADJUST_WINDOW_MS = 30_000;

/** Orders this run paid, for TC-07. */
const paid: string[] = [];
let customerId = '';
let terminal: boolean | undefined;

/** New Quick Checkout order with the test customer attached (Yes on the display). */
async function orderWithCustomer(): Promise<string> {
  const code = track(await app.createOrder());
  await app.attachExistingCustomer(vp4856.phone);
  if (await cust.waitFor(CdCustomer.isThisYourPhone, 10_000)) await cust.confirm('Yes');
  await switchToMain();
  await app.closeStrayDialogs();
  return code;
}

interface Paid {
  code: string;
  tip: number;
}

/**
 * Order → watcher → Pay → tender → tip on the display (+ signature for Card) →
 * Payment Successful. Returns `undefined` for Card when no terminal is paired.
 */
async function payWithDisplayTip(method: 'Card' | 'Cash', tip: TipChoice): Promise<Paid | undefined> {
  const code = await orderWithCustomer();
  await startWatch(code);
  await app.pay();
  if (method === 'Card') {
    terminal ??= await cardTerminalReady();
    if (!terminal) return undefined;
    await app.selectMethod('Card');
    await driveCardToSuccess(tip);
  } else {
    await app.selectMethod('Cash');
    await app.completePayment(tip);
  }
  untrack(code);
  paid.push(code);
  const tipCents = await successTipCents();
  ensure(Number.isFinite(tipCents) && tipCents > 0, `no tip on Payment Successful (${String(tipCents)})`);
  return { code, tip: tipCents };
}

/** Card with no terminal: skip, or fail when VP4856_REQUIRE_CARD=1. */
function noTerminal(ctx: Mocha.Context): void {
  ensure(
    !vp4856.requireCard,
    'VP4856_REQUIRE_CARD=1 but Complete Payment is disabled on Card (no terminal paired)',
  );
  note('Card tender has no terminal paired — Card case skipped.');
  ctx.skip();
}

/** From the first `successful` read on: still successful, same tip, same customer. */
function expectHeld(log: readonly OrderSnap[], tip: number, what: string): void {
  const after = afterComplete(log);
  ensure(after.length > 0, `${what}: the row never became successful — log ${JSON.stringify(log)}`);
  const bad = regressions(
    after,
    (s) => s.status === 'successful' && s.tipAmount === tip && s.customerId === customerId,
  );
  ensure(
    bad.length === 0,
    `${what}: row regressed after complete ${JSON.stringify(bad)} — log ${JSON.stringify(log)}`,
  );
}

/** Pay, then watch the echo window and assert the row held. */
async function payAndHold(method: 'Card' | 'Cash', tip: TipChoice, ctx: Mocha.Context): Promise<Paid> {
  const p = await payWithDisplayTip(method, tip);
  if (!p) {
    noTerminal(ctx);
    throw new Error('unreachable');
  }
  const log = await watchFor(ECHO_WINDOW_MS);
  if (method === 'Card') {
    // The prod precondition: the tip draft was written while still pending.
    ensure(sawTipDraft(log), `Card: no tip-draft write seen before complete — log ${JSON.stringify(log)}`);
  }
  expectHeld(log, p.tip, `${method} ${p.code}`);
  const row = await orderRow(p.code);
  expect(row.status).toBe('successful');
  return p;
}

/** Adjust Tip on Payment Successful, watch, assert the new tip landed and the row held. */
async function adjustAndHold(p: Paid, cents: number): Promise<void> {
  const from = (await watchLog()).length;
  await adjustTipOnSuccess(cents);
  const log = (await watchFor(ADJUST_WINDOW_MS)).slice(Math.max(0, from - 1));
  const bad = regressions(log, (s) => s.status === 'successful' && s.customerId === customerId);
  ensure(
    bad.length === 0,
    `after Adjust Tip the row regressed ${JSON.stringify(bad)} — log ${JSON.stringify(log)}`,
  );
  const last = log.at(-1);
  ensure(
    last?.tipAmount === cents,
    `tip after Adjust Tip: want ${String(cents)} got ${JSON.stringify(last)}`,
  );
  expect((await orderRow(p.code)).status).toBe('successful');
}

describe('VP-4856 — a just-completed order keeps successful / tip / customer through the sync echo', () => {
  before(async () => {
    await switchToMain();
    await returnToHome();
    customerId = (await customerByPhone(vp4856.phone)).id;
  });

  beforeEach(async () => {
    await switchToMain();
  });

  afterEach(async () => {
    await stopWatch();
    await switchToMain().catch(() => undefined);
    await resetTill();
  });

  after(async () => {
    await returnToHome().catch(() => undefined);
  });

  describe('1. Card, tip chosen on the customer display (prod scenario)', () => {
    it(
      title(
        'TC-VP4856-01: Card + display tip → row stays successful with tip and customer through the echo',
        Tag.REGRESSION,
        Tag.CRITICAL,
        Tag.WRITE,
        Tag.PAYMENT,
        Tag.DUAL_WINDOW,
      ),
      async function () {
        this.timeout(5 * 60_000);
        await payAndHold('Card', '15%', this);
      },
    );

    it(
      title(
        'TC-VP4856-02: Card → Adjust Tip after complete → new tip lands, row stays successful',
        Tag.REGRESSION,
        Tag.WRITE,
        Tag.PAYMENT,
        Tag.DUAL_WINDOW,
      ),
      async function () {
        this.timeout(5 * 60_000);
        const p = await payAndHold('Card', '15%', this);
        await adjustAndHold(p, 600);
      },
    );

    it(
      title(
        'TC-VP4856-03: Card twice in a row → both rows hold',
        Tag.REGRESSION,
        Tag.WRITE,
        Tag.PAYMENT,
        Tag.DUAL_WINDOW,
      ),
      async function () {
        this.timeout(8 * 60_000);
        await payAndHold('Card', '20%', this);
        await app.noReceipt();
        await returnToHome();
        await payAndHold('Card', '10%', this);
      },
    );
  });

  describe('2. Cash, tip chosen on the customer display (regression)', () => {
    it(
      title(
        'TC-VP4856-04: Cash + display tip → row stays successful with tip and customer',
        Tag.REGRESSION,
        Tag.WRITE,
        Tag.PAYMENT,
        Tag.DUAL_WINDOW,
      ),
      async function () {
        this.timeout(5 * 60_000);
        await payAndHold('Cash', '15%', this);
      },
    );

    it(
      title(
        'TC-VP4856-05: Cash → Adjust Tip after complete → new tip lands, row stays successful',
        Tag.REGRESSION,
        Tag.WRITE,
        Tag.PAYMENT,
        Tag.DUAL_WINDOW,
      ),
      async function () {
        this.timeout(5 * 60_000);
        const p = await payAndHold('Cash', '15%', this);
        await adjustAndHold(p, 500);
      },
    );

    it(
      title(
        'TC-VP4856-06: Cash twice in a row → both rows hold',
        Tag.REGRESSION,
        Tag.WRITE,
        Tag.PAYMENT,
        Tag.DUAL_WINDOW,
      ),
      async function () {
        this.timeout(8 * 60_000);
        await payAndHold('Cash', '20%', this);
        await app.noReceipt();
        await returnToHome();
        await payAndHold('Cash', '10%', this);
      },
    );
  });

  describe('3. Order History', () => {
    it(
      title(
        'TC-VP4856-07: Order History lists every order this run paid as Successful',
        Tag.REGRESSION,
        Tag.DUAL_WINDOW,
      ),
      async function () {
        this.timeout(4 * 60_000);
        ensure(paid.length > 0, 'no order was paid earlier in this run (run the whole file)');
        await app.go('/order-history');
        const missing: string[] = [];
        for (const code of paid) {
          await app.fill(CdMain.historySearch, code);
          await settle(1_200);
          if (!(await orderHistoryShowsSuccessful(code))) missing.push(code);
          expect((await waitOrderRow(code, (r) => r.status === 'successful')).status).toBe('successful');
        }
        ensure(missing.length === 0, `not shown as Successful in Order History: ${missing.join(', ')}`);
      },
    );
  });
});
