/**
 * Maintenance 2026-Q4-M11-W1 — VP-4912: Re-Open of a split-paid order goes to the
 * locked edit (no forced Void), keeps both transactions, and closes with
 * "Re-Open Done"; staff can still change.
 */
import { browser, expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import {
  buildOrder,
  click,
  clickService,
  completeSplit,
  deleteDraft,
  exists,
  mainText,
  openCheckout,
  openHistoryOrder,
  openSplit,
  orderByCode,
  pause,
  payCheck,
  reopen,
  reopenDone,
  selectStaff,
} from '../../../src/features/pos.js';
import { itNeeds } from '../../../src/features/spec.js';

const d = profile().data;
let code = '';
let id = '';

describe(`[${profile().target}] M11-W1 VP-4912 Re-Open a split order`, () => {
  after(async () => {
    if (code) await deleteDraft(code);
  });

  itNeeds(
    ['writes'],
    'TC-VP4912-02 Split Equally, both checks paid (Other + Other) → successful',
    async () => {
      code = await buildOrder([[d.staffB, [d.cheap]]]);
      id = (await orderByCode(code))?.id ?? '';
      await openCheckout();
      await openSplit(id, 'Equally');
      await payCheck(code, 1, 'Other', 'QC A');
      await payCheck(code, 2, 'Other', 'QC B');
      await completeSplit();
      expect((await orderByCode(code))?.status).toBe('successful');
    },
  );

  itNeeds(
    ['writes'],
    'TC-VP4912-03/04/06 Re-Open: no Void prompt, locked message, Re-Open Done offered, totals unchanged',
    async () => {
      const popup = await reopen(id);
      expect(popup).toContain('Items and prices are locked');
      expect(popup).not.toContain('Void Order Transactions');
      expect(await exists('Void Order Transactions')).toBe(false);
      expect(await exists('Re-Open Done')).toBe(true);
      expect(await mainText()).toContain('Total\n$0.02');
    },
  );

  itNeeds(['writes'], 'TC-VP4912-07 Catalog is locked and the line cannot be deleted', async () => {
    await click('Edit Order');
    await pause(2500);
    const before = (await mainText()).match(/Subtotal\n\$([\d.]+)/)?.[1];
    await clickService(d.svc25).catch(() => undefined);
    await pause(1200);
    expect((await mainText()).match(/Subtotal\n\$([\d.]+)/)?.[1]).toBe(before);
    const delDisabled = await browser.execute(() => {
      const b = [...document.querySelectorAll('main button')].find(
        (x) =>
          x.getAttribute('aria-label') === 'Delete Staff Order Item' ||
          (x as HTMLElement).innerText.trim() === 'Delete Staff Order Item',
      );
      return b ? (b as HTMLButtonElement).disabled : null;
    });
    expect(delDisabled).toBe(true);
  });

  itNeeds(
    ['writes'],
    'TC-VP4912-08/05 Change staff → Re-Open Done keeps both transactions, no Void',
    async () => {
      await click('Change Staff', { scope: 'main' });
      await pause(800);
      await selectStaff(d.staffA).catch(() => undefined);
      if (await exists('Change from')) await click('Confirm', { scope: 'alert' });
      await pause(1500);
      expect(await mainText()).toContain(d.staffA);
      await click('Pay', { scope: 'main' });
      await pause(2500);
      expect(await exists('Void')).toBe(false);
      await reopenDone();
      const o = await orderByCode(code);
      expect(o?.status).toBe('successful');
      const t = await openHistoryOrder(id);
      expect(t).toContain(`Staff: ${d.staffA}`);
      expect(t).toContain('QC A - Amount: $0.01');
      expect(t).toContain('QC B - Amount: $0.01');
      code = '';
    },
  );
});
