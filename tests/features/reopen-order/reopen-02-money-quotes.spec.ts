/**
 * Re-Open money formulas on the store's own rates (Cash only — the Card amount is
 * READ from the checkout button, never charged here; the real card charge lives in
 * tests/features/zz-card):
 *
 *   VP-3957  Re-Open + service: Card = (Δ + SF) + tax  (was $1 off with SF + tax)
 *   VP-4012  order paid Cash → Re-Open → Card tax base includes SF; Card agrees with Cash/Other
 *   VP-4079  Re-Open + PRODUCT: product tax applied to the Card amount
 *   VP-3931 / VP-4013  Cash difference = Δ + tax, no stray cents; order total = old + difference
 *
 * Uses a service ≥ $40 so a $1 or 1% formula error cannot hide in rounding.
 * Every order is cancelled in `after`.
 */
import { expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import {
  noReceipt,
  openCheckout,
  orderByCode,
  pickMethod,
  completePayment,
  reopen,
} from '../../../src/features/pos.js';
import {
  addLinesBySearch,
  cancelOrder,
  checkoutQuote,
  editOrder,
  expectedQuote,
  newOrder,
  orderMoney,
  pickProduct,
  pickService,
  settleCash,
  storeRates,
  type CatalogItem,
  type StoreRates,
} from '../../../src/features/reopen.js';
import { itNeeds, noteSkip } from '../../../src/features/spec.js';

const d = profile().data;
const created: string[] = [];
let rates: StoreRates;
let big: CatalogItem | undefined;
let product: CatalogItem | undefined;

/** New Cash order with `items` for staffA; returns its code + id and the paid total. */
async function paidCashOrder(items: string[]): Promise<{ code: string; id: string; total: number }> {
  const code = await newOrder(d.staffA, items);
  await openCheckout();
  await pickMethod('Cash');
  expect((await completePayment('No Tip')).result).toBe('success');
  await noReceipt();
  const o = await orderByCode(code);
  created.push(o?.id ?? '');
  return { code, id: o?.id ?? '', total: o?.total ?? 0 };
}

describe(`[${profile().target}] Reopen — money of the added item (VP-3957/4012/4079/3931/4013)`, () => {
  before(async function () {
    rates = await storeRates();
    big = await pickService(4000);
    product = await pickProduct(100);
    console.log(
      `[reopen-02] rates ${JSON.stringify(rates)} · service ${big?.name ?? '-'} · product ${product?.name ?? '-'}`,
    );
    if (!big) {
      noteSkip(this.test?.title ?? '', `store ${profile().store} has no active service ≥ $40`);
      this.skip();
    }
  });
  after(async () => {
    for (const id of created)
      if (id) await cancelOrder(id).catch((e: Error) => console.warn(`[cleanup] ${e.message}`));
  });

  itNeeds(
    ['writes'],
    'RM-01 (VP-3957/4012/3931/4013) Cash order → Re-Open + service: Card and Cash quotes follow SF + tax',
    async () => {
      const svc = big as CatalogItem;
      const o = await paidCashOrder([svc.name, svc.name]);
      expect(await reopen(o.id)).toContain('One edit of items, prices left');
      await editOrder();
      await addLinesBySearch(d.staffA, [svc.name]);
      await openCheckout();
      const q = await checkoutQuote();
      const want = expectedQuote(svc.cents, rates, 'service');
      console.log(`[RM-01] quote ${JSON.stringify(q)} want ${JSON.stringify(want)}`);
      expect(q.card).toBe(want.card);
      expect(q.cash).toBe(want.cash);
      expect(q.other).toBe(want.cash);
      await settleCash();
      const m = await orderMoney(o.code);
      expect(m.status).toBe('successful');
      expect(m.total).toBe(o.total + q.cash);
      expect(m.userInput.reopenEditCount).toBe(1);
    },
  );

  itNeeds(
    ['writes'],
    'RM-02 (VP-4079) Re-Open + PRODUCT: Card quote carries the product tax',
    async function () {
      if (!product) {
        noteSkip(this.test?.title ?? '', `store ${profile().store} has no active priced product`);
        this.skip();
      }
      const p = product;
      if (!p) return;
      const svc = big as CatalogItem;
      const o = await paidCashOrder([svc.name]);
      await reopen(o.id);
      await editOrder();
      await addLinesBySearch(d.staffA, [p.name]);
      await openCheckout();
      const q = await checkoutQuote();
      const want = expectedQuote(p.cents, rates, 'product');
      console.log(`[RM-02] quote ${JSON.stringify(q)} want ${JSON.stringify(want)}`);
      expect(q.card).toBe(want.card);
      expect(q.cash).toBe(want.cash);
      // With a product tax rate the Card amount is strictly above the untaxed base.
      if (rates.productTax > 0)
        expect(q.card).toBeGreaterThan(p.cents + Math.round((p.cents * rates.sf) / 100));
      await settleCash();
      const m = await orderMoney(o.code);
      expect(m.total).toBe(o.total + q.cash);
    },
  );
});
