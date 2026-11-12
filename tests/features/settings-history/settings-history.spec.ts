/**
 * Verified-Production tasks — Settings + Order History screens (READ-ONLY, any store).
 *
 *   VP-3430/3433           Settings grouped under "Payment & Receipt"; Discount Setting lives in Charge & Fee
 *   VP-3285/2611/5627      Discount Setting has separate Available-promotion and Custom-promotion splits
 *   VP-4947/3471/3160/3045 Business Info shows the Business phone field (not the owner phone)
 *   VP-4695                Employees has the account Owner (Owner tab) like Staff Payroll
 *   VP-2105                Order History date-range calendar lists each day of a month once
 *   VP-1709                Order detail shows Order Information / Summary / Service / Payment sections
 *   VP-3262/3595           Searching an order code in Order History opens that order
 *   VP-3256                Order History filter offers Staff / Payment Method / Status
 *   VP-2787/2691           Version Update page shows the current version (no auto popup)
 */
import { browser, expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import { click, go, gql, mainText, pause, typeInto } from '../../../src/features/pos.js';
import { itNeeds, noteSkip } from '../../../src/features/spec.js';

const settingsBody = async (path: string): Promise<string> => {
  await go(path, 2500);
  const t = await mainText();
  // Drop the settings nav column (everything up to the Support line).
  return t.slice(t.indexOf('Support:') >= 0 ? t.indexOf('\n', t.indexOf('Support:')) : 0);
};

describe(`[${profile().target} ${profile().store}] Settings & Order History (read-only)`, () => {
  itNeeds(
    [],
    'SET-01 (VP-3430/3433) Payment & Receipt groups Tipping, Charge & Fee, Receipt; Discount Setting is in Charge & Fee',
    async () => {
      await go('/settings/business', 2500);
      const nav = await mainText();
      expect(nav).toMatch(/Payment & Receipt\nTipping Settings\nCharge & Fee\nReceipt/);
      const fee = await settingsBody('/settings/charge-fee');
      expect(fee).toContain('Discount Setting');
      const tip = await settingsBody('/settings/payment-transaction');
      expect(tip).not.toContain('Discount Setting');
    },
  );

  itNeeds(
    [],
    'SET-02 (VP-3285/2611/5627) Discount Setting: separate owner/staff split for promotions and custom promotion',
    async () => {
      const t = await settingsBody('/settings/charge-fee');
      const d = t.slice(t.indexOf('Discount Setting'));
      expect(d).toMatch(
        /Available promotions[\s\S]*Owner share \(%\)[\s\S]*Staff share \(%\)[\s\S]*Custom promotion[\s\S]*Owner share \(%\)[\s\S]*Staff share \(%\)/,
      );
    },
  );

  itNeeds([], 'SET-03 (VP-4947/3471/3160/3045) Business Info shows a Business phone field', async () => {
    const t = await settingsBody('/settings/business');
    expect(t).toContain('Business phone');
    expect(t).not.toMatch(/\nOwner phone\n/i);
  });

  itNeeds([], 'SET-04 (VP-4695) Employees lists the account Owner', async () => {
    const t = await settingsBody('/settings/staffs');
    expect(t).toMatch(/All Employees\nAll\nOwner\n/);
  });

  itNeeds([], 'OH-01 (VP-2105) Order History calendar lists every day of a month exactly once', async () => {
    await go('/order-history', 3000);
    await click(/\d{2}\/\d{2}\/\d{4}/, { scope: 'main' });
    await pause(1500);
    const cal = await browser.execute(() =>
      [...document.querySelectorAll('[data-radix-popper-content-wrapper],[role=dialog]')]
        .map((e) => (e as HTMLElement).innerText)
        .join('\n'),
    );
    await browser.keys(['Escape']);
    const months = cal.split(/\n(?=[A-Z][a-z]+ \d{4}\n)/).filter((b) => /^[A-Z][a-z]+ \d{4}\n/.test(b));
    expect(months.length).toBeGreaterThan(0);
    for (const m of months) {
      const days = m
        .split('\n')
        .filter((l) => /^\d{1,2}$/.test(l.trim()))
        .map(Number);
      const [mon, yr] = (m.split('\n')[0] ?? '').split(' ');
      const len = new Date(Number(yr), new Date(`${mon ?? 'January'} 1, 2000`).getMonth() + 1, 0).getDate();
      expect(days).toEqual(Array.from({ length: len }, (_, i) => i + 1));
    }
  });

  itNeeds(
    [],
    'OH-02 (VP-1709/3262/3595) Searching an order code opens it with all detail sections',
    async function () {
      await go('/order-history', 3000);
      const code = (await mainText()).match(/\n(OD\d{6}-\d+)\n/)?.[1];
      if (!code) {
        noteSkip(this.test?.title ?? '', 'no order in the default Order History range');
        this.skip();
      }
      await typeInto('Search order ID, customer name or phone', code);
      await pause(2500);
      await click(code, { scope: 'main', any: true });
      await pause(2500);
      const t = await mainText();
      expect(t).toContain(`Order #${code}`);
      for (const s of ['Order Information', 'Order Summary', 'Service Details', 'Payment Details'])
        expect(t).toContain(s);
      const row = await gql<{ orderList: { total: number }[] }>(
        'query($c:String!){ orderList(where:{orderCode:{eq:$c}}){ total } }',
        { c: code },
      );
      const total = row.orderList[0]?.total ?? 0;
      expect(t).toMatch(new RegExp(`Total\\n\\$${(total / 100).toFixed(2).replace('.', '\\.')}`));
    },
  );

  itNeeds(
    [],
    'OH-03 (VP-3256/3257) Order History filter offers Sort / Staff / Payment Method / Status',
    async () => {
      await go('/order-history', 3000);
      await click('Filter', { scope: 'main' });
      await pause(1200);
      const f = await browser.execute(() =>
        [...document.querySelectorAll('[role=dialog]')].map((e) => (e as HTMLElement).innerText).join('\n'),
      );
      await browser.keys(['Escape']);
      for (const s of ['Sort by', 'Date completed', 'Staff', 'Payment Method', 'Status', 'Clear', 'Confirm'])
        expect(f).toContain(s);
    },
  );

  itNeeds([], 'VU-01 (VP-2787/2691) Version Update page shows the running version', async () => {
    await go('/home', 2000);
    await click('Open sidebar');
    await pause(1000);
    const side = await mainText().then(
      async (m) => m + (await browser.execute(() => document.body.innerText)),
    );
    const version = side.match(/Version:\s*([\d.]+)/)?.[1] ?? '';
    await click('Version Update', { any: true, last: true });
    // The version sits in a disabled <input> (value, not innerText).
    let t = '';
    for (let i = 0; i < 20 && !t.includes(version); i++) {
      await pause(500);
      t = await browser.execute(() => {
        const d = [...document.querySelectorAll('[role=dialog]')].pop() as HTMLElement | undefined;
        if (!d) return '';
        return [d.innerText, ...[...d.querySelectorAll('input')].map((i) => i.value)].join(' | ');
      });
    }
    await browser.keys(['Escape']);
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(t).toContain(version);
    expect(t).toMatch(/Version Update|Current version|up to date|Update Now/i);
  });
});
