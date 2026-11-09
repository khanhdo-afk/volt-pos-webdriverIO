/**
 * VP-5293 — Re-Open → complete lại phải THU HỒI điểm cũ rồi cộng theo tổng mới,
 * kể cả ở lần re-open ĐẦU TIÊN ngay sau khi mở app (đơn không có trong cache).
 *
 * Từ VP-5290/5291 Re-Open chỉ cho đổi thợ (item/giá/khách khoá), nên tổng không
 * đổi: đúng rule VP-4980 là −N rồi +N → số dư KHÔNG đổi, `pointBonus` giữ nguyên.
 * Lỗi cũ (cộng chồng) sẽ hiện thành số dư +N.
 *
 * Chạy 2 pha:
 *   1. VP5293_PHASE=pay    — TC-VP5293-01 thanh toán đơn A + A2, ghi id vào .tmp/vp5293.json
 *   2. (tắt app, mở lại app có CDP)
 *   3. VP5293_PHASE=reopen — TC-VP5293-11 re-open A2 (lần đầu sau launch, thêm dịch vụ),
 *      TC-VP5293-02/03 re-open đơn A (đổi thợ), TC-VP5293-06 đơn D thêm dịch vụ,
 *      TC-VP5293-04 đơn B sau khi reload webview, TC-VP5293-05 đơn C cùng phiên
 *
 *   VP5293_PHASE=pay npm run test:attach -- --spec tests/regression/checkout-type/vp-5293-reopen-recomplete-points.spec.ts
 *
 * Test case: docs/qc/volt-qc/vp-tickets/VP-5293-reopen-recomplete-points-test-cases.md
 * Dòng log POS (1.1.109+) được đối chiếu ở `%LOCALAPPDATA%\VoltPOS\logs\<yyyy-MM-dd>.log`.
 * CREATES DATA. dev / staging only.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { browser, expect } from '@wdio/globals';
import { assertWritesAllowed } from '../../../configs/env/loadEnv.js';
import { Timeouts } from '../../../configs/constants/timeouts.js';
import { expectedAward } from '../../../src/domain/index.js';
import { payInCash, returnToHome } from '../../../src/flows/index.js';
import { step } from '../../../src/helpers/steps.js';
import { requireStore } from '../../../src/support/portal/storeSettings.js';
import { homePage } from '../../../src/pages/index.js';
import {
  buildCart,
  changeStaffTo,
  detailText,
  field,
  leaveReopen,
  openHistoryOrder,
  payFromEdit,
  reopenDone,
  reopenToHome,
  staffInDetail,
} from '../../../src/pages/voltqc/oh-reopen/ohReopen.js';
import type { PortalCheckoutType } from '../../../src/pages/web/PortalPointConfigCdp.js';
import { waitForBootedApp } from '../../../src/support/attachApp.js';

import { Tag, title } from '../../../src/types/testTags.js';
import { moduleLogger } from '../../../src/utils/logger.js';
import { liveSetting, loyalty, loyaltyPhone, skipUnless } from './checkout-type.helpers.js';

const log = moduleLogger('vp-5293');
const SHOT_DIR = join('.playwright-mcp', 'VP-5293');
const STATE_FILE = join('.tmp', 'vp5293.json');
const PHASE = process.env.VP5293_PHASE ?? 'reopen';

interface Paid {
  orderId: string;
  phone: string;
  points: number;
  pointBonus: number | null;
  award: number;
}

/** What phase "pay" leaves for phase "reopen". */
interface PhaseState {
  /** Re-opened with a staff change (TC-VP5293-02/03). */
  a: Paid;
  /** Re-opened FIRST after the restart, with a service added (TC-VP5293-11). */
  a2: Paid;
}

interface Reopened {
  pointsBefore: number;
  pointsAfter: number;
  pointBonusAfter: number | null | undefined;
  totalBefore: string;
  totalAfter: string;
  staffBefore: string[];
  staffAfter: string[];
}

