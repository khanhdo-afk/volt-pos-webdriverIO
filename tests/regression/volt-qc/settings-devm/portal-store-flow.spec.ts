/**
 * Store-wide tip flow and Turn on/off — cases that were `[MANUAL]` only because
 * they flip a merchant-global setting mid-day (app-rpt-set-perm-devm.manual ›
 * "Store-wide tip flow / Turn off", home-pend.manual HOME-029/030).
 *
 * Each case sets exactly what it needs on the Portal through {@link PortalStore}
 * (same run, CDP), waits for POS to read it, and the describe's `after` restores
 * every touched setting. `@exclusive`: nothing else may run on the merchant meanwhile.
 *
 * Source: docs/qc/volt-qc/windows-regression/11-settings.md (SET-062, SET-080,
 * SET-081, SET-082), 01-home (HOME-029, HOME-030).
 *
 * CREATES DATA: completes small Cash / Other orders, clocks one staff in and out.
 */

import { expect } from '@wdio/globals';
import { Timeouts } from '../../../../configs/constants/timeouts.js';
import { assertWritesAllowed } from '../../../../configs/env/loadEnv.js';
import {
  completeCustomerTipIfPrompted,
  goToOrderHistory,
  returnToHome,
} from '../../../../src/flows/index.js';
import {
  checkoutPage,
  homePage,
  orderHistoryDetailPage,
  orderHistoryPage,
  paymentSuccessPage,
} from '../../../../src/pages/index.js';
import { cardTurn, withTurnStaff } from '../../../../src/pages/voltqc/appt-time-turn/turnKit.js';
import {
  cleanTill,
  completeToSuccess,
  completeUntilCustomerTip,
  customerText,
  noReceipt,
  waitSuccess,
} from '../../../../src/pages/voltqc/pay/payProbe.js';
import { settle } from '../../../../src/helpers/wait.js';
import { PortalStore } from '../../../../src/support/portal/portalStore.js';
import { Tag, title } from '../../../../src/types/testTags.js';
import { voidAnyDraft } from '../../order-flow/charge-matrix.helpers.js';

const portal = new PortalStore();

async function quickPayCheckout(cents: number): Promise<string> {
  await voidAnyDraft();
  await homePage.selectStaffByIndex(0);
  await homePage.openQuickPay();
  await homePage.addQuickPayItem(cents, { name: 'E2E store flow' });
  await settle(400);
  await homePage.pressPay();
  await checkoutPage.waitForReady();
  return checkoutPage.orderId();
}

describe('Portal store settings — tip flow & Turn on/off', function () {
  this.timeout(Timeouts.MOCHA_TEST * 4);

  before(async function () {
    assertWritesAllowed('change Portal store settings and take small payments');
    if (!(await portal.available())) this.skip(); // .portal-profile signed out → npm run portal:login
  });

  afterEach(async () => {
    if (await paymentSuccessPage.isActive().catch(() => false)) await noReceipt().catch(() => undefined);
    await cleanTill().catch(() => undefined);
  });

  after(async () => {
    await returnToHome().catch(() => undefined);
    await portal.restore();
  });

  it(
    title(
      'Bỏ Cash khỏi Tip Method → thanh toán Cash không hiện màn tip (SET-081)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
      Tag.PAYMENT,
    ),
    async () => {
      await portal.ensure({ tipActive: true, tipOnCash: false });
      await quickPayCheckout(1_000);
      await checkoutPage.selectTender('cash');
      // false = straight to payment-success, no customer tip handoff.
      expect(await completeUntilCustomerTip()).toBe(false);
    },
  );

  it(
    title(
      'Lưu Tip Amount $ → màn hình khách hiện preset theo tiền (SET-080)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
      Tag.PAYMENT,
    ),
    async () => {
      await portal.ensure({ tipActive: true, tipOnCash: true, tipType: 'amount' });
      await quickPayCheckout(2_000);
      await checkoutPage.selectTender('cash');
      expect(await completeUntilCustomerTip()).toBe(true);
      const screen = await customerText();
      // Fixed-amount presets render as money tiles, never as "15%".
      expect(screen).toMatch(/\$\d/);
      expect(screen).not.toMatch(/\b\d{1,2}%/);
      await completeCustomerTipIfPrompted('none');
      await waitSuccess();
    },
  );

  it(
    title(
      'Tip Timing = After Payment bật nút Adjust Tip cho đơn chưa settle (SET-082)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
      Tag.PAYMENT,
    ),
    async () => {
      await portal.ensure({ tipActive: true, tipTiming: 'after_payment', tipType: 'percent' });
      const orderId = await quickPayCheckout(1_500);
      await checkoutPage.selectTender('other');
      await completeToSuccess();
      await noReceipt().catch(() => undefined);
      await returnToHome();
      await goToOrderHistory();
      await orderHistoryPage.openOrder(orderId);
      await orderHistoryDetailPage.waitForOrder(orderId);
      expect(await orderHistoryDetailPage.isAdjustTipAvailable()).toBe(true);
    },
  );

  it(
    title(
      'Turn ON: staff cards show the turn count and Available (green) / Busy (orange) (HOME-029)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
    ),
    async function () {
      await portal.ensure({ turnValue: 30 });
      await returnToHome();
      await withTurnStaff(this, 1, async ([staff]) => {
        const c = await cardTurn(staff as string);
        expect(c.turn).not.toBeNull();
        expect(c.turn?.status).toMatch(/^(Available|Busy)$/);
        expect(c.turn?.count).toBeGreaterThanOrEqual(0);
      });
    },
  );

  it(
    title(
      'Turn OFF (value 0): staff cards show no turn / Busy / Available (HOME-030, SET-062)',
      Tag.REGRESSION,
      Tag.EXCLUSIVE,
      Tag.WRITE,
    ),
    async function () {
      // Clock the staff in while Turn is ON (withTurnStaff skips on $0), then kill it.
      await portal.ensure({ turnValue: 30 });
      await returnToHome();
      await withTurnStaff(this, 1, async ([staff]) => {
        expect((await cardTurn(staff as string)).turn).not.toBeNull();
        await portal.ensure({ turnValue: 0 });
        await returnToHome();
        await homePage.waitForReady();
        const c = await cardTurn(staff as string);
        expect(c.turn).toBeNull();
        expect(c.text).not.toMatch(/\b(Available|Busy)\b/);
        await portal.ensure({ turnValue: 30 });
      });
    },
  );
});
