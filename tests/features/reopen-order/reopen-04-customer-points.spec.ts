/**
 * Loyalty on Re-Open (Cash, test customer A):
 *
 *   RC-01  pay with A → A +N points, +1 visit
 *   RC-02 (VP-4085 / VP-5293 / VP-3969)  Re-Open, add the same service again, pay the
 *          difference → the old earn is revoked and the new total earned once:
 *          A = before + 2N points, still +1 visit (one order = one visit)
 *   RC-03 (VP-3726)  Re-Open again, REMOVE the customer, Re-Open Done →
 *          A gives back everything this order earned (points back to before)
 *
 * Points/visits are read from the till's customer row, polled until the server
 * sync settles. The order is cancelled in `after`.
 */
import { expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import {
  attachCustomer,
  completePayment,
  noReceipt,
  openCheckout,
  orderByCode,
  pickMethod,
  removeCustomer,
  reopen,
  reopenDone,
  waitCustomer,
} from '../../../src/features/pos.js';
import {
  addLinesBySearch,
  cancelOrder,
  customerRow,
  editOrder,
  newOrder,
  orderMoney,
  pickService,
  settleCash,
  type CatalogItem,
} from '../../../src/features/reopen.js';
import { itNeeds, noteSkip } from '../../../src/features/spec.js';

const d = profile().data;
let svc: CatalogItem | undefined;
let code = '';
let id = '';
let p0 = { points: 0, visits: 0 };
let p1 = { points: 0, visits: 0 };
let earned = 0;

describe(`[${profile().target}] Reopen — customer points & visits (VP-4085/5293/3969/3726)`, () => {
  before(async function () {
    svc = await pickService(4000);
    if (!svc || !d.customer) {
      noteSkip(this.test?.title ?? '', `store ${profile().store} has no service ≥ $40 or no test customer`);
      this.skip();
    }
  });
  after(async () => {
    if (id) await cancelOrder(id).catch((e: Error) => console.warn(`[cleanup] ${e.message}`));
  });

  itNeeds(['writes'], 'RC-01 Cash order with customer A: A earns points and one visit', async () => {
    p0 = (await customerRow(d.customer)) ?? p0;
    code = await newOrder(d.staffA, [(svc as CatalogItem).name]);
    await attachCustomer(d.customer, d.customerSearch);
    await openCheckout();
    await pickMethod('Cash');
    expect((await completePayment('No Tip')).result).toBe('success');
    await noReceipt();
    id = (await orderByCode(code))?.id ?? '';
    p1 = await waitCustomer(d.customer, (s) => s.visits === p0.visits + 1 && s.points > p0.points, 75_000);
    earned = p1.points - p0.points;
    console.log(
      `[RC-01] ${d.customer} ${JSON.stringify(p0)} → ${JSON.stringify(p1)} (earned ${String(earned)})`,
    );
    expect(p1.visits).toBe(p0.visits + 1);
    expect(earned).toBeGreaterThan(0);
  });

  itNeeds(
    ['writes'],
    'RC-02 (VP-4085/5293/3969) Re-Open + same service again: old earn revoked, new total earned once, no extra visit',
    async () => {
      await reopen(id);
      await editOrder();
      await addLinesBySearch(d.staffA, [(svc as CatalogItem).name]);
      await openCheckout();
      await settleCash();
      expect((await orderMoney(code)).status).toBe('successful');
      const want = p0.points + 2 * earned;
      const p2 = await waitCustomer(d.customer, (s) => s.points === want, 75_000);
      console.log(
        `[RC-02] ${d.customer} → ${JSON.stringify(p2)} (want points ${String(want)}, visits ${String(p1.visits)})`,
      );
      expect(p2.points).toBe(want);
      expect(p2.visits).toBe(p1.visits);
    },
  );

  itNeeds(
    ['writes'],
    'RC-03 (VP-3726) Re-Open, remove the customer: everything this order earned is revoked',
    async () => {
      await reopen(id);
      await editOrder();
      await removeCustomer(d.customer);
      await openCheckout();
      await reopenDone();
      const o = await orderMoney(code);
      expect(o.status).toBe('successful');
      expect(o.customerId).toBeNull();
      const p3 = await waitCustomer(d.customer, (s) => s.points === p0.points, 75_000);
      console.log(`[RC-03] ${d.customer} → ${JSON.stringify(p3)} (want points ${String(p0.points)})`);
      expect(p3.points).toBe(p0.points);
    },
  );
});
