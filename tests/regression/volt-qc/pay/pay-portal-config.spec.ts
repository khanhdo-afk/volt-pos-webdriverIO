/**
 * volt-qc 03 PAY — the cases that need a FIXED store configuration on the Portal.
 *
 * Until now these were `[MANUAL]` (pay.manual.spec.ts › "Portal / store
 * configuration"): their expected numbers only hold under one Service Fee / Cash
 * Discount / tax / tip-method setup. Each case now asks the Portal for exactly that
 * setup through {@link PortalStore.ensure} (Portal opened over CDP in the same run,
 * changed, saved, and POS waited on until it reads the new values), and the
 * describe's `after` puts every touched setting back.
 *
 * Source TCs: docs/qc/volt-qc/windows-regression/03-checkout-thanh-toan.md
 * (PAY-063, 067, 079, 082, 083, 084, 085, 087, 088, 091, 093, 099, 100, 101).
 *
 * Lines are Quick Pay lines (the docs build them that way) except PAY-087/088,
 * which need per-line discounts — Quick Pay has no line editor, so those use
 * catalogue services re-priced in the cart editor. PAY-099/100/101 describe a
 * PRODUCT line; Product and Service tax are set to the same rate, so the Quick Pay
 * line runs the same arithmetic.
 *
 * Store-wide → `@exclusive`. CREATES DATA (drafts; PAY-079 completes one Other
 * payment). dev / staging only.
 */

import { expect } from '@wdio/globals';
import { Timeouts } from '../../../../configs/constants/timeouts.js';
import { assertWritesAllowed } from '../../../../configs/env/loadEnv.js';
import { checkoutPage, homePage, paymentSuccessPage } from '../../../../src/pages/index.js';
import {
  P,
  checkoutState,
  cleanTill,
  completeUntilCustomerTip,
  isTipEnabled,
  methodAmounts,
  noReceipt,
  setCashierTip,
} from '../../../../src/pages/voltqc/pay/payProbe.js';
import {
  gcAdd,
  gcEnterCode,
  gcQuick,
  openSellGiftCard,
} from '../../../../src/pages/voltqc/pos/giftCardProbe.js';
import { giftCard } from '../../../../src/data/static/paymentMethods.js';
import { settle } from '../../../../src/helpers/wait.js';
import { PortalStore, type PortalWant } from '../../../../src/support/portal/portalStore.js';
import { Tag, title } from '../../../../src/types/testTags.js';
import { voidAnyDraft } from '../../order-flow/charge-matrix.helpers.js';

const portal = new PortalStore();

/** No tax, tip on every method — the baseline each fee case starts from. */
const NO_TAX = { productTaxPct: 0, serviceTaxPct: 0 } as const;

/** Empty till → staff → one Quick Pay line per amount → Pay → checkout. */
async function quickPayCheckout(cents: number[]): Promise<void> {
  await voidAnyDraft();
  await homePage.selectStaffByIndex(0);
  for (const [i, c] of cents.entries()) {
    await homePage.openQuickPay();
    await homePage.addQuickPayItem(c, { name: `E2E PCFG ${String(i + 1)}` });
    await settle(400);
  }
  await homePage.pressPay();
  await checkoutPage.waitForReady();
}

/** Empty till → staff → catalogue services re-priced (and % discounted) in the cart editor → checkout. */
async function pricedServiceCheckout(lines: Array<{ cents: number; discountPct?: number }>): Promise<void> {
  await voidAnyDraft();
  await homePage.selectStaffByIndex(0);
  const count = await homePage.visibleServiceCount();
  for (const [i] of lines.entries()) await homePage.addServiceByIndex(i % Math.max(count, 1));
  for (const [i, line] of lines.entries()) {
    await homePage.openServiceEditor(i);
    await homePage.setServiceEditorPrice(line.cents);
    if (line.discountPct) {
      if (!(await homePage.isItemDiscountOn())) await homePage.toggleItemDiscount();
      await homePage.setItemDiscount(String(line.discountPct));
    }
    await homePage.saveServiceEditor();
  }
  await homePage.pressPay();
  await checkoutPage.waitForReady();
}

async function sellGiftCardLine(label: '$50' | '$25'): Promise<void> {
  await openSellGiftCard();
  await gcEnterCode(giftCard.code);
  await P.clickQ(gcQuick(label));
  await P.clickQ(gcAdd);
  await settle(800);
}