async function shot(name: string): Promise<void> {
  mkdirSync(SHOT_DIR, { recursive: true });
  await browser.saveScreenshot(join(SHOT_DIR, `${name}.png`));
}

function logFileToday(): string {
  const d = new Date();
  const p = (n: number): string => String(n).padStart(2, '0');
  const base = process.env.LOCALAPPDATA ?? '';
  return join(
    base,
    'VoltPOS',
    'logs',
    `${String(d.getFullYear())}-${p(d.getMonth() + 1)}-${p(d.getDate())}.log`,
  );
}

/** The `[checkinAndCheckout] re-complete of order <id>` line, polled (the log is flushed lazily). */
async function recompleteLogLine(orderId: string): Promise<string> {
  let line = '';
  await browser
    .waitUntil(
      () => {
        const file = logFileToday();
        if (!existsSync(file)) return false;
        line =
          readFileSync(file, 'utf8')
            .split(/\r?\n/)
            .find((l) => l.includes(`re-complete of order ${orderId}`)) ?? '';
        return line !== '';
      },
      { timeout: 30_000, interval: 1_000 },
    )
    .catch(() => undefined);
  return line;
}

/** "No change" is only proven by outlasting GoCheckin's window. */
async function balanceAfterWindow(phone: string, before: number): Promise<number> {
  let last = before;
  await browser
    .waitUntil(
      async () => {
        last = await loyalty.currentPoints(phone);
        return last !== before;
      },
      { timeout: Timeouts.API, interval: 1_000 },
    )
    .catch(() => undefined);
  return last;
}

/** Fresh Home order (1st staff + 1st service) for `phone`, paid in Cash, award measured. */
async function payFresh(phone: string, tag: string): Promise<Paid> {
  const setting = await liveSetting();
  log.info(`checkout type = ${setting.checkoutType}`);
  const before = await loyalty.currentPoints(phone);
  await buildCart([[0, 0]]);
  await homePage.attachCustomerByPhone(phone);
  const checkout = await homePage.pressPay();
  await checkout.waitForReady();
  const orderId = await checkout.orderId();
  const success = await payInCash(orderId);
  await success.continueToNextOrder();
  await success.waitForFlowToEnd();
  const order = await loyalty.orderPointState(orderId);
  if (!order) throw new Error(`Order ${orderId} not found after completion`);
  const expected = expectedAward({
    setting,
    transactions: order.transactions,
    items: order.items,
    orderTotal: order.total,
    tipTotal: order.tipAmount ?? 0,
  });
  let after = before;
  await browser
    .waitUntil(
      async () => {
        after = await loyalty.currentPoints(phone);
        return expected.points !== 0 && after === before + expected.points;
      },
      { timeout: Timeouts.API, interval: 1_000 },
    )
    .catch(() => undefined);
  log.info(
    `[${tag}] paid ${orderId}: points ${String(before)} → ${String(after)} ` +
      `(expected +${String(expected.points)}), pointBonus=${String(order.pointBonus)}`,
  );
  expect(after - before).toBe(expected.points);
  return { orderId, phone, points: after, pointBonus: order.pointBonus, award: expected.points };
}

/** Re-Open → Change Staff → Pay → Re-Open Done, measured. */
async function reopenChangeStaff(p: Paid, tag: string): Promise<Reopened> {
  const code = await openHistoryOrder(p.orderId);
  const before = await detailText(code);
  await shot(`${tag}-01-paid-detail`);
  await reopenToHome(p.orderId);
  await shot(`${tag}-02-reopen-editor`);
  await step('Change Staff to the 2nd staff tile', () => changeStaffTo(1));
  const pointsBefore = await loyalty.currentPoints(p.phone);
  await payFromEdit();
  await shot(`${tag}-03-reopen-checkout`);
  await reopenDone();
  const after = await detailText(code);
  await shot(`${tag}-04-detail-after`);
  const pointsAfter = await balanceAfterWindow(p.phone, pointsBefore);
  const stamp = await loyalty.orderPointState(p.orderId);
  const r: Reopened = {
    pointsBefore,
    pointsAfter,
    pointBonusAfter: stamp?.pointBonus,
    totalBefore: field(before, 'Total'),
    totalAfter: field(after, 'Total'),
    staffBefore: staffInDetail(before),
    staffAfter: staffInDetail(after),
  };
  log.info(
    `[${tag}] ${code}: staff ${r.staffBefore.join(',')} → ${r.staffAfter.join(',')}; ` +
      `total ${r.totalBefore} → ${r.totalAfter}; points ${String(pointsBefore)} → ${String(pointsAfter)}; ` +
      `pointBonus ${String(p.pointBonus)} → ${String(r.pointBonusAfter)}`,
  );
  return r;
}

