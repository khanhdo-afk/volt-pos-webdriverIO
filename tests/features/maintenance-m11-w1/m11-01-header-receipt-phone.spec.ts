/**
 * Maintenance 2026-Q4-M11-W1 — VP-5120 (Home header: one ≡, 16px gaps) and
 * VP-4390 (receipt shows the full Business phone; customer phone stays masked).
 * Shared spec: staging + production profiles.
 */
import { browser, expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import {
  attachCustomer,
  buildOrder,
  capturePrint,
  click,
  completePayment,
  deleteDraft,
  go,
  mainText,
  noReceipt,
  openCheckout,
  openHistoryOrder,
  orderByCode,
  pause,
  pickMethod,
} from '../../../src/features/pos.js';
import { openSettings, inputValue } from '../../../src/features/settings.js';
import { itNeeds } from '../../../src/features/spec.js';

const d = profile().data;

describe(`[${profile().target}] M11-W1 VP-5120 Home header`, () => {
  it('TC-VP5120-05/06 Home has a single ≡ and the header buttons are 16px apart', async () => {
    await go('/home', 2500);
    const btns = await browser.execute(() =>
      [...(document.querySelector('header')?.querySelectorAll('button,a') ?? [])]
        .map((b) => {
          const r = b.getBoundingClientRect();
          return {
            t: ((b as HTMLElement).innerText || b.getAttribute('aria-label') || '').trim(),
            x: Math.round(r.x),
            w: Math.round(r.width),
          };
        })
        .filter((b) => b.w > 0),
    );
    expect(btns.filter((b) => b.t === 'Open sidebar').length).toBe(1);
    const nav = ['Pending Orders', 'Order History', 'Appointment', 'Scanner'].map((n) =>
      btns.find((b) => b.t === n),
    );
    expect(nav.every(Boolean)).toBe(true);
    for (let i = 1; i < nav.length; i++) {
      const prev = nav[i - 1];
      const cur = nav[i];
      if (prev && cur) expect(cur.x - (prev.x + prev.w)).toBe(16);
    }
  });

  it('TC-VP5120-07/08 Pending sidebar is shown and the Pending Orders button opens the pending page', async () => {
    await go('/home', 2500);
    expect(await browser.execute(() => document.querySelector('aside')?.textContent ?? '')).toContain(
      'Pending Orders',
    );
    await click('Open pending orders', { scope: 'header' }).catch(() =>
      click('Pending Orders', { scope: 'header' }),
    );
    await pause(1500);
    expect(await browser.getUrl()).toContain('/order-pending');
  });
});

describe(`[${profile().target}] M11-W1 VP-4390 Business phone on receipts`, () => {
  let phone = '';
  let code = '';
  after(async () => {
    if (code) await deleteDraft(code);
  });

  it('TC-VP4390-03 Business Info phone is a full number', async () => {
    await openSettings('business');
    phone = await inputValue('input[name="businessPhone"]');
    expect(phone).toMatch(/^\(\d{3}\) \d{3}-\d{4}$/);
  });

  it('TC-VP4390-01/02 Receipt Preview shows it in full; unticking hides it (no Save)', async () => {
    await openSettings('receipt');
    const preview = async (): Promise<string> => {
      const t = await mainText();
      return t.slice(t.indexOf('Receipt Preview'));
    };
    expect(await preview()).toContain(phone);
    await click('Business phone', { scope: 'main', any: true });
    await pause(800);
    const hidden = await preview();
    await click('Business phone', { scope: 'main', any: true });
    await pause(800);
    expect(hidden).not.toContain(phone);
    expect(await preview()).toContain(phone);
  });

  itNeeds(
    ['writes'],
    'TC-VP4390-04/05 Paid order receipt + print: phone in full, customer phone masked',
    async () => {
      code = await buildOrder([[d.staffA, [d.cheap]]]);
      await attachCustomer(d.customer, d.customerSearch);
      await openCheckout();
      await pickMethod('Cash');
      expect((await completePayment('No Tip')).result).toBe('success');
      await noReceipt();
      const o = await orderByCode(code);
      expect(o?.status).toBe('successful');
      await openHistoryOrder(o?.id ?? '');
      await click('Receipt', { scope: 'main' });
      await pause(2000);
      const printed = await capturePrint(() => click('Print', { scope: 'dialog' }));
      expect(printed).toContain(phone);
      expect(printed).toMatch(/\*\*\*-\*\*\*-\d{4}/);
      code = '';
    },
  );
});
