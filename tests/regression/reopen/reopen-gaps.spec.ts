/**
 * Re-Open Order — the cases of docs/screens/reopen/reopen-master-test-cases.md that no
 * other spec covered yet (TC-REOPEN-01..06). Everything else of the 79-case checklist is
 * mapped to its existing spec in that file.
 *
 * Built on the volt-qc reopen helpers (src/pages/voltqc/oh-reopen/vqReopen.ts) and the
 * merchant-14 fixtures `VOLT_TEST_STAFF[_2]`, `VOLT_TEST_SERVICE[_2]`.
 *
 * CREATES, RE-OPENS, RE-CHARGES AND VOIDS ORDERS; creates customers — dev / staging only.
 * Runs with `RUN_REOPEN=1` (`npm run test:reopen`).
 */

import { expect } from '@wdio/globals';
import { describeReopen } from '../../../src/helpers/reopenGate.js';
import { settle } from '../../../src/helpers/wait.js';
import {
  POINT_RATE,
  attachExistingCustomer,
  pointsFor,
  removeCustomerFromOrder,
  setCashierTip,
} from '../../../src/pages/voltqc/promo-split/promoFlows.js';
import {
  app,
  field,
  money,
  r2,
  randomPhone,
  uniqueName,
  vqEnv,
} from '../../../src/pages/voltqc/promo-split/vqApp.js';
import {
  addServiceInReopen,
  confirmVoidAll,
  decreaseOrFail,
  enteredFor,
  fillOtherName,
  freshDetail,
  leaveReopenVq,
  payAndReopenDone,
  payDifference,
  payFromEdit,
  readPoints,
  readVisits,
  reopenToHome,
  staffSegment,
  staffTip,
} from '../../../src/pages/voltqc/oh-reopen/vqReopen.js';
import { countPayments } from '../../../src/pages/voltqc/oh-reopen/ohReopen.js';
import { Tag, title } from '../../../src/types/testTags.js';

const S1 = vqEnv.testService;
const S2 = vqEnv.testService2;
const A = vqEnv.testStaff;
const B = vqEnv.testStaff2;

/** Order S1 (staff A) + S2 (staff B), still open on Home. */
async function twoStaffOrder(): Promise<string> {
  const id = await app.createOrder({ services: [S1] });
  await app.pickStaff(B);
  await app.addService(S2);
  return id;
}

/** Pay the open order with Cash and a cashier tip typed as cents keys (e.g. ['2','0','0'] = $2). */
async function payCashWithTip(keys: string[]): Promise<void> {
  await app.pay();
  await app.selectMethod('Cash');
  await setCashierTip(keys);
  await app.completePayment({ tip: 'none' });
  await app.waitSuccess();
  await app.noReceipt();
}

async function payOpen(method: 'Cash' | 'Other'): Promise<number> {
  await app.pay();
  const total = await app.methodAmount(method);
  await app.selectMethod(method);
  if (method === 'Other') await fillOtherName('E2E Other');
  await app.completePayment({ tip: 'none' });
  await app.waitSuccess();
  await app.noReceipt();
  return total;
}

async function attachNew(): Promise<{ phone: string; name: string }> {
  const phone = randomPhone();
  const name = uniqueName('QC RO');
  await app.attachNewCustomer(phone, name);
  await app.customerConfirmPhone().catch(() => undefined);
  return { phone, name };
}

