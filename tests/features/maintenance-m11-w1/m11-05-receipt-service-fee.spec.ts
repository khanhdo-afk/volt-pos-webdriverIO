/**
 * Maintenance 2026-Q4-M11-W1 — VP-5634: with "Group items by staff or guest" OFF,
 * a Card receipt prints each service at its fee-inclusive price (= customer
 * display), lines sum to Subtotal; Cash prints the plain price.
 *
 * No card is charged: Print is pressed on the Card panel BEFORE Complete Payment,
 * and the receipt is read from the print job the app sends (no printer needed).
 */
import { expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import {
  buildOrder,
  capturePrint,
  click,
  completePayment,
  customerText,
  deleteDraft,
  methodCents,
  noReceipt,
  openCheckout,
  pickMethod,
  receiptAmount,
  receiptItems,
} from '../../../src/features/pos.js';
import { openSettings, switchState } from '../../../src/features/settings.js';
import { itNeeds, noteSkip } from '../../../src/features/spec.js';

const d = profile().data;
const drafts: string[] = [];
let grouped: boolean | null = null;

describe(`[${profile().target}] M11-W1 VP-5634 Receipt prints fee-inclusive prices (group OFF)`, () => {
  before(async () => {
    await openSettings('receipt');
    grouped = await switchState('Group items by staff or guest');
  });
  after(async () => {
    for (const c of drafts) await deleteDraft(c);
  });

  it('TC-VP5634-00 Store prints ungrouped (the ticket case)', function () {
    if (grouped !== false) {
      noteSkip(
        this.test?.title ?? '',
        'store prints receipts grouped by staff — the ungrouped branch needs a Receipt setting change',
      );
      this.skip();
    }
    expect(grouped).toBe(false);
  });

  itNeeds(
    ['writes'],
    'TC-VP5634-02/03 Card panel Print: lines include the fee, sum to Subtotal, match the customer display',
    async () => {
      const code = await buildOrder([[d.staffA, [d.svc25, d.svc25b]]]);
      drafts.push(code);
      await openCheckout();
      const card = await methodCents('Card');
      const cash = await methodCents('Cash');
      await pickMethod('Card');
      const text = await capturePrint(() => click('Print', { scope: 'main' }));
      const items = receiptItems(text);
      expect(items.length).toBe(2);
      const sum = items.reduce((s, i) => s + i.cents, 0);
      expect(sum).toBe(receiptAmount(text, 'Subtotal'));
      expect(receiptAmount(text, 'Total')).toBe(card);
      if (card > cash) for (const i of items) expect(i.cents).toBeGreaterThan(2500);
      expect(text).not.toMatch(/^Staff:/m);
      const cust = await customerText();
      for (const i of items) expect(cust).toContain(`$${(i.cents / 100).toFixed(2)}`);
    },
  );

  itNeeds(['writes'], 'TC-VP5634-04/06 Cash panel and paid-cash receipt print the plain price', async () => {
    await pickMethod('Cash');
    const panel = await capturePrint(() => click('Print', { scope: 'main' }));
    expect(receiptItems(panel).map((i) => i.cents)).toEqual([2500, 2500]);
    expect((await completePayment('No Tip')).result).toBe('success');
    const paid = await capturePrint(() => click('Print'));
    expect(receiptItems(paid).map((i) => i.cents)).toEqual([2500, 2500]);
    expect(paid).toContain('Paid with:');
    await noReceipt();
    drafts.pop();
  });

  itNeeds(
    ['writes'],
    'TC-VP5634-05 Two staff, Card panel Print: no staff names, both lines include the fee',
    async () => {
      const code = await buildOrder([
        [d.staffA, [d.svc25]],
        [d.staffB, [d.svc25b]],
      ]);
      drafts.push(code);
      await openCheckout();
      await pickMethod('Card');
      const text = await capturePrint(() => click('Print', { scope: 'main' }));
      const items = receiptItems(text);
      expect(items.length).toBe(2);
      expect(items.reduce((s, i) => s + i.cents, 0)).toBe(receiptAmount(text, 'Subtotal'));
      expect(text).not.toContain(d.staffA);
      expect(text).not.toContain(d.staffB);
    },
  );
});
