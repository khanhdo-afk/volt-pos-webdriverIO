/**
 * Maintenance 2026-Q4-M11-W1 — passcode gates:
 *   VP-5132 Apply Discount (Promo & Rewards)
 *   VP-4815 Quick Checkout / Sell Gift Card / Edit Service Price / Calendar
 *   VP-6740 Edit Service Price (handled in VP-4815)
 * Every gate is read first and restored in `after` — store settings change only
 * for the duration of this file.
 */
import { expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import {
  bodyText,
  clickService,
  click,
  currentOrderCode,
  deleteDraft,
  escape,
  exists,
  go,
  mainText,
  pause,
  passcodeTitle,
  selectStaff,
  setAutoPasscode,
  typeInto,
  waitText,
} from '../../../src/features/pos.js';
import { openSettings, saveCard, setSwitch, switchState } from '../../../src/features/settings.js';
import { passcode } from '../../../src/features/policy.js';
import { priceOf } from '../../../src/features/discover.js';
import { itNeeds } from '../../../src/features/spec.js';
import { browser } from '@wdio/globals';

const d = profile().data;
const GATES = [
  'Apply Discount (Promo & Rewards)',
  'Quick Checkout',
  'Sell Gift Card',
  'Edit Service Price',
  'Calendar',
];
const original: Record<string, boolean | null> = {};
let code = '';

async function typeCode(c: string): Promise<void> {
  for (const ch of c) {
    await click(ch, { scope: 'dialog', last: true, timeout: 5000 });
    await pause(80);
  }
  await pause(1500);
}

async function setGates(on: boolean | Record<string, boolean | null>): Promise<string> {
  setAutoPasscode(true); // the Settings page itself may be gated
  await openSettings('accessibility');
  for (const g of GATES) {
    const want = typeof on === 'boolean' ? on : on[g];
    if (want !== null && want !== undefined) await setSwitch(g, want);
  }
  return saveCard('Passcode Setting');
}

describe(`[${profile().target}] M11-W1 Passcode gates (VP-5132 / VP-4815 / VP-6740)`, () => {
  before(async () => {
    await openSettings('accessibility');
    for (const g of GATES) original[g] = await switchState(g);
  });

  // The gate under test must not be answered by a helper.
  beforeEach(() => setAutoPasscode(false));
  afterEach(() => setAutoPasscode(true));

  after(async () => {
    setAutoPasscode(true);
    await escape(2);
    if (code) await deleteDraft(code);
    if (Object.keys(original).length) await setGates(original);
  });

  it('TC-VP4815-17 / TC-VP5132-01 Passcode Setting lists the new gates', () => {
    for (const g of GATES) expect(original[g]).not.toBeNull();
  });

  itNeeds(['settings'], 'TC-VP5132-03 Turning the gates on saves', async () => {
    expect(await setGates(true)).toContain('Passcode setting updated successfully');
  });

  itNeeds(
    ['settings', 'writes'],
    'TC-VP4815-01/02/04 Quick Checkout asks; a wrong code is refused; the owner code opens an order',
    async () => {
      await go('/order-pending', 2500);
      await click('Quick Checkout', { scope: 'main' });
      await pause(1500);
      // Gate may sit on Quick Checkout itself or on the first staff pick.
      if (!(await passcodeTitle())) await selectStaff(d.staffA).catch(() => undefined);
      expect(await passcodeTitle()).toBe('Quick Checkout');
      await typeCode('1357');
      expect(await bodyText()).toContain('Failed to verify staff code');
      await typeCode(passcode());
      await pause(1000);
      if (!/#OD\d/.test(await mainText())) await selectStaff(d.staffA);
      code = await currentOrderCode();
      expect(code).toMatch(/^OD\d{6}-\d+$/);
    },
  );

  itNeeds(
    ['settings', 'writes'],
    'TC-VP4815-05 An open order does not ask again when adding a staff',
    async () => {
      await clickService(d.cheap);
      await pause(800);
      await selectStaff(d.staffB).catch(() => undefined);
      expect(await passcodeTitle()).toBeNull();
      await clickService(d.cheap3);
      await pause(800);
    },
  );

  itNeeds(
    ['settings', 'writes'],
    'TC-VP5132-04/05/06/08 Apply Discount asks; cancel keeps the order; wrong code refused; owner applies',
    async () => {
      const apply = async (pct: string): Promise<void> => {
        await click('Promo & Rewards', { scope: 'main' });
        await pause(1500);
        await click('Percentage %', { scope: 'dialog', any: true });
        await typeInto('[role=dialog] input', pct);
        await click('Apply', { scope: 'dialog' });
        await pause(1500);
      };
      await apply('50');
      expect(await passcodeTitle()).toBe('Apply Discount (Promo & Rewards)');
      await escape(2);
      expect(await mainText()).not.toMatch(/Promotion\n-\$/);
      await apply('50');
      await typeCode('1357');
      expect(await bodyText()).toContain('Failed to verify staff code');
      expect(await mainText()).not.toMatch(/Promotion\n-\$/);
      await typeCode(passcode());
      await pause(1500);
      expect(await mainText()).toMatch(/Promotion\n-\$0\.0[1-9]/);
    },
  );

  itNeeds(
    ['settings', 'writes'],
    'TC-VP4815-09 / TC-VP6740-04 Editing only the note does not ask',
    async () => {
      await clickCartRow(d.cheap);
      await typeInto('Add note', 'QC note', true);
      await click('Save', { scope: 'dialog' });
      await pause(1500);
      expect(await passcodeTitle()).toBeNull();
    },
  );

  itNeeds(
    ['settings', 'writes'],
    'TC-VP4815-10 / TC-VP6740-02/03 Changing a price asks; wrong code refused; owner saves',
    async () => {
      await clickCartRow(d.cheap);
      await click('Reset amount', { scope: 'dialog' });
      await typeInto('[role=dialog] input[placeholder="0.00"]', '4');
      await click('Save', { scope: 'dialog' });
      await pause(1500);
      expect(await passcodeTitle()).toBe('Edit Service Price');
      await typeCode('1357');
      expect(await bodyText()).toContain('Failed to verify staff code');
      await typeCode(passcode());
      await pause(1500);
      // The price field is a currency mask: read the saved line back instead of assuming "$4.00".
      const line = (await mainText()).match(new RegExp(String.raw`${d.cheap}\n\$([\d.]+)`))?.[1];
      expect(line).toBeDefined();
      expect(line).not.toBe((priceOf(d.cheap) / 100).toFixed(2));
    },
  );

  itNeeds(
    ['settings', 'writes'],
    'TC-VP4815-07 Sell Gift Card asks (form opens with the owner code, nothing sold)',
    async () => {
      await click('Gift Card', { scope: 'main', any: true });
      await pause(1500);
      expect(await passcodeTitle()).toBe('Sell Gift Card');
      await typeCode(passcode());
      expect(await waitText('Sell Gift Card', 8000)).toBe(true);
      await escape(2);
    },
  );

  itNeeds(['settings'], 'TC-VP4815-11 Calendar asks; owner code opens Appointment', async () => {
    await click('Appointment', { scope: 'header' });
    await pause(1500);
    expect(await passcodeTitle()).toBe('Calendar');
    await typeCode(passcode());
    expect(await waitText('Appointment Overview', 10_000)).toBe(true);
  });

  itNeeds(
    ['settings'],
    'TC-VP4815-12 With the gates restored off, Calendar opens without a passcode',
    async () => {
      await setGates(original);
      if (original.Calendar === false) {
        await go('/home', 2000);
        await click('Appointment', { scope: 'header' });
        await pause(1500);
        expect(await exists('Enter staff code to access Calendar')).toBe(false);
      }
    },
  );
});

/** Open the cart line editor for `service` (row = .cursor-pointer.border-b holding the name). */
async function clickCartRow(service: string): Promise<void> {
  const ok = await browser.execute((s: string) => {
    const rows = [...document.querySelectorAll('main div.cursor-pointer.border-b')];
    const r = rows.find((e) => (e as HTMLElement).innerText.includes(s));
    if (!r) return false;
    r.setAttribute('data-qc-row', '1');
    return true;
  }, service);
  if (!ok) throw new Error(`no cart row for ${service}`);
  await browser.$('[data-qc-row="1"]').click();
  await pause(1500);
}