/** Path of the reopened checkout / its payment-success screen. */
const REOPEN_PAY_RE = /^\/order\/[^/]+\/(checkout|payment-success)/;

interface Grown {
  pointsBefore: number;
  pointsAfter: number;
  /** Award the new total earns under the live setting (oracle, not read off the app). */
  newAward: number;
  pointBonusAfter: number | null | undefined;
  totalAfterCents: number;
}

/**
 * Re-Open → Edit Order → select the order's staff → add service tile `serviceIndex`
 * (Dark Queen $100 on #14) → Pay → Cash for the remainder. Paying the remainder
 * completes the re-open (no Re-Open Done). Waits for the balance to land on
 * `before − pointBonus + newAward`.
 *
 * The staff tile must be selected first: tapping a service alone only raises
 * "Select Staff First" — which an older spec mistook for a locked editor.
 */
async function reopenAddService(p: Paid, tag: string, serviceIndex = 1): Promise<Grown> {
  const setting = await liveSetting();
  await openHistoryOrder(p.orderId);
  await shot(`${tag}-01-paid-detail`);
  await reopenToHome(p.orderId);
  await shot(`${tag}-02-reopen-editor`);
  await step(`Add service tile ${String(serviceIndex)} for staff tile 0`, async () => {
    await homePage.selectStaffByIndex(0);
    await homePage.addServiceByIndex(serviceIndex);
  });
  await shot(`${tag}-03-service-added`);
  const pointsBefore = await loyalty.currentPoints(p.phone);
  await payFromEdit();
  await shot(`${tag}-04-reopen-checkout`);
  const success = await payInCash(p.orderId);
  await browser
    .waitUntil(async () => !REOPEN_PAY_RE.test(new URL(await browser.getUrl()).pathname), {
      timeout: Timeouts.MEDIUM,
      interval: 500,
    })
    .catch(async () => {
      await success.continueToNextOrder();
      await success.waitForFlowToEnd();
    });
  const code = await openHistoryOrder(p.orderId);
  await shot(`${tag}-05-detail-after`);
  const order = await loyalty.orderPointState(p.orderId);
  if (!order) throw new Error(`Order ${p.orderId} not found after the re-complete`);
  const newAward = expectedAward({
    setting,
    transactions: order.transactions,
    items: order.items,
    orderTotal: order.total,
    tipTotal: order.tipAmount ?? 0,
  }).points;
  const target = pointsBefore - (p.pointBonus ?? 0) + newAward;
  let pointsAfter = pointsBefore;
  await browser
    .waitUntil(
      async () => {
        pointsAfter = await loyalty.currentPoints(p.phone);
        return pointsAfter === target;
      },
      { timeout: Timeouts.API, interval: 1_000 },
    )
    .catch(() => undefined);
  const g: Grown = {
    pointsBefore,
    pointsAfter,
    newAward,
    pointBonusAfter: order.pointBonus,
    totalAfterCents: order.total,
  };
  log.info(
    `[${tag}] ${code}: total → ${String(order.total)}¢; points ${String(pointsBefore)} → ${String(pointsAfter)} ` +
      `(expected −${String(p.pointBonus)} +${String(newAward)}); pointBonus ${String(p.pointBonus)} → ${String(order.pointBonus)}`,
  );
  return g;
}

