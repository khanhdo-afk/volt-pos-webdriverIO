/**
 * Verified-Production tasks — Vietnamese translation (VP-2115 umbrella + the [i18n] tickets).
 *
 * Switches Settings → Language to Tiếng Việt (a store setting — restored to the original
 * language in `after`), then checks each screen for UI labels still in English. Only
 * WHOLE LINES equal to a known English label count (merchant data such as service or
 * staff names is never matched), so the check works on any store.
 */
import { browser, expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import { click, go, mainText, pause } from '../../../src/features/pos.js';
import { itNeeds } from '../../../src/features/spec.js';

let original: 'English' | 'Tiếng Việt' = 'English';

async function setLanguage(lang: 'English' | 'Tiếng Việt'): Promise<void> {
  await go('/settings/language', 2500);
  await click(lang, { scope: 'main', any: true, exact: true });
  await pause(2500);
}

/** Lines of the screen that are exactly one of the English labels. */
async function english(path: string, labels: (string | RegExp)[], wait = 3000): Promise<string[]> {
  await go(path, wait);
  const text = await mainText();
  // Never pass on an empty / locked screen: the page must have rendered real content.
  expect(text.replace(/\s+/g, '').length).toBeGreaterThan(40);
  expect(text).not.toMatch(/Enter staff code|Nhập mã nhân viên/);
  const lines = text.split('\n').map((l) => l.trim());
  return labels
    .filter((lab) => lines.some((l) => (typeof lab === 'string' ? l === lab : lab.test(l))))
    .map(String);
}

describe(`[${profile().target} ${profile().store}] Vietnamese UI (i18n)`, () => {
  before(async () => {
    await go('/settings/language', 2500);
    original = (await mainText()).includes('Chọn ngôn ngữ chính') ? 'Tiếng Việt' : 'English';
  });
  after(async () => {
    await setLanguage(original);
  });

  itNeeds(
    ['settings'],
    'I18N-01 (VP-2115/2269/3268) Switching to Tiếng Việt translates the Settings menu',
    async () => {
      await setLanguage('Tiếng Việt');
      const t = await mainText();
      expect(t).toContain('Ngôn ngữ');
      expect(t).toContain('Cài đặt tiền boa');
      expect(
        await english('/settings/business', [
          'Business Info',
          'Tipping Settings',
          'Charge & Fee',
          'Receipt',
          'Language',
          'Employees',
          'Permissions',
        ]),
      ).toEqual([]);
    },
  );

  itNeeds(
    ['settings'],
    'I18N-02 (VP-2138/2139/2244/2298/2329) Home is translated (labels, category counts)',
    async () => {
      expect(
        await english('/home', [
          'Pending Orders',
          'Quick Checkout',
          'Next appt',
          'Done',
          'Show',
          'Gift Card',
          'Quick Pay',
          /^\d+ (Services|Products?)$/,
          /^(Checkin|Appointments) Today/,
        ]),
      ).toEqual([]);
    },
  );

  itNeeds(
    ['settings'],
    'I18N-03 (VP-2192/2194/2196/2248/2313) Order History is translated (status, payment methods)',
    async () => {
      expect(
        await english('/order-history', [
          'Order History',
          'Filter',
          'Cash',
          'Card',
          'Other',
          /^Successful/,
          /Unsettled$/,
          'Select an order to view details.',
        ]),
      ).toEqual([]);
    },
  );

  itNeeds(['settings'], 'I18N-04 (VP-2200/2322) Pending Orders is translated', async () => {
    expect(
      await english('/order-pending', [
        'Staff',
        'Newest',
        'Today',
        'Quick Checkout',
        'No pending orders',
        'Unknown',
      ]),
    ).toEqual([]);
  });

  itNeeds(
    ['settings'],
    'I18N-05 (VP-2271/2278/2270) Employees / Services status labels are translated',
    async () => {
      expect(
        await english('/settings/staffs', [
          'All Employees',
          'Active',
          'Inactive',
          'Select a staff member to view details.',
        ]),
      ).toEqual([]);
      expect(await english('/settings/services', ['Active', 'Inactive', 'Services & Products'])).toEqual([]);
    },
  );

  itNeeds(
    ['settings'],
    'I18N-06 (VP-2275/2279/2280/2272/3265) Permissions page is translated (roles, items, Void)',
    async () => {
      const left = await english('/settings/permissions', [
        'Permissions',
        'Owner',
        'Manager',
        'Partner',
        'Staff',
        'Select all',
        'Expand all',
        /\bVoid\b/,
      ]);
      expect(left).toEqual([]);
    },
  );

  itNeeds(['settings'], 'I18N-07 (VP-2295/2273/2274/2325) Tipping settings are translated', async () => {
    expect(
      await english('/settings/payment-transaction', [
        'Tip Setting',
        'Tip Method',
        'Tip Timing',
        'Before Payment',
        'After Payment',
        'Tip Option',
        'Active',
        'Save',
      ]),
    ).toEqual([]);
  });

  itNeeds(['settings'], 'I18N-08 (VP-2252/2258/2263/2267/2268) Report pages are translated', async () => {
    const left: string[] = [];
    for (const p of ['staff-income', 'income-summary', 'daily-sale-report', 'staff-payroll']) {
      const l = await english(
        `/report-pages/v4/${p}`,
        [
          'Staff Income',
          'Income Summary',
          'Daily Sale Report',
          'Staff Payroll',
          'Total staff',
          'Total orders',
          'Total tip',
          'Show staff with no income',
          'Total Income Table',
          'Total Order',
          'Total Payment',
        ],
        4000,
      );
      left.push(...l.map((x) => `${p}: ${x}`));
    }
    console.log(`[i18n] report labels still English: ${left.join(' | ') || '-'}`);
    expect(left).toEqual([]);
  });

  itNeeds(['settings'], 'I18N-09 (VP-2198) Date pickers show Vietnamese month names', async () => {
    await go('/order-history', 3000);
    await click(/\d{2}\/\d{2}\/\d{4}/, { scope: 'main' });
    await pause(1500);
    const cal = await browser.execute(() =>
      [...document.querySelectorAll('[data-radix-popper-content-wrapper],[role=dialog]')]
        .map((e) => (e as HTMLElement).innerText)
        .join('\n'),
    );
    await browser.keys(['Escape']);
    expect(cal).not.toMatch(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December) \d{4}\b/,
    );
  });
});