describeReopen('Re-Open Order — gap cases of the 79-case checklist (write)', () => {
  afterEach(async () => {
    await leaveReopenVq();
  });

  it(
    title(
      'TC-REOPEN-01 (TC14): remove staff B in reopen → void-all → repay; the order keeps only staff A',
      Tag.REGRESSION,
      Tag.WRITE,
    ),
    async function () {
      this.timeout(8 * 60_000);
      const id = await twoStaffOrder();
      await payOpen('Cash');
      const d0 = await freshDetail(id);
      expect(staffSegment(d0, B)).not.toBe('');
      await decreaseOrFail(id, S2);
      await confirmVoidAll();
      await payDifference('Cash');
      const d = await freshDetail(id, (x) => staffSegment(x, B) === '');
      expect(field(d, 'Status')).toMatch(/Successful/);
      expect(staffSegment(d, A)).not.toBe('');
      expect(staffSegment(d, B)).toBe('');
    },
  );

  it(
    title(
      'TC-REOPEN-02 (TC17): raise the total and change staff together — the paid $2 tip is not lost or double-split',
      Tag.REGRESSION,
      Tag.WRITE,
    ),
    async function () {
      this.timeout(8 * 60_000);
      const id = await app.createOrder({ services: [S1] });
      await payCashWithTip(['2', '0', '0']);
      expect(field(await freshDetail(id), 'Tip')).toBe('$2.00');
      await reopenToHome(id);
      await app.changeStaff(B);
      await addServiceInReopen(S2, B);
      await payFromEdit();
      expect(await enteredFor('Cash')).toBeGreaterThan(0);
      await payDifference('Cash');
      const d = await freshDetail(id, (x) => staffSegment(x, A) === '');
      expect(field(d, 'Tip')).toBe('$2.00');
      expect(r2(staffTip(d, A) + staffTip(d, B))).toBeCloseTo(2, 2);
      expect(staffTip(d, B)).toBeCloseTo(2, 2);
      expect(countPayments(d, 'Cash')).toBe(2);
    },
  );

  it(
    title(
      'TC-REOPEN-03 (TC25): lower total with a $2 tip → void-all → repay with a $1 tip: order tip is $1, not $3',
      Tag.REGRESSION,
      Tag.WRITE,
    ),
    async function () {
      this.timeout(8 * 60_000);
      const id = await app.createOrder({ services: [S1, S2] });
      await payCashWithTip(['2', '0', '0']);
      expect(field(await freshDetail(id), 'Tip')).toBe('$2.00');
      await decreaseOrFail(id, S2);
      await confirmVoidAll();
      await app.selectMethod('Cash');
      await setCashierTip(['1', '0', '0']);
      await app.completePayment({ tip: 'none' });
      await app.waitSuccess();
      await app.noReceipt();
      const d = await freshDetail(id, (x) => field(x, 'Tip') !== '$2.00');
      expect(field(d, 'Tip')).toBe('$1.00');
      expect(field(d, 'Status')).toMatch(/Successful/);
    },
  );

  it(
    title(
      'TC-REOPEN-04 (TC32 / R21, VP-4085): remove the customer in reopen → Done: the earned points are revoked, the order stays Successful',
      Tag.REGRESSION,
      Tag.WRITE,
    ),
    async function () {
      this.timeout(8 * 60_000);
      const id = await app.createOrder();
      const { phone } = await attachNew();
      const total = await payOpen('Other');
      const p = pointsFor(total, POINT_RATE.other);
      expect(await readPoints(phone, p)).toBe(p);
      await reopenToHome(id);
      await removeCustomerFromOrder();
      await payAndReopenDone();
      await settle(3_000);
      expect(await readPoints(phone, 0)).toBe(0);
      const d = await freshDetail(id);
      expect(field(d, 'Status')).toMatch(/Successful/);
      expect(money(field(d, 'Total'))).toBeCloseTo(total, 2);
    },
  );

  it(
    title(
      'TC-REOPEN-05 (TC34 / R22): customer order, lower total → void-all → repay: points follow the NEW total, no double earn',
      Tag.REGRESSION,
      Tag.WRITE,
    ),
    async function () {
      this.timeout(10 * 60_000);
      const id = await app.createOrder({ services: [S1, S2] });
      const { phone } = await attachNew();
      const total = await payOpen('Other');
      const p0 = pointsFor(total, POINT_RATE.other);
      expect(await readPoints(phone, p0)).toBe(p0);
      await decreaseOrFail(id, S2);
      await confirmVoidAll();
      const newTotal = await enteredFor('Other');
      expect(newTotal).toBeLessThan(total);
      await payDifference('Other');
      const want = pointsFor(newTotal, POINT_RATE.other);
      expect(await readPoints(phone, want)).toBe(want);
    },
  );

  it(
    title(
      'TC-REOPEN-06 (R18, VP-4980): in one reopen swap A → B → A → B and Done: B earns once, A ends with 0',
      Tag.REGRESSION,
      Tag.WRITE,
    ),
    async function () {
      this.timeout(12 * 60_000);
      const id = await app.createOrder();
      const a = await attachNew();
      const total = await payOpen('Other');
      const p = pointsFor(total, POINT_RATE.other);
      expect(await readPoints(a.phone, p)).toBe(p);
      // a customer B that already exists, with 0 points
      const b = { phone: randomPhone(), name: uniqueName('QC RO') };
      const tmp = await app.createOrder();
      await app.attachNewCustomer(b.phone, b.name);
      await app.customerConfirmPhone().catch(() => undefined);
      await app.openPendingOrder(tmp);
      await app.deleteCurrentOrder();
      app.createdOrders.delete(tmp);
      const vB0 = await readVisits(b.phone);

      await reopenToHome(id);
      await removeCustomerFromOrder();
      await attachExistingCustomer(b.phone, b.name);
      await removeCustomerFromOrder();
      await attachExistingCustomer(a.phone, a.name);
      await removeCustomerFromOrder();
      await attachExistingCustomer(b.phone, b.name);
      await payAndReopenDone();
      await settle(3_000);

      expect(await readPoints(b.phone, p)).toBe(p);
      expect(await readPoints(a.phone, 0)).toBe(0);
      expect((await readVisits(b.phone)) - vB0).toBeLessThanOrEqual(1);
      expect(field(await freshDetail(id), 'Customer')).toContain(b.name);
    },
  );
});
