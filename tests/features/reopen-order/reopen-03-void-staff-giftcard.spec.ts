/**
 * Re-Open on Cash orders — the "lower total" and "non-money" branches of VP-2585:
 *
 *   RV-01 (VP-2585 §3)  lower the total → "Void Order Transactions" → Confirm Void →
 *                       Total Paid $0.00 → pay again; old payment Voided, new one Successful,
 *                       order total = new total, one edit used
 *   RV-02 (VP-2585 §2 / VP-4364)  change staff on Re-Open: staff moves, total unchanged,
 *                       no new payment, the edit is NOT used up
 *   RV-03 (VP-6822)     order that TOPS UP a gift card, lower the total → void → pay again:
 *                       the card must still hold the top-up the customer paid for
 *
 * Orders are cancelled in `after` (a cancel also reverts a gift-card top-up).
 */
import { expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import {
  mainText,
  noReceipt,
  openCheckout,
  openHistoryOrder,
  orderByCode,
  pause,
  pickMethod,
  completePayment,
  reopen,
} from '../../../src/features/pos.js';
import {
  addGiftCardTopUp,
  cancelOrder,
  changeStaff,
  checkoutQuote,
  confirmVoidAll,
  editOrder,
  giftCardHistory,
  lineDiscount,
  newOrder,
  orderMoney,
  payFromEditor,
  pickService,
  reopenDoneClean,
  settleCash,
  type CatalogItem,
} from '../../../src/features/reopen.js';
import { itNeeds, noteSkip } from '../../../src/features/spec.js';

const d = profile().data;
const created: string[] = [];
let svc: CatalogItem | undefined;

async function cashOrder(
  items: string[],
  topUp?: string,
): Promise<{ code: string; id: string; total: number }> {
  const code = await newOrder(d.staffA, items);
  if (topUp) await addGiftCardTopUp(topUp, '$25');
  await openCheckout();
  await pickMethod('Cash');
  expect((await completePayment('No Tip')).result).toBe('success');
  await noReceipt();
  const o = await orderByCode(code);
  created.push(o?.id ?? '');
  return { code, id: o?.id ?? '', total: o?.total ?? 0 };
}

describe(`[${profile().target}] Reopen — void-all, staff change, gift-card top-up (VP-2585/4364/6822)`, () => {
  before(async function () {
    svc = await pickService(4000);
    if (!svc) {
      noteSkip(this.test?.title ?? '', `store ${profile().store} has no active service ≥ $40`);
      this.skip();
    }
  });
  after(async () => {
    for (const id of created)
      if (id) await cancelOrder(id).catch((e: Error) => console.warn(`[cleanup] ${e.message}`));
  });

  itNeeds(['writes'], 'RV-01 (VP-2585) Lower the total → Void All → pay again from zero', async () => {
    const s = svc as CatalogItem;
    const o = await cashOrder([s.name]);
    await reopen(o.id);
    await editOrder();
    await lineDiscount(s.name, 1000);
    const prompt = await payFromEditor();
    expect(prompt).toContain('you must void all previous transactions');
    await confirmVoidAll();
    const q = await checkoutQuote();
    expect(q.cash).toBeLessThan(o.total);
    await settleCash();
    const m = await orderMoney(o.code);
    expect(m.status).toBe('successful');
    expect(m.total).toBe(q.cash);
    expect(m.userInput.reopenEditCount).toBe(1);
    const t = await openHistoryOrder(o.id);
    expect(t).toMatch(/Voided\n\$[\d.,]+/);
    expect(t).toContain('Re-Open Order');
  });

  itNeeds(
    ['writes'],
    'RV-02 (VP-2585/4364) Change staff on Re-Open: total unchanged, no payment, edit not used',
    async () => {
      const s = svc as CatalogItem;
      const o = await cashOrder([s.name]);
      expect(await reopen(o.id)).toContain('One edit of items, prices left');
      await editOrder();
      await changeStaff(d.staffB);
      expect(await mainText()).toContain(d.staffB);
      await openCheckout();
      const q = await checkoutQuote();
      expect(q.cash).toBe(0);
      expect(q.card).toBe(0);
      await reopenDoneClean();
      const m = await orderMoney(o.code);
      expect(m.status).toBe('successful');
      expect(m.total).toBe(o.total);
      expect(m.userInput.reopenEditCount ?? 0).toBe(0);
      expect(await mainText()).toContain(`Staff: ${d.staffB}`);
    },
  );

  itNeeds(
    ['writes'],
    'RV-03 (VP-6822) Gift-card top-up survives Void All + pay again',
    async () => {
      const s = svc as CatalogItem;
      const card = d.giftCardActive;
      const h0 = await giftCardHistory(card);
      const o = await cashOrder([s.name], card);
      // The top-up row syncs back a few seconds after the payment.
      let h1 = await giftCardHistory(card);
      for (let i = 0; i < 10 && h1.balance !== h0.balance + 2500; i++) {
        await pause(3000);
        h1 = await giftCardHistory(card);
      }
      expect(h1.balance).toBe(h0.balance + 2500);
      await reopen(o.id);
      await editOrder();
      await lineDiscount(s.name, 1000);
      expect(await payFromEditor()).toContain('void all previous transactions');
      await confirmVoidAll();
      await settleCash();
      const m = await orderMoney(o.code);
      expect(m.status).toBe('successful');
      expect(await mainText()).toMatch(/Gift Card \[[^\]]*\]\n\$25\.00/);
      // The sync of the revert/top-up rows takes a few seconds.
      let h2 = await giftCardHistory(card);
      for (let i = 0; i < 8 && h2.moves.length < h1.moves.length + 1; i++) {
        await pause(5000);
        h2 = await giftCardHistory(card);
      }
      await pause(10_000);
      h2 = await giftCardHistory(card);
      console.log(`[RV-03] card moves after re-pay: ${JSON.stringify(h2.moves.slice(-3))}`);
      // The order still sells the $25 top-up and was paid for it → the card keeps it.
      expect(h2.balance).toBe(h0.balance + 2500);
    },
    ['staffA', 'giftCardActive'],
  );
});