describe('volt-qc 03 PAY — Portal store configuration', function () {
  this.timeout(Timeouts.MOCHA_TEST * 4);

  before(async function () {
    assertWritesAllowed('change Portal store settings and build drafts');
    if (!(await portal.available())) this.skip(); // .portal-profile signed out → npm run portal:login
  });

  after(async () => {
    await cleanTill().catch(() => undefined);
    await portal.restore();
  });

  afterEach(async () => {
    if (await paymentSuccessPage.isActive().catch(() => false)) await noReceipt().catch(() => undefined);
    await cleanTill();
  });

  const fee = (want: PortalWant) => portal.ensure({ ...NO_TAX, applyServiceFeeToGiftCard: false, ...want });

  it(
    title(
      'Ticket example: Service $75, SF 2.5%, Tip $15 ⇒ $91.88 (PAY-067)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
    ),
    async () => {
      await fee({ serviceFeePct: 2.5, cashDiscountPct: 2.5, tipActive: true, tipOnCard: true });
      await quickPayCheckout([7_500]);
      await checkoutPage.selectTender('card');
      expect(await isTipEnabled()).toBe(true);
      await setCashierTip(['1', '5', '0', '0']);
      expect((await methodAmounts()).Card).toBe(9_188);
    },
  );

  it(
    title(
      'Standard example: items $100, SF 4%, CD 4% ⇒ Card $104.00, Cash/Other/Gift Card $100.00 (PAY-082)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
    ),
    async () => {
      await fee({ serviceFeePct: 4, cashDiscountPct: 4 });
      await quickPayCheckout([10_000]);
      const a = await methodAmounts();
      expect(a.Card).toBe(10_400);
      expect(a.Cash).toBe(10_000);
      expect(a.Other).toBe(10_000);
      expect(a['Gift Card']).toBe(10_000);
    },
  );

  it(
    title(
      'SF on net, tax on net + SF: $100, SF 5%, tax 10% ⇒ Card $115.50, Cash $110.00 (PAY-083)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
    ),
    async () => {
      await fee({ serviceFeePct: 5, cashDiscountPct: 5, productTaxPct: 10, serviceTaxPct: 10 });
      await quickPayCheckout([10_000]);
      const a = await methodAmounts();
      expect(a.Card).toBe(11_550);
      expect(a.Cash).toBe(11_000);
      expect(a.Other).toBe(11_000);
    },
  );

  it(
    title(
      '2 × $100 by Card, SF 5%, tax 10% ⇒ Subtotal $210, Tax $21, Total $231 (PAY-084)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
    ),
    async () => {
      await fee({ serviceFeePct: 5, cashDiscountPct: 5, productTaxPct: 10, serviceTaxPct: 10 });
      await quickPayCheckout([10_000, 10_000]);
      await checkoutPage.selectTender('card');
      const s = await checkoutState();
      expect(s.subtotal).toBe(21_000);
      expect(s.tax).toBe(2_100);
      expect((await methodAmounts()).Card).toBe(23_100);
    },
  );

  it(
    title(
      'SF/CD rounding over several odd-cent items lands on whole cents for Card and Cash (PAY-085)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
    ),
    async () => {
      await fee({ serviceFeePct: 3, cashDiscountPct: 3 });
      await quickPayCheckout([1_001, 2_002, 99]);
      const a = await methodAmounts();
      expect(a.Card).toBe(3_195);
      expect(a.Cash).toBe(3_102);
    },
  );

  it(
    title(
      'Service Fee doc example: S1 $5 (−10%), S2 $17 (−50%), SF 10% ⇒ fee $1.30 (PAY-087)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
    ),
    async () => {
      await fee({ serviceFeePct: 10, cashDiscountPct: 10 });
      await pricedServiceCheckout([
        { cents: 500, discountPct: 10 },
        { cents: 1_700, discountPct: 50 },
      ]);
      // Fee base 450 + 850 = 1300 → SF 130 → Card 1430.
      expect((await methodAmounts()).Card).toBe(1_430);
      expect((await methodAmounts()).Cash).toBe(1_300);
    },
  );

  it(
    title(
      'A 100%-discounted item adds nothing to the fee base (PAY-088)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
    ),
    async () => {
      await fee({ serviceFeePct: 10, cashDiscountPct: 10 });
      await pricedServiceCheckout([{ cents: 2_000 }, { cents: 2_000, discountPct: 100 }]);
      // Base 2000 → SF 200 → Card 2200; the free line contributes 0.
      expect((await methodAmounts()).Card).toBe(2_200);
      expect((await methodAmounts()).Cash).toBe(2_000);
    },
  );

  it(
    title(
      'Ticket example: Service $100 + Gift Card $50, SF 5% ⇒ SF $5.00 (PAY-091)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
    ),
    async function () {
      if (giftCard.code === '') this.skip(); // no sellable gift card configured for this store
      await fee({ serviceFeePct: 5, cashDiscountPct: 5, applyServiceFeeToGiftCard: false });
      await voidAnyDraft();
      await homePage.selectStaffByIndex(0);
      await homePage.openQuickPay();
      await homePage.addQuickPayItem(10_000, { name: 'E2E PCFG GC' });
      await sellGiftCardLine('$50');
      await homePage.pressPay();
      await checkoutPage.waitForReady();
      expect((await methodAmounts()).Card).toBe(15_500);
    },
  );

  it(
    title(
      'With Apply Service Fee to Gift Card ON, gift card sales carry SF/CD (PAY-093)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
    ),
    async function () {
      if (giftCard.code === '') this.skip(); // no sellable gift card configured for this store
      await fee({ serviceFeePct: 3, cashDiscountPct: 3, applyServiceFeeToGiftCard: true });
      await voidAnyDraft();
      await homePage.selectStaffByIndex(0);
      await sellGiftCardLine('$50');
      await homePage.pressPay();
      await checkoutPage.waitForReady();
      expect((await methodAmounts()).Card).toBe(5_150);
    },
  );

  it(
    title(
      'Per-line tax allocation never goes negative: 6 × $0.15 at 10% ⇒ Cash $0.99 (PAY-099)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
    ),
    async () => {
      await fee({ serviceFeePct: 3, cashDiscountPct: 3, productTaxPct: 10, serviceTaxPct: 10 });
      await quickPayCheckout([15, 15, 15, 15, 15, 15]);
      await checkoutPage.selectTender('cash');
      const s = await checkoutState();
      expect(s.tax).toBeGreaterThanOrEqual(0);
      expect((await methodAmounts()).Cash).toBe(99);
    },
  );

  it(
    title(
      'Variant price sets still produce correct, non-negative tax (PAY-100)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
    ),
    async () => {
      await fee({ serviceFeePct: 3, cashDiscountPct: 3, productTaxPct: 10, serviceTaxPct: 10 });
      await quickPayCheckout([15, 15, 15, 5]);
      expect((await methodAmounts()).Cash).toBe(55);
      await cleanTill();
      await quickPayCheckout(Array.from({ length: 10 }, () => 15));
      expect((await methodAmounts()).Cash).toBe(165);
    },
  );

  it(
    title(
      '1-cent fixture: SF 4%, CD 3.5%, tax 8.25%, $19.00 by Cash ⇒ Tax $1.58 / Total $20.67 (PAY-101)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
    ),
    async () => {
      await fee({ serviceFeePct: 4, cashDiscountPct: 3.5, productTaxPct: 8.25, serviceTaxPct: 8.25 });
      await quickPayCheckout([1_900]);
      await checkoutPage.selectTender('cash');
      const s = await checkoutState();
      expect(s.tax).toBe(158);
      expect((await methodAmounts()).Cash).toBe(2_067);
    },
  );

  it(
    title(
      'A method left out of Tip Settings gets tip 0 and a disabled Tip button (PAY-063)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
    ),
    async () => {
      await portal.ensure({
        tipActive: true,
        tipOnCard: true,
        tipOnCash: true,
        tipOnOther: false,
        tipOnGiftCard: false,
      });
      await quickPayCheckout([2_000]);
      await checkoutPage.selectTender('cash');
      expect(await isTipEnabled()).toBe(true);
      await setCashierTip(['5', '0', '0']);
      expect((await checkoutState()).tip).toBe(500);
      await checkoutPage.selectTender('other');
      await settle(600);
      expect(await isTipEnabled()).toBe(false);
      expect((await checkoutState()).tip).toBe(0);
    },
  );

  it(
    title(
      'A method not allowed to tip does not push the tip screen and completes at once (PAY-079)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
      Tag.PAYMENT,
    ),
    async () => {
      await portal.ensure({ tipActive: true, tipOnOther: false });
      await quickPayCheckout([1_000]);
      await checkoutPage.selectTender('other');
      // false = reached payment-success without the customer tip handoff.
      expect(await completeUntilCustomerTip()).toBe(false);
    },
  );
});
