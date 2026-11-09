/**
 * VP-3788 — Split Order (By Amount): a gift card short of the check no longer drops the
 * check's tip. "Create New Check" redeems the card against the check's base and carries
 * the whole tip to the remainder check; a balance within [base − $1, base + tip] is refused.
 *
 * TC catalogue: docs/qc/volt-qc/vp-tickets/VP-3788-split-gift-card-partial-tip-test-cases.md
 * (TC-VP3788-01…10). PR volt-pos#3360.
 *
 * TC-01…07 share order A in file order (TC-03 spends one short card's whole balance).
 * TC-08…10 share order B, which is never charged and is deleted in `after`.
 * Gift Card + Cash only — no card terminal needed.
 *
 * CREATES AND SETTLES ORDERS and empties a gift card — dev / staging only.
 */

import { expect } from '@wdio/globals';
import { assertWritesAllowed } from '../../../configs/env/loadEnv.js';
import { VqpsCheckout, VqpsSplit } from '../../../src/constants/testids.voltqc-promo-split.js';
import { returnToHome } from '../../../src/flows/index.js';
import { step } from '../../../src/helpers/steps.js';
import { settle } from '../../../src/helpers/wait.js';
import { freshDetail, staffTip } from '../../../src/pages/voltqc/oh-reopen/vqReopen.js';
import { voltQcProbe as P } from '../../../src/pages/voltqc/pos/VoltQcProbe.js';
import {
  checkAmount,
  completeDone,
  isCheckPaid,
  methodButton,
  methodPrice,
  modeButton,
  openSplit,
  payCheck,
  selectCheck,
  unpaidChecks,
} from '../../../src/pages/voltqc/promo-split/splitFlows.js';
import { app, clickOrJs, field, money, vqEnv } from '../../../src/pages/voltqc/promo-split/vqApp.js';
import { Tag, title } from '../../../src/types/testTags.js';
import { escapeSplit, leaveSuccessIfShown } from './vp-split-payment.helpers.js';
import {
  SERVICE,
  TIP,
  TIP_CENTS,
  backOutOfGiftCard,
  findCard,
  giftCardVerdict,
  lastUnpaidCheck,
  markCardEmptied,
  orderDb,
  panel,
  readSelectedCheckTip,
  refuseCards,
  selectedCheck,
  setSelectedCheckTip,
  shortCards,
  type GcVerdict,
} from './vp-3788.helpers.js';

const $ = (n: number): string => `$${n.toFixed(2)}`;
const cents = (n: number): number => Math.round(n * 100);

/** Order A (TC-01…07). */
const A = {
  id: '',
  /** Check 1 price on the Card tender before the tip (card basis). */
  cardBase: 0,
  /** Check 1 price on the Gift Card tender before the tip. */
  gcBase: 0,
  /** Panel Total once the tip is on. */
  totalWithTip: 0,
  card: '',
  verdict: null as GcVerdict | null,
  remainder: 0,
  paid: false,
};

/** Order B (TC-08…10). */
const B = { id: '', gcBase: 0, tip: 0 };

function need(ctx: Mocha.Context, ok: unknown): void {
  if (!ok) ctx.skip(); // the case this one builds on did not get that far
}

/** New order on SERVICE → Split → By Amount → Check 1 tip. Returns the order code. */
async function splitWithTip(tipCents: string): Promise<{ id: string; cardBase: number; gcBase: number }> {
  const id = await app.createOrder({ services: [SERVICE] });
  await openSplit();
  await clickOrJs(modeButton('By Amount'), 5_000);
  await settle(800);
  const cardBase = await methodPrice(id, 1, 'Card');
  const gcBase = await methodPrice(id, 1, 'Gift Card');
  await selectCheck(id, 1);
  if (Number(tipCents) > 0) await setSelectedCheckTip(tipCents);
  return { id, cardBase, gcBase };
}

