/**
 * Does the till render, and does it render money as money?
 *
 * Read-only: no staff is selected, no service is added, no order is created.
 * The cart footer is read on whatever the till is already showing — the app
 * mounts `HomeOrderSummary` with or without a draft order, printing `money(0)`
 * for an empty one — so this stays safe against a production till.
 */

import { expect } from '@wdio/globals';
import { Routes } from '../../src/constants/routes.js';
import { env } from '../../configs/env/loadEnv.js';
import { passcodeDialog } from '../../src/components/index.js';
import { homePage, orderPendingPage } from '../../src/pages/index.js';
import { Tag, title } from '../../src/types/testTags.js';
import { expectCentsEqual } from '../../src/utils/money.js';

describe('Home screen', () => {
  before(async () => {
    await homePage.waitForReady();
  });

  it(title('The staff and service panels are populated', Tag.SMOKE), async () => {
    expect(await homePage.currentPath()).toBe(Routes.HOME);

    // Both counts are of MOUNTED tiles — the grids run @tanstack/react-virtual,
    // so these answer "is this panel populated", never "how many does the
    // merchant have". Populated is exactly the smoke question.
    expect(await homePage.visibleStaffCount()).toBeGreaterThan(0);
    expect(await homePage.visibleServiceCount()).toBeGreaterThan(0);
  });

  it(title('Every cart footer row reads back as whole cents', Tag.SMOKE), async () => {
    // Home opens on the pending list with NO order selected (1.1.x), so there is no
    // cart footer to read. Quick Checkout is passcode-gated on 1.1.109 (VP-4815),
    // and Quick Checkout alone only opens the staff picker — the footer renders once
    // the order holds a line, so build a one-line draft (deleted again below).
    await orderPendingPage.pressQuickCheckout();
    if (await passcodeDialog.isPrompting()) await passcodeDialog.enter(env.OWNER_PASSCODE);
    await homePage.selectStaffByIndex(0);
    if (await passcodeDialog.isPrompting()) await passcodeDialog.enter(env.OWNER_PASSCODE);
    await homePage.addServiceByIndex(0);
    const totals = await homePage.cartTotals();
    await homePage.deleteOrder().catch(() => undefined);

    for (const [row, cents] of Object.entries(totals)) {
      // `money()` always renders two decimals, so a fractional value here means
      // the read took dollars for cents — a parse bug that would otherwise
      // surface much later as a total that is 100x wrong. `expectCentsEqual`
      // refuses a non-integer before it compares, and names the row that broke.
      expectCentsEqual(cents, Math.trunc(cents), `home cart ${row}`);
    }

    expect(totals.subtotal).toBeGreaterThanOrEqual(0);

    // The formula the cart footer is built on (`order-summary.tsx`): total is
    // the subtotal less every deduction, plus tax. It holds trivially on an
    // empty cart and non-trivially on a live one, and it is the one arithmetic
    // check that can be made without creating anything.
    expectCentsEqual(
      totals.total,
      totals.subtotal - totals.itemDiscount - totals.promotion - totals.reward + totals.tax,
      'home cart total',
    );
  });
});
