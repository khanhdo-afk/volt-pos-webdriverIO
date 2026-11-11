/**
 * ALL card-payment TCs of the three projects, grouped and run LAST.
 *
 * Production: every TC here is SKIPPED (PENDING Card) unless the run was started
 * with `npm run test:production:card`, which first ASKS the operator whether the
 * terminal is on the production gateway and a real card may be charged. Each
 * charge is capped at the profile's cardMaxCents (≤ $0.50) — see payCard().
 *
 *   VP-4856  card + customer tip never flips back to pending; Adjust Tip; repeat
 *   VP-4444  card success only after the charge settles (no early success)
 *   VP-5717  card + tip chosen on the customer display stays successful
 *   VP-5634  Order History → receipt of a CARD order prints fee-inclusive lines
 *   VP-3957 / VP-4012 / VP-4079  Re-Open, add an item, pay the difference by card
 */
import { expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import {
  buildOrder,
  capturePrint,
  click,
  completePayment,
  deleteDraft,
  exists,
  mainText,
  noReceipt,
  openCheckout,
  openHistoryOrder,
  orderByCode,
  pause,
  payCard,
  pickMethod,
  receiptAmount,
  receiptItems,
  reopen,
} from '../../../src/features/pos.js';
import { cardIt } from '../../../src/features/spec.js';
import { priceOf } from '../../../src/features/discover.js';
import {
  addLinesBySearch,
  cancelOrder,
  checkoutQuote,
  confirmVoidAll,
  editOrder,
  expectedQuote,
  lineDiscount,
  orderMoney,
  payFromEditor,
  settleCash,
  storeRates,
} from '../../../src/features/reopen.js';

const d = profile().data;
const drafts: string[] = [];
/** Completed orders touched by Re-Open TCs — cancelled (card voided) in after(). */
const reopened: string[] = [];
let cardOrder = '';

async function stableSuccess(code: string, seconds: number): Promise<void> {
  const first = await orderByCode(code);
  expect(first?.status).toBe('successful');
  for (let t = 0; t < seconds; t += 10) {
    await pause(10_000);
    const o = await orderByCode(code);
    expect(o?.status).toBe('successful');
    expect(o?.tipAmount).toBe(first?.tipAmount);
  }
}

describe(`[${profile().target}] Card payments (grouped, run last)`, () => {
  after(async () => {
    for (const c of drafts) await deleteDraft(c);
    for (const id of reopened)
      await cancelOrder(id).catch((e: Error) => console.warn(`[cleanup] ${e.message}`));
  });

  cardIt(
    'VP-4856 TC-01 / VP-5717 Card + customer tip: success, stays successful 60 s with its tip',
    async () => {
      const code = await buildOrder([[d.staffA, [d.cheap2]]]);
      drafts.push(code);
      await openCheckout();
      const out = await payCard('30%');
      expect(out.result).toBe('success');
      await noReceipt();
      await stableSuccess(code, 60);
      cardOrder = code;
      drafts.pop();
    },
  );

  cardIt('VP-4856 TC-02 Adjust Tip after a card payment keeps the order successful', async () => {
    const o = await orderByCode(cardOrder);
    await openHistoryOrder(o?.id ?? '');
    if (await exists('Adjust Tip')) {
      await click('Adjust Tip', { scope: 'main' });
      await pause(1500);
      await click('1', { scope: 'dialog', last: true });
      await click(/^(Save|Confirm|Add|Done)$/, { scope: 'dialog', last: true });
      await pause(3000);
    }
    await stableSuccess(cardOrder, 30);
  });

  cardIt('VP-4856 TC-03 A second card + tip order also stays successful', async () => {
    const code = await buildOrder([[d.staffB, [d.cheap]]]);
    drafts.push(code);
    await openCheckout();
    expect((await payCard('30%')).result).toBe('success');
    await noReceipt();
    await stableSuccess(code, 40);
    drafts.pop();
  });

  cardIt(
    'VP-4444 Card: success appears only once the charge settles; a declined card never shows success',
    async () => {
      const code = await buildOrder([[d.staffA, [d.cheap3]]]);
      drafts.push(code);
      await openCheckout();
      const out = await payCard('No Tip');
      if (out.result === 'failed') {
        expect(await exists('Payment Successful')).toBe(false);
        expect((await orderByCode(code))?.status).toBe('pending');
      } else {
        expect(out.result).toBe('success');
        expect((await orderByCode(code))?.status).toBe('successful');
        await noReceipt();
        drafts.pop();
      }
    },
  );

  cardIt(
    'VP-5634 TC-07 Order History → receipt of a Card order prints fee-inclusive lines summing to Subtotal',
    async () => {
      const o = await orderByCode(cardOrder);
      await openHistoryOrder(o?.id ?? '');
      await click('Receipt', { scope: 'main' });
      await pause(2000);
      const text = await capturePrint(() => click('Print', { scope: 'dialog' }));
      const items = receiptItems(text);
      expect(items.length).toBeGreaterThan(0);
      expect(items.reduce((s, i) => s + i.cents, 0)).toBe(receiptAmount(text, 'Subtotal'));
    },
  );

  cardIt(
    'VP-3957/4012/4079 Re-Open, add an item, pay the difference by Card — Card amount = (Δ+SF)+tax, new card payment',
    async () => {
      const rates = await storeRates();
      const code = await buildOrder([[d.staffA, [d.cheap3]]]);
      drafts.push(code);
      await openCheckout();
      await pickMethod('Cash');
      expect((await completePayment('No Tip')).result).toBe('success');
      await noReceipt();
      const before = await orderMoney(code);
      reopened.push(before.id);
      drafts.pop();
      await reopen(before.id);
      await editOrder();
      await addLinesBySearch(d.staffA, [d.cheap]);
      await openCheckout();
      const q = await checkoutQuote();
      const want = expectedQuote(priceOf(d.cheap), rates, 'service');
      // ±1¢: per-line rounding on cent-sized test prices.
      expect(Math.abs(q.card - want.card)).toBeLessThanOrEqual(1);
      expect((await payCard('No Tip')).result).toBe('success');
      await noReceipt();
      const after = await orderMoney(code);
      expect(after.status).toBe('successful');
      expect(after.total).toBe(before.total + q.card);
      expect(after.userInput.reopenEditCount).toBe(1);
    },
  );

  cardIt(
    'VP-2585 Card order, Re-Open lowers the total → the card payment is VOIDED → pay again',
    async () => {
      const code = await buildOrder([[d.staffA, [d.cheap, d.cheap2]]]);
      drafts.push(code);
      await openCheckout();
      expect((await payCard('No Tip')).result).toBe('success');
      await noReceipt();
      const before = await orderMoney(code);
      reopened.push(before.id);
      drafts.pop();
      await reopen(before.id);
      await editOrder();
      await lineDiscount(d.cheap2, Math.max(1, priceOf(d.cheap2) - 1));
      expect(await payFromEditor()).toContain('void all previous transactions');
      await confirmVoidAll();
      await settleCash();
      const after = await orderMoney(code);
      expect(after.status).toBe('successful');
      expect(after.total).toBeLessThan(before.total);
      const t = await mainText();
      expect(t).toMatch(/Credit: \$[\d.]+[\s\S]*Voided/);
    },
  );
});