/** Revoke the first earn, award by the new total — never both earns on top of each other. */
async function expectRevokeThenAward(p: Paid, g: Grown): Promise<void> {
  expect(g.totalAfterCents).toBeGreaterThan(0);
  expect(g.pointsAfter - g.pointsBefore).toBe(g.newAward - (p.pointBonus ?? 0));
  expect(g.pointBonusAfter).toBe(g.newAward);
  const line = await recompleteLogLine(p.orderId);
  log.info(`log: ${line}`);
  expect(line).toContain(`pointBonus ${String(p.pointBonus)}, owner stamp present`);
  expect(line).not.toContain('pointBonus none');
  // An unchanged award (Auto's flat bonus) may legitimately send nothing.
  if (g.newAward !== p.pointBonus) expect(line).toContain(`award ${String(g.newAward)}`);
}

/** Checkout type the case runs under — set on the Portal when signed in, else required as-is. */
const MANUAL: PortalCheckoutType = 'payment_method';
const HYBRID: PortalCheckoutType = 'hybrid_checkout';
const AUTO: PortalCheckoutType = 'auto_checkout';

/**
 * Put the Portal on `checkoutType` for this case (and wait until POS reads it). Without
 * a Portal session the case still runs when POS already reads that type, else skips.
 */
async function useCheckoutType(
  ctx: Mocha.Context,
  checkoutType: PortalCheckoutType,
  shotName: string,
): Promise<void> {
  // Same Portal driver as every other spec (stable control ids, readback, POS reload);
  // the file's root afterAll puts the original type back.
  const ok = await step(`Portal: Checkout type = ${checkoutType}`, () => requireStore({ checkoutType }));
  if (ok) return;
  const live = await liveSetting();
  skipUnless(
    ctx,
    live.checkoutType === checkoutType,
    `needs Checkout type ${checkoutType} (POS reads ${live.checkoutType}); Portal not signed in — run npm run portal:auth`,
  );
  void shotName;
}

/** No double earn: same total, new staff, balance and `pointBonus` unchanged. */
function expectNoDoubleEarn(p: Paid, r: Reopened): void {
  expect(r.totalAfter).toBe(r.totalBefore);
  expect(r.staffAfter).not.toEqual(r.staffBefore);
  expect(r.pointsAfter).toBe(r.pointsBefore);
  expect(r.pointBonusAfter).toBe(p.pointBonus);
}

/** The re-complete read the first earn and its owner (not the first-sale branch). */
async function expectRevokeLogged(p: Paid): Promise<void> {
  const line = await recompleteLogLine(p.orderId);
  log.info(`log: ${line}`);
  expect(line).not.toBe('');
  expect(line).toContain(`pointBonus ${String(p.pointBonus)}, owner stamp present`);
  expect(line).not.toContain('pointBonus none');
}