describe('VP-3788 — Split gift card short of the check keeps the tip', () => {
  before(async () => {
    assertWritesAllowed('settle split orders paid by gift card');
    await returnToHome();
  });

  after(async () => {
    await backOutOfGiftCard().catch(() => undefined);
    await escapeSplit().catch(() => undefined);
    await leaveSuccessIfShown().catch(() => undefined);
    await returnToHome().catch(() => undefined);
    await app.cleanupOrders().catch(() => undefined);
  });

  describe('1. Short card → Create New Check (order A)', () => {
    it(
      title('TC-VP3788-01: Split By Amount + tip on Check 1', Tag.REGRESSION, Tag.WRITE, Tag.PAYMENT),
      async function () {
        this.timeout(4 * 60_000);
        const r = await splitWithTip(TIP_CENTS);
        Object.assign(A, { id: r.id, cardBase: r.cardBase, gcBase: r.gcBase });
        await clickOrJs(methodButton('Card'), 3_000);
        await settle(300);
        expect(await checkAmount(A.id, 1)).toBeCloseTo(A.cardBase + TIP, 2);
        const p = await panel();
        expect(p.tip).toBeCloseTo(TIP, 2);
        A.totalWithTip = p.total;
      },
    );

    it(
      title(
        'TC-VP3788-02: short card → "not Enough Balance" offers Create New Check',
        Tag.REGRESSION,
        Tag.WRITE,
        Tag.PAYMENT,
      ),
      async function () {
        this.timeout(5 * 60_000);
        need(this, A.id);
        const { code, v } = await findCard(A.id, 1, shortCards(cents(A.gcBase) - 101), 'create');
        A.card = code;
        A.verdict = v;
        expect(v.text).toMatch(/not Enough Balance/i);
        expect(v.balance).toBeGreaterThan(0);
        expect(v.balance).toBeLessThan(A.gcBase - 1);
        // Amount Needed is the check's gift-card price with the tip on top.
        expect(v.needed).toBeCloseTo(A.gcBase + TIP, 2);
        expect(await P.has(VqpsCheckout.gcCreateNewCheck)).toBe(true);
      },
    );

    it(
      title(
        'TC-VP3788-03: Create New Check → tip stays on the panel, Total unchanged',
        Tag.REGRESSION,
        Tag.WRITE,
        Tag.PAYMENT,
      ),
      async function () {
        this.timeout(3 * 60_000);
        need(this, A.verdict);
        const bal = A.verdict?.balance ?? 0;
        await P.clickQ(VqpsCheckout.gcCreateNewCheck);
        await P.waitGoneQ(VqpsCheckout.gcCreateNewCheck, 15_000, 'not Enough Balance dialog');
        await settle(1_500);
        A.paid = true;
        markCardEmptied(A.card); // next run picks another short card

        expect(await isCheckPaid(A.id, 1)).toBe(true);
        expect(await checkAmount(A.id, 1)).toBeCloseTo(bal, 2);
        const p = await panel();
        expect(p.tip).toBeCloseTo(TIP, 2);
        expect(p.total).toBeCloseTo(A.totalWithTip, 2);
        expect(p.totalPaid).toBeCloseTo(bal, 2);
      },
    );

    it(
      title('TC-VP3788-04: the remainder check is selected and carries the tip', Tag.REGRESSION, Tag.WRITE),
      async function () {
        this.timeout(2 * 60_000);
        need(this, A.paid);
        const bal = A.verdict?.balance ?? 0;
        A.remainder = await lastUnpaidCheck(A.id);
        expect(A.remainder).toBeGreaterThan(2);
        await step('the remainder check is the selected one', async () => {
          expect(await selectedCheck(A.id)).toBe(A.remainder);
        });
        // Card basis: what the card did not cover of the base, plus the whole tip.
        expect(cents(await checkAmount(A.id, A.remainder))).toBe(cents(A.cardBase - bal + TIP));
        expect(await readSelectedCheckTip()).toBeCloseTo(TIP, 2);
      },
    );

    it(
      title(
        'TC-VP3788-05: pay the rest in Cash → remainder shows "Tip: $x", Success shows the tip',
        Tag.REGRESSION,
        Tag.WRITE,
        Tag.PAYMENT,
        Tag.DUAL_WINDOW,
      ),
      async function () {
        this.timeout(6 * 60_000);
        need(this, A.remainder);
        // Remainder first; then whatever is left. (If the split screen was rebuilt the app
        // folds unpaid checks together — the tip then rides on that merged check.)
        const left = await unpaidChecks(A.id);
        const order = [A.remainder, ...left.filter((n) => n !== A.remainder)].filter((n) => left.includes(n));
        for (const n of order) await payCheck(A.id, n, 'Cash');
        await step('a paid check carries the tip', async () => {
          expect(await P.pageText('main')).toContain(`(Tip: ${$(TIP)})`);
        });
        const success = await completeDone();
        expect(success).toContain('Payment Successful!');
        expect(success).toContain(`Total Tip: ${$(TIP)}`);
        expect(success).toContain(`${vqEnv.testStaff} - ${$(TIP)}`);
        await leaveSuccessIfShown();
        app.createdOrders.delete(A.id);
      },
    );

    it(
      title(
        'TC-VP3788-06: order data — tipAmount, tip on the remainder tx, gift card tx tip 0',
        Tag.REGRESSION,
        Tag.WRITE,
      ),
      async function () {
        this.timeout(2 * 60_000);
        need(this, A.remainder);
        const bal = A.verdict?.balance ?? 0;
        let o = await orderDb(A.id);
        for (let i = 0; i < 20 && o?.status !== 'successful'; i += 1) {
          await settle(1_000);
          o = await orderDb(A.id);
        }
        if (!o) throw new Error(`Order ${A.id} not readable from the local DB`);
        expect(o.status).toBe('successful');
        expect(o.tipAmount).toBe(Number(TIP_CENTS));
        const live = o.txs.filter((t) => !t.isCancelled);
        const gc = live.filter((t) => t.paymentType === 'gift_card');
        expect(gc).toHaveLength(1);
        expect(gc[0]?.amount).toBe(cents(bal));
        expect(gc[0]?.tip ?? 0).toBe(0);
        const tipped = live.filter((t) => (t.tip ?? 0) > 0);
        expect(tipped).toHaveLength(1);
        expect(tipped[0]?.paymentType).toBe('cash');
        expect(tipped[0]?.tip).toBe(Number(TIP_CENTS));
        // The customer paid exactly the order total — the fix only moved money into tipAmount.
        expect(live.reduce((s, t) => s + t.amount + (t.tip ?? 0), 0)).toBe(o.total);
      },
    );

    it(
      title('TC-VP3788-07: Order History shows the tip and the total', Tag.REGRESSION, Tag.WRITE),
      async function () {
        this.timeout(3 * 60_000);
        need(this, A.remainder);
        const d = await freshDetail(A.id, (x) => field(x, 'Tip') !== '');
        expect(field(d, 'Tip')).toBe($(TIP));
        expect(staffTip(d, vqEnv.testStaff)).toBeCloseTo(TIP, 2);
        const o = await orderDb(A.id);
        expect(cents(money(field(d, 'Total')))).toBe(o?.total);
      },
    );
  });

  describe('2. Cancel and the refused band (order B — never charged)', () => {
    it(
      title(
        'TC-VP3788-08: Cancel on "not Enough Balance" → nothing charged, tip kept',
        Tag.REGRESSION,
        Tag.WRITE,
        Tag.PAYMENT,
      ),
      async function () {
        this.timeout(6 * 60_000);
        await leaveSuccessIfShown();
        await returnToHome();
        const r = await splitWithTip(TIP_CENTS);
        Object.assign(B, { id: r.id, gcBase: r.gcBase, tip: TIP });
        await findCard(B.id, 1, shortCards(cents(B.gcBase) - 101), 'create');
        await P.clickQ([
          { role: 'dialog', nth: -1 },
          { role: 'button', name: 'Cancel', nth: 0 },
        ]);
        await backOutOfGiftCard();
        await settle(800);
        expect(await isCheckPaid(B.id, 1)).toBe(false);
        expect((await panel()).tip).toBeCloseTo(TIP, 2);
        expect((await orderDb(B.id))?.txs ?? []).toHaveLength(0);
      },
    );

    it(
      title(
        'TC-VP3788-09: balance within [base − $1, base + tip] → refused, no Create New Check',
        Tag.REGRESSION,
        Tag.WRITE,
        Tag.PAYMENT,
      ),
      async function () {
        this.timeout(6 * 60_000);
        need(this, B.id);
        // Probe a card that covers the base with no tip, then raise the tip past its balance.
        await selectCheck(B.id, 1);
        await setSelectedCheckTip('0');
        const { code, v: probe } = await findCard(B.id, 1, refuseCards(cents(B.gcBase)), 'accepted');
        await backOutOfGiftCard();
        const bal = probe.balance;
        if (bal <= 0) throw new Error(`Accepted dialog printed no balance: ${probe.text}`);
        // base + tip lands $3 above the balance, and balance ≥ base ⇒ inside the refused band.
        const tipCents = cents(bal - B.gcBase) + 300;
        B.tip = tipCents / 100;
        await selectCheck(B.id, 1);
        await setSelectedCheckTip(String(tipCents));
        const v = await giftCardVerdict(B.id, 1, code);
        expect(v.kind).toBe('refused');
        expect(v.text).toMatch(/not Enough Balance/i);
        expect(await P.has(VqpsCheckout.gcCreateNewCheck)).toBe(false);
        expect(await P.has(VqpsCheckout.gcSelectAnotherMethod)).toBe(true);
        expect(v.needed).toBeCloseTo(B.gcBase + B.tip, 2);
        expect(v.balance).toBeGreaterThanOrEqual(B.gcBase - 1);
        expect(v.balance).toBeLessThanOrEqual(B.gcBase + B.tip);
      },
    );

    it(
      title(
        'TC-VP3788-10: Select Another Method → no transaction, tip kept',
        Tag.REGRESSION,
        Tag.WRITE,
        Tag.PAYMENT,
      ),
      async function () {
        this.timeout(2 * 60_000);
        need(this, B.id);
        need(this, await P.has(VqpsCheckout.gcSelectAnotherMethod));
        await P.clickQ(VqpsCheckout.gcSelectAnotherMethod);
        await P.waitGoneQ(VqpsCheckout.gcSelectAnotherMethod, 8_000, 'refused dialog');
        await settle(800);
        expect(await P.count({ role: 'dialog' })).toBe(0);
        const p = await panel();
        expect(p.totalPaid).toBe(0);
        expect(p.tip).toBeCloseTo(B.tip, 2);
        expect((await orderDb(B.id))?.txs ?? []).toHaveLength(0);
        // Leave order B pending and the split screen idle for `after` to clean up.
        await clickOrJs(VqpsSplit.backToOrder, 3_000).catch(() => undefined);
      },
    );
  });
});
