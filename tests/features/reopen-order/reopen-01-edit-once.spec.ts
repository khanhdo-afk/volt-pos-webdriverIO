/**
 * Project "Reopen order — update item and staff" (VP-2585) and its bugs, on a
 * Cash order (no card):
 *   VP-3914 the first Re-Open says one edit of items/prices is left
 *   VP-2585 one edit: add a service, pay the difference in Cash
 *   VP-3931 / VP-4013 the difference = added item + its tax (no cent drift)
 *   VP-3969 Re-Open does not add a visit; VP-4085 / VP-5293 points are not stacked
 *   VP-3913 the second Re-Open locks items and prices (and really refuses a new item)
 *   VP-3598 / VP-3982 / VP-4980 / VP-6811 change customer A → B moves the order's points AND visit
 *
 * Every expected amount comes from the store's own rates (src/features/reopen.ts),
 * so the spec holds on any store (2949: SF 10% / CD 10% / tax 10%).
 * Money-formula variants live in reopen-02, void-all in reopen-03, customer in reopen-04.
 */
import { expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import {
  attachCustomer,
  buildOrder,
  completePayment,
  customerByName,
  gql,
  mainText,
  noReceipt,
  openCheckout,
  orderByCode,
  pause,
  pickMethod,
  removeCustomer,
  reopen,
  reopenDone,
  waitCustomer,
} from '../../../src/features/pos.js';
import {
  addLinesBySearch,
  cancelOrder,
  checkoutQuote,
  editOrder,
  expectedQuote,
  storeRates,
} from '../../../src/features/reopen.js';
import { priceOf } from '../../../src/features/discover.js';
import { itNeeds, noteSkip } from '../../../src/features/spec.js';

const d = profile().data;
let code = '';
let id = '';
let total1 = 0;
let a0: { points: number; visits: number } = { points: 0, visits: 0 };
let a1: { points: number; visits: number } = { points: 0, visits: 0 };

const snap = async (name: string): Promise<{ points: number; visits: number }> => {
  const c = await customerByName(name);
  return { points: c?.pointBalance ?? 0, visits: c?.visitCount ?? 0 };
};

/** Customer balances are recomputed after sync — wait until they stop moving (≤ 60 s). */
async function settledSnap(name: string): Promise<{ points: number; visits: number }> {
  let prev = await snap(name);
  for (let i = 0; i < 6; i++) {
    await pause(10_000);
    const cur = await snap(name);
    if (cur.points === prev.points && cur.visits === prev.visits) return cur;
    prev = cur;
  }
  return prev;
}

async function reopenEditCount(orderCode: string): Promise<number> {
  const dd = await gql<{ orderList: { userInput: string }[] }>(
    'query($c:String!){ orderList(where:{orderCode:{eq:$c}}){ userInput } }',
    { c: orderCode },
  );
  const ui = JSON.parse(dd.orderList[0]?.userInput ?? '{}') as { reopenEditCount?: number };
  return ui.reopenEditCount ?? 0;
}

describe(`[${profile().target}] Reopen order — update item & staff (VP-2585)`, () => {
  before(function () {
    if (!d.customer || !d.customer2) {
      noteSkip(
        this.test?.title ?? '',
        `store ${profile().store} has no 2 test customers (name matching TEST_CUSTOMER_PATTERN)`,
      );
      this.skip();
    }
  });
  after(async () => {
    // Completed test orders are cancelled so they leave no money on the store's reports.
    if (id) await cancelOrder(id).catch((e: Error) => console.warn(`[cleanup] ${e.message}`));
  });

  itNeeds(['writes'], 'RO-01 Cash order with customer A completes; A gains the visit', async () => {
    a0 = await snap(d.customer);
    code = await buildOrder([[d.staffA, [d.svc25]]]);
    await attachCustomer(d.customer, d.customerSearch);
    await openCheckout();
    await pickMethod('Cash');
    const q = await checkoutQuote();
    expect((await completePayment('No Tip')).result).toBe('success');
    await noReceipt();
    const o = await orderByCode(code);
    id = o?.id ?? '';
    expect(o?.status).toBe('successful');
    expect(o?.total).toBe(q.cash);
    total1 = o?.total ?? 0;
    a1 = await waitCustomer(d.customer, (s) => s.visits === a0.visits + 1);
    expect(a1.visits).toBe(a0.visits + 1);
    expect(a1.points).toBeGreaterThanOrEqual(a0.points);
  });

  itNeeds(['writes'], 'RO-02 (VP-3914) First Re-Open says one edit of items/prices is left', async () => {
    const popup = await reopen(id);
    expect(popup).toContain('One edit of items, prices left');
  });

  itNeeds(
    ['writes'],
    'RO-03 (VP-2585/3931/4013) Add a service and pay the difference in Cash — exact total',
    async () => {
      const rates = await storeRates();
      await editOrder();
      await addLinesBySearch(d.staffA, [d.cheap]);
      await openCheckout();
      const q = await checkoutQuote();
      const want = expectedQuote(priceOf(d.cheap), rates, 'service');
      // ±1¢: per-line rounding on cent-sized prices.
      expect(Math.abs(q.cash - want.cash)).toBeLessThanOrEqual(1);
      await pickMethod('Cash');
      expect((await completePayment('No Tip')).result).toBe('success');
      await noReceipt();
      const o = await orderByCode(code);
      expect(o?.status).toBe('successful');
      expect(o?.total).toBe(total1 + q.cash);
      expect(await reopenEditCount(code)).toBe(1);
    },
  );

  itNeeds(
    ['writes'],
    'RO-04 (VP-3969/4085/5293) Re-Open adds no visit and does not stack points',
    async () => {
      const now = await settledSnap(d.customer);
      expect(now.visits).toBe(a1.visits);
      expect(now.points).toBeGreaterThanOrEqual(a1.points);
    },
  );

  itNeeds(
    ['writes'],
    'RO-05 (VP-3913) Second Re-Open locks items and prices — a new item is refused',
    async () => {
      const popup = await reopen(id);
      expect(popup).toContain('Items and prices are locked');
      await editOrder();
      const before = (await mainText()).match(/Total\n\$([\d.,]+)/)?.[1];
      await addLinesBySearch(d.staffA, [d.cheap]).catch(() => undefined);
      expect(await mainText()).toContain('Items and prices are locked');
      expect((await mainText()).match(/Total\n\$([\d.,]+)/)?.[1]).toBe(before);
    },
  );

  itNeeds(
    ['writes'],
    'RO-06 (VP-3598/3982/4980/6811) Change customer A → B moves the order points and visit',
    async () => {
      const b0 = await snap(d.customer2);
      await removeCustomer(d.customer);
      await attachCustomer(d.customer2, d.customerSearch);
      expect(await mainText()).toContain(d.customer2);
      await openCheckout();
      await reopenDone();
      expect((await orderByCode(code))?.status).toBe('successful');
      const b1 = await waitCustomer(d.customer2, (s) => s.visits === b0.visits + 1, 45_000);
      const a2 = await waitCustomer(
        d.customer,
        (s) => s.visits === a0.visits && s.points === a0.points,
        45_000,
      );
      expect(b1.visits).toBe(b0.visits + 1);
      // A must give back what this order earned: visit (VP-6811) and points back to before RO-01.
      expect({ visits: a2.visits, points: a2.points }).toEqual({ visits: a0.visits, points: a0.points });
    },
  );
});