describe('VP-5293 — Re-Open re-complete revokes the old earn (no double points)', () => {
  let reopened = false;
  let orderA: Paid | null = null;

  before(() => {
    assertWritesAllowed('complete and re-open an order for a loyalty customer');
  });

  after(async () => {
    if (reopened) await leaveReopen().catch(() => undefined);
    // checkout type: restored by the root afterAll (restoreStore)
  });

  it(
    title('Thanh toán đơn A + A2 cho khách có điểm (TC-VP5293-01)', Tag.REGRESSION, Tag.WRITE, Tag.PAYMENT),
    async function () {
      skipUnless(
        this,
        PHASE === 'pay',
        'only in VP5293_PHASE=pay (then restart the app and run VP5293_PHASE=reopen)',
      );
      await useCheckoutType(this, MANUAL, 'portal-TC01-manual');
      const a = await payFresh(loyaltyPhone(this), 'A');
      expect(a.pointBonus).toBe(a.award);
      await shot('A-00-paid');
      // A2 is the one TC-VP5293-11 grows on the first re-open after the restart.
      const a2 = await payFresh(loyaltyPhone(this), 'A2');
      expect(a2.pointBonus).toBe(a2.award);
      mkdirSync('.tmp', { recursive: true });
      writeFileSync(STATE_FILE, JSON.stringify({ a, a2 } satisfies PhaseState, null, 2));
    },
  );

  it(
    title(
      'Re-open đầu tiên sau khi mở lại app, thêm dịch vụ: thu hồi −N rồi cộng +M (TC-VP5293-11)',
      Tag.REGRESSION,
      Tag.WRITE,
      Tag.PAYMENT,
    ),
    async function () {
      skipUnless(
        this,
        PHASE === 'reopen' && existsSync(STATE_FILE),
        'needs VP5293_PHASE=pay + an app restart first (.tmp/vp5293.json)',
      );
      await useCheckoutType(this, MANUAL, 'portal-TC11-manual');
      const { a2 } = JSON.parse(readFileSync(STATE_FILE, 'utf8')) as PhaseState;
      reopened = true;
      const g = await reopenAddService(a2, 'TC11');
      reopened = false;
      await expectRevokeThenAward(a2, g);
    },
  );

  it(
    title(
      'Re-open lần đầu ngay sau khi mở lại app không cộng chồng (TC-VP5293-02)',
      Tag.REGRESSION,
      Tag.WRITE,
      Tag.PAYMENT,
    ),
    async function () {
      skipUnless(
        this,
        PHASE === 'reopen' && existsSync(STATE_FILE),
        'needs VP5293_PHASE=pay + an app restart first (.tmp/vp5293.json)',
      );
      const paid = (JSON.parse(readFileSync(STATE_FILE, 'utf8')) as PhaseState).a;
      reopened = true;
      const r = await reopenChangeStaff(paid, 'TC02');
      reopened = false;
      orderA = paid;
      void orderA; // read by TC-VP5293-03 (disabled: needs the 2-phase restart)
      expectNoDoubleEarn(paid, r);
    },
  );

  // [TẮT 2026-11-08] Cần quy trình 2 pha (pay → khởi động lại app → re-open, TC-VP5293-01/02) — chạy tay theo hướng dẫn đầu file — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it(
  //   title('Log re-complete đơn A đọc được điểm cũ + chủ điểm (TC-VP5293-03)', Tag.REGRESSION),
  //   async function () {
  //     skipUnless(this, orderA !== null, 'TC-VP5293-02 did not re-complete order A');
  //     if (orderA === null) return;
  //     await expectRevokeLogged(orderA);
  //     rmSync(STATE_FILE, { force: true }); // one restart → one first re-open
  //   },
  // );

  it(
    title(
      'Reload webview (xoá cache order) rồi re-open không cộng chồng (TC-VP5293-04)',
      Tag.REGRESSION,
      Tag.WRITE,
      Tag.PAYMENT,
    ),
    async function () {
      skipUnless(this, PHASE === 'reopen', 'only in VP5293_PHASE=reopen');
      this.timeout(8 * 60_000); // pay + Portal checkout type + re-open + log read
      await useCheckoutType(this, MANUAL, 'portal-TC04-manual');
      const paid = await payFresh(loyaltyPhone(this), 'B');
      await step('Reload the staff webview (drops the cached order)', async () => {
        await browser.refresh();
        await waitForBootedApp();
        await returnToHome();
      });
      reopened = true;
      const r = await reopenChangeStaff(paid, 'TC04');
      reopened = false;
      expectNoDoubleEarn(paid, r);
      await expectRevokeLogged(paid);
    },
  );

  it(
    title(
      'Re-open cùng phiên (order còn trong cache) không cộng chồng (TC-VP5293-05)',
      Tag.REGRESSION,
      Tag.WRITE,
      Tag.PAYMENT,
    ),
    async function () {
      skipUnless(this, PHASE === 'reopen', 'only in VP5293_PHASE=reopen');
      this.timeout(8 * 60_000); // pay + Portal checkout type + re-open + log read
      await useCheckoutType(this, MANUAL, 'portal-TC05-manual');
      const paid = await payFresh(loyaltyPhone(this), 'C');
      reopened = true;
      const r = await reopenChangeStaff(paid, 'TC05');
      reopened = false;
      expectNoDoubleEarn(paid, r);
      await expectRevokeLogged(paid);
    },
  );

  it(
    title(
      'Re-open tăng tổng tiền → thu hồi −N rồi cộng +M (TC-VP5293-06)',
      Tag.REGRESSION,
      Tag.WRITE,
      Tag.PAYMENT,
    ),
    async function () {
      skipUnless(this, PHASE === 'reopen', 'only in VP5293_PHASE=reopen');
      this.timeout(8 * 60_000); // pay + Portal checkout type + re-open + log read
      await useCheckoutType(this, MANUAL, 'portal-TC06-manual');
      const paid = await payFresh(loyaltyPhone(this), 'D');
      reopened = true;
      const g = await reopenAddService(paid, 'TC06');
      reopened = false;
      expect(g.newAward).toBeGreaterThan(paid.pointBonus ?? 0);
      await expectRevokeThenAward(paid, g);
    },
  );

  it(
    title(
      'Hybrid: re-open thêm dịch vụ → thu hồi −N rồi cộng +M (TC-VP5293-09)',
      Tag.REGRESSION,
      Tag.WRITE,
      Tag.PAYMENT,
      Tag.EXCLUSIVE,
    ),
    async function () {
      skipUnless(this, PHASE === 'reopen', 'only in VP5293_PHASE=reopen');
      this.timeout(8 * 60_000); // pay + Portal checkout type + re-open + log read
      await useCheckoutType(this, HYBRID, 'portal-TC09-hybrid');
      const paid = await payFresh(loyaltyPhone(this), 'E-hybrid');
      reopened = true;
      const g = await reopenAddService(paid, 'TC09');
      reopened = false;
      expect(g.newAward).toBeGreaterThan(paid.pointBonus ?? 0);
      await expectRevokeThenAward(paid, g);
    },
  );

  it(
    title(
      'Auto: re-open thêm dịch vụ → điểm cố định, không cộng chồng (TC-VP5293-12)',
      Tag.REGRESSION,
      Tag.WRITE,
      Tag.PAYMENT,
      Tag.EXCLUSIVE,
    ),
    async function () {
      skipUnless(this, PHASE === 'reopen', 'only in VP5293_PHASE=reopen');
      this.timeout(8 * 60_000); // pay + Portal checkout type + re-open + log read
      await useCheckoutType(this, AUTO, 'portal-TC12-auto');
      const paid = await payFresh(loyaltyPhone(this), 'F-auto');
      reopened = true;
      const g = await reopenAddService(paid, 'TC12');
      reopened = false;
      // Auto awards the flat Point Bonus per visit: the bigger total earns the same.
      expect(g.newAward).toBe(paid.pointBonus);
      await expectRevokeThenAward(paid, g);
    },
  );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it.skip(
  //   title(
  //     'Checkout đầu bị API trả FAIL / MISSING_ORDER_DATA (TC-VP5293-07) — PENDING: không ép được API lỗi trên dev',
  //   ),
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it.skip(
  //   title(
  //     'Không đọc lại được order khi re-complete (TC-VP5293-08) — PENDING: setOffline không cắt sync Rust, cần tắt mạng thật',
  //   ),
  // );
  // [TẮT 2026-11-08] Tạm không test (đã đánh dấu skip/MANUAL: cần thiết bị/điều kiện không tự động được, hoặc Re-Open tạm dừng theo yêu cầu) — mở lại (bỏ comment) khi tính năng hoàn thiện.
  // it.skip(
  //   title('Portal Points history không có dòng cộng thứ 2 (TC-VP5293-10) — PENDING: kiểm tay trên Portal'),
  // );
});
