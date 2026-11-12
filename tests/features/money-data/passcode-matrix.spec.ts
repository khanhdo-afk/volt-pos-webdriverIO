/**
 * Verified-Production tasks — Passcode Setting decides which screens ask for a staff code.
 * Settings change: every gate below is read first and restored in `after`.
 *
 *   VP-3281  Passcode Settings — each listed feature asks when ON, opens directly when OFF
 *   VP-3115  Quick Pay asks for the passcode when its gate is on
 *   VP-3823  Order History asks when enabled          VP-3824  Staff Payroll gate
 *   VP-3863  Time Tracking opens without passcode when its gate is off
 *   VP-3442  Income gates (reports) are independent of the payment gate
 */
import { browser, expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import {
  buildOrder,
  click,
  deleteDraft,
  escape,
  go,
  mainText,
  pause,
  passcodeIfPrompted,
  setAutoPasscode,
  STAFF_CODE,
} from '../../../src/features/pos.js';
import { openSettings, saveCard, setSwitch, switchState } from '../../../src/features/settings.js';
import { itNeeds } from '../../../src/features/spec.js';

/** Gate label in Passcode Setting → how to reach the screen it protects. */
const NAV: Record<string, string> = {
  'Summary Income': '/report-pages/v4/income-summary',
  'Daily Income': '/report-pages/v4/daily-sale-report',
  'Staff Income': '/report-pages/v4/staff-income',
  'Staff Payroll': '/report-pages/v4/staff-payroll',
  'Batch History': '/batch-history',
  'Order History': '/order-history',
  'Time Tracking': '/time-tracking',
  Calendar: '/appointment',
};
const d = profile().data;
const GATES = [...Object.keys(NAV), 'Quick Pay', 'Completed Payment'];
const original: Record<string, boolean | null> = {};

async function setGates(want: Record<string, boolean | null>): Promise<string> {
  setAutoPasscode(true); // the Settings page itself may be gated
  await openSettings('accessibility');
  for (const g of GATES) {
    const v = want[g];
    if (v !== null && v !== undefined) await setSwitch(g, v);
  }
  return saveCard('Passcode Setting');
}

/** Open a screen WITHOUT answering the prompt; returns whether a staff-code prompt appeared. */
async function asks(path: string): Promise<boolean> {
  setAutoPasscode(false);
  await go('/home', 1500);
  await go(path, 2500);
  let prompted = false;
  for (let i = 0; i < 6 && !prompted; i++) {
    prompted = STAFF_CODE.test(await browser.execute(() => document.body.innerText));
    if (!prompted) await pause(400);
  }
  await escape(2);
  setAutoPasscode(true);
  return prompted;
}

/** Quick Pay needs an order with a staff first (else "Select Staff First"); the draft is removed. */
async function quickPayAsks(): Promise<boolean> {
  const code = await buildOrder([[d.staffA, []]]);
  setAutoPasscode(false);
  await click('Quick Pay', { scope: 'main', any: true });
  await pause(1800);
  const prompted = STAFF_CODE.test(await browser.execute(() => document.body.innerText));
  await escape(2);
  setAutoPasscode(true);
  await deleteDraft(code);
  return prompted;
}

describe(`[${profile().target} ${profile().store}] Passcode Setting matrix`, () => {
  before(async () => {
    await openSettings('accessibility');
    for (const g of GATES) original[g] = await switchState(g);
    console.log(`[passcode] original ${JSON.stringify(original)}`);
  });
  after(async () => {
    setAutoPasscode(true);
    await escape(2);
    if (Object.keys(original).length) await setGates(original);
    await passcodeIfPrompted();
  });

  it('PM-00 (VP-3281) Passcode Setting lists every report / order / other gate', async () => {
    for (const g of GATES) expect(original[g]).not.toBeNull();
    expect(await mainText()).toMatch(/REPORTS[\s\S]*ORDERS[\s\S]*OTHERS/);
  });

  itNeeds(
    ['settings', 'writes'],
    'PM-01 (VP-3281/3823/3824/3442/3115) Gates ON: every screen and Quick Pay ask for a staff code',
    async () => {
      expect(await setGates(Object.fromEntries(GATES.map((g) => [g, true])))).toMatch(
        /updated successfully/i,
      );
      const missed: string[] = [];
      for (const [g, path] of Object.entries(NAV)) if (!(await asks(path))) missed.push(g);
      if (!(await quickPayAsks())) missed.push('Quick Pay');
      expect(missed).toEqual([]);
    },
  );

  itNeeds(
    ['settings', 'writes'],
    'PM-02 (VP-3281/3863/3442) Gates OFF: the same screens open directly, Quick Pay too',
    async () => {
      // Completed Payment stays as the store had it — only navigation gates are switched off.
      const off = Object.fromEntries(GATES.map((g) => [g, g === 'Completed Payment' ? null : false]));
      expect(await setGates(off)).toMatch(/updated successfully/i);
      const asked: string[] = [];
      for (const [g, path] of Object.entries(NAV)) if (await asks(path)) asked.push(g);
      if (await quickPayAsks()) asked.push('Quick Pay');
      expect(asked).toEqual([]);
    },
  );

  itNeeds(
    ['settings'],
    'PM-03 (VP-3442) Income gate ON + Order History OFF: only the income screen asks',
    async () => {
      const want = Object.fromEntries(GATES.map((g) => [g, g === 'Completed Payment' ? null : false]));
      want['Staff Income'] = true;
      await setGates(want);
      expect(await asks(NAV['Staff Income']!)).toBe(true);
      expect(await asks(NAV['Order History']!)).toBe(false);
    },
  );
});
