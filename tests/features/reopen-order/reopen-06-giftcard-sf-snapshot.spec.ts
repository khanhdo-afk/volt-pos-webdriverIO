/**
 * VP-4077 — Re-Open prices an order by the "Gift Card Top Up Service Fee" toggle
 * SAVED ON THE ORDER (userInput.applyServiceFeeToGiftCardAtSale), not the live one.
 *
 *   RG-01  sell (top-up $25) under the live toggle X: the order saves X
 *   RG-02  flip the Portal toggle to !X; Re-Open with no edit → owes $0.00, total kept
 *   RG-03  Re-Open + a service: the gift-card line keeps its sale price; the
 *          difference is only the new service (Card/Cash by the store's rates)
 *   RG-04  sell a second order under !X, put the toggle back to X, lower its total →
 *          Void All → the re-quote prices the gift card by the order's !X
 *
 * The toggle is changed on the Portal (PortalStore over CDP) and ALWAYS restored.
 * Needs a signed-in Portal profile (PORTAL_PROFILE_DIR) — otherwise SKIP with the reason.
 * Orders are cancelled in `after` (cancel reverts the top-ups).
 */
import { expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import {
  completePayment,
  gql,
  mainText,
  noReceipt,
  openCheckout,
  orderByCode,
  pickMethod,
  reopen,
} from '../../../src/features/pos.js';
import {
  addGiftCardTopUp,
  addLinesBySearch,
  cancelOrder,
  checkoutQuote,
  confirmVoidAll,
  editOrder,
  expectedQuote,
  lineDiscount,
  newOrder,
  orderMoney,
  payFromEditor,
  pickService,
  reopenDoneClean,
  settleCash,
  storeRates,
  type CatalogItem,
  type StoreRates,
} from '../../../src/features/reopen.js';
import { itNeeds, noteSkip } from '../../../src/features/spec.js';
import { PortalStore } from '../../../src/support/portal/portalStore.js';

const d = profile().data;
const portal = new PortalStore();
const created: string[] = [];
let svc: CatalogItem | undefined;
let rates: StoreRates;
let live = false;
let a = { code: '', id: '', total: 0 };

async function liveToggle(): Promise<boolean> {
  const r = await gql<{ sysSettingList: { value: string | null }[] }>(
    'query{ sysSettingList(where:{key:{eq:"merchant_gift_card_top_up_service_fee"}}){ value } }',
  );
  const v = r.sysSettingList[0]?.value;
  return v === '1' || v === 'true';
}

async function topUpOrder(): Promise<{ code: string; id: string; total: number }> {
  const code = await newOrder(d.staffA, [(svc as CatalogItem).name]);
  await addGiftCardTopUp(d.giftCardActive, '$25');
  await openCheckout();
  await pickMethod('Cash');
  expect((await completePayment('No Tip')).result).toBe('success');
  await noReceipt();
  const o = await orderByCode(code);
  created.push(o?.id ?? '');
  return { code, id: o?.id ?? '', total: o?.total ?? 0 };
}

/** Card price of a $25 top-up line under a given toggle. */
const gcLine = (on: boolean): number => (on ? 2500 + Math.round((2500 * rates.sf) / 100) : 2500);
const gcLineOnScreen = async (): Promise<number | null> => {
  const m = (await mainText()).match(/Gift Card \[[^\]]*\]\n\$([\d.,]+)/);
  return m?.[1] ? Math.round(Number(m[1].replace(/,/g, '')) * 100) : null;
};

describe(`[${profile().target}] Reopen — gift-card SF toggle snapshot (VP-4077)`, () => {
  before(async function () {
    svc = await pickService(4000);
    rates = await storeRates();
    if (!svc || !d.giftCardActive) {
      noteSkip(
        this.test?.title ?? '',
        `store ${profile().store} has no service ≥ $40 or no active gift card`,
      );
      this.skip();
    }
  });
  after(async () => {
    await portal.restore().catch((e: Error) => console.warn(`[cleanup] portal restore: ${e.message}`));
    for (const id of created)
      if (id) await cancelOrder(id).catch((e: Error) => console.warn(`[cleanup] ${e.message}`));
  });

  itNeeds(
    ['writes'],
    'RG-01 (VP-4077) A top-up order saves the live gift-card SF toggle',
    async () => {
      live = await liveToggle();
      a = await topUpOrder();
      const m = await orderMoney(a.code);
      expect(m.userInput.applyServiceFeeToGiftCardAtSale).toBe(live);
    },
    ['staffA', 'giftCardActive'],
  );

  itNeeds(
    ['writes', 'settings'],
    'RG-02 (VP-4077) Toggle flipped on Portal: Re-Open with no edit owes $0.00, total kept',
    async function () {
      if (!(await portal.available())) {
        noteSkip(
          this.test?.title ?? '',
          'Portal profile not signed in (PORTAL_PROFILE_DIR) — run `npm run portal:login`',
        );
        this.skip();
      }
      await portal.ensure({ applyServiceFeeToGiftCard: !live });
      expect(await liveToggle()).toBe(!live);
      await reopen(a.id);
      const q = await checkoutQuote();
      expect(q.card).toBe(0);
      expect(q.cash).toBe(0);
      await reopenDoneClean();
      expect((await orderMoney(a.code)).total).toBe(a.total);
    },
    ['staffA', 'giftCardActive'],
  );

  itNeeds(
    ['writes', 'settings'],
    'RG-03 (VP-4077) Re-Open + service: gift-card line keeps its sale price, difference = new service only',
    async function () {
      if ((await liveToggle()) === live) {
        noteSkip(this.test?.title ?? '', 'toggle was not flipped (RG-02 skipped)');
        this.skip();
      }
      await reopen(a.id);
      await editOrder();
      await addLinesBySearch(d.staffA, [(svc as CatalogItem).name]);
      await openCheckout();
      const q = await checkoutQuote();
      const want = expectedQuote((svc as CatalogItem).cents, rates, 'service');
      console.log(
        `[RG-03] quote ${JSON.stringify(q)} want ${JSON.stringify(want)} (sold ${String(live)}, live ${String(!live)})`,
      );
      expect(q.card).toBe(want.card);
      expect(q.cash).toBe(want.cash);
      await settleCash();
      expect((await orderMoney(a.code)).total).toBe(a.total + q.cash);
    },
    ['staffA', 'giftCardActive'],
  );

  itNeeds(
    ['writes', 'settings'],
    'RG-04 (VP-4077) Void All re-quote prices the gift card by the order toggle, not the live one',
    async function () {
      if ((await liveToggle()) === live) {
        noteSkip(this.test?.title ?? '', 'toggle was not flipped (RG-02 skipped)');
        this.skip();
      }
      const b = await topUpOrder(); // sold under !live
      expect((await orderMoney(b.code)).userInput.applyServiceFeeToGiftCardAtSale).toBe(!live);
      await portal.restore(); // live back to the original value
      expect(await liveToggle()).toBe(live);
      await reopen(b.id);
      await editOrder();
      await lineDiscount((svc as CatalogItem).name, 1000);
      expect(await payFromEditor()).toContain('void all previous transactions');
      await confirmVoidAll();
      const line = await gcLineOnScreen();
      console.log(
        `[RG-04] gift-card line ${String(line)} (order ${String(!live)} → ${String(gcLine(!live))}, live ${String(live)} → ${String(gcLine(live))})`,
      );
      if (rates.sf > 0) expect(line).toBe(gcLine(!live));
      await settleCash();
      expect((await orderMoney(b.code)).status).toBe('successful');
    },
    ['staffA', 'giftCardActive'],
  );
});
