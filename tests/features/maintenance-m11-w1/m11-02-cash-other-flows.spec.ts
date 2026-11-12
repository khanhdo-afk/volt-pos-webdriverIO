/**
 * Maintenance 2026-Q4-M11-W1 — Cash / Other payment flows (no card):
 *   VP-5203 Other payment name kept in Order History (single, blank, split)
 *   VP-4444 Cash → Payment Successful right after the sale commits
 *   VP-5357 after paying, Home does not keep the paid order / "Cancel Order"
 *   VP-5717 / VP-4856 (cash part) a completed order never flips back to pending
 */
import { expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import {
  bodyText,
  buildOrder,
  click,
  completePayment,
  completeSplit,
  deleteDraft,
  mainText,
  noReceipt,
  openCheckout,
  openHistoryOrder,
  openSplit,
  orderByCode,
  pause,
  payCheck,
  passcodeIfPrompted,
  pickMethod,
  typeInto,
  waitText,
} from '../../../src/features/pos.js';
import { itNeeds } from '../../../src/features/spec.js';
import { customerClick, customerText } from '../../../src/features/customerCdp.js';

const d = profile().data;
const drafts: string[] = [];

describe(`[${profile().target}] M11-W1 Cash / Other flows`, () => {
  after(async () => {
    for (const c of drafts) await deleteDraft(c);
  });

  itNeeds(
    ['writes'],
    'TC-VP5203-02/03 Other with a name: success screen and Order History keep the name',
    async () => {
      const code = await buildOrder([[d.staffA, [d.cheap]]]);
      drafts.push(code);
      await openCheckout();
      await pickMethod('Other');
      await typeInto('Input payment method name', 'Zelle QC');
      const out = await completePayment('No Tip');
      expect(out.result).toBe('success');
      expect(out.text).toContain('Other\n(Zelle QC)');
      await noReceipt();
      const o = await orderByCode(code);
      const t = await openHistoryOrder(o?.id ?? '');
      const paid = ((await orderByCode(code))?.total ?? 0) / 100;
      expect(t).toContain(`Zelle QC - Amount: $${paid.toFixed(2)}`);
    },
  );

  itNeeds(['writes'], 'TC-VP5203-05 Other without a name: no null/undefined anywhere', async () => {
    const code = await buildOrder([[d.staffA, [d.cheap3]]]);
    drafts.push(code);
    await openCheckout();
    await pickMethod('Other');
    const out = await completePayment('No Tip');
    expect(out.result).toBe('success');
    await noReceipt();
    const t = await openHistoryOrder((await orderByCode(code))?.id ?? '');
    expect(t).not.toMatch(/null|undefined/);
  });

  itNeeds(['writes'], 'TC-VP5203-04 Split: each check keeps its own Other name', async () => {
    const code = await buildOrder([[d.staffB, [d.cheap]]]);
    drafts.push(code);
    const id = (await orderByCode(code))?.id ?? '';
    await openCheckout();
    await openSplit(id, 'Equally');
    await payCheck(code, 1, 'Other', 'Venmo QC');
    await payCheck(code, 2, 'Other', 'CashApp QC');
    const succ = await completeSplit();
    expect(succ).toContain('Venmo QC');
    expect(succ).toContain('CashApp QC');
    const t = await openHistoryOrder(id);
    // Equal split: the two checks differ by at most 1 cent and add up to the order total.
    const total = (await orderByCode(code))?.total ?? 0;
    const amounts = [...t.matchAll(/(Venmo|CashApp) QC - Amount: \$([\d.]+)/g)].map((m) =>
      Math.round(Number(m[2]) * 100),
    );
    expect(amounts.length).toBe(2);
    expect((amounts[0] ?? 0) + (amounts[1] ?? 0)).toBe(total);
    expect(Math.abs((amounts[0] ?? 0) - (amounts[1] ?? 0))).toBeLessThanOrEqual(1);
    expect((await orderByCode(code))?.status).toBe('successful');
  });

  itNeeds(
    ['writes'],
    'TC-VP4444/VP5357 2 staff + promo + customer tip, Cash: fast success, Home clear, tip recorded',
    async () => {
      const code = await buildOrder([
        [d.staffA, [d.cheap2]],
        [d.staffB, [d.cheap]],
      ]);
      drafts.push(code);
      await click('Promo & Rewards', { scope: 'main' });
      await pause(1500);
      await click('Percentage %', { scope: 'dialog', any: true });
      await typeInto('[role=dialog] input', '20');
      await click('Apply', { scope: 'dialog' });
      await pause(2000);
      expect(await mainText()).toMatch(/Promotion\n-\$0\.01/);
      await openCheckout();
      await pickMethod('Cash');
      await click('Complete Payment', { scope: 'main' });
      // customer picks 30% on the display; time from Continue to the success screen
      let picked = false;
      for (let i = 0; i < 30 && !picked; i++) {
        await pause(400);
        await passcodeIfPrompted();
        if ((await customerText()).includes('Add a tip')) {
          await customerClick('30%');
          await pause(300);
          await customerClick('Continue');
          picked = true;
        }
      }
      expect(picked).toBe(true);
      const out = await completePayment('No Tip', 15_000, false);
      expect(out.result).toBe('success');
      expect(out.ms).toBeLessThan(3000);
      await click('No Receipt');
      // VP-5357: for ~5 s after No Receipt the paid order must not come back with "Cancel Order"
      for (let i = 0; i < 8; i++) {
        await pause(600);
        const t = await bodyText();
        expect(t.includes(code) && t.includes('Cancel Order')).toBe(false);
      }
      const o = await orderByCode(code);
      expect(o?.status).toBe('successful');
      expect(o?.tipAmount ?? 0).toBeGreaterThan(0);
      expect(o?.totalPromotionDiscount ?? 0).toBeGreaterThan(0);
    },
  );

  itNeeds(
    ['writes'],
    'TC-VP5717/VP4856-04 Cash + customer tip: order stays successful with its tip for 60 s',
    async () => {
      const code = await buildOrder([[d.staffA, [d.cheap2]]]);
      drafts.push(code);
      await openCheckout();
      await pickMethod('Cash');
      const out = await completePayment('30%');
      expect(out.result).toBe('success');
      await noReceipt();
      // VP-4444 writes the rest in the background: allow ≤ 10 s for the commit to land.
      let first = await orderByCode(code);
      for (let i = 0; i < 10 && first?.status !== 'successful'; i++) {
        await pause(1000);
        first = await orderByCode(code);
      }
      expect(first?.status).toBe('successful');
      for (let i = 0; i < 6; i++) {
        await pause(10_000);
        const o = await orderByCode(code);
        expect(o?.status).toBe('successful');
        expect(o?.tipAmount).toBe(first?.tipAmount);
      }
    },
  );

  itNeeds(['writes'], 'TC-VP4444-b Other payment also lands on success immediately', async () => {
    const code = await buildOrder([[d.staffB, [d.cheap3]]]);
    drafts.push(code);
    await openCheckout();
    await pickMethod('Other');
    const out = await completePayment('No Tip');
    expect(out.result).toBe('success');
    expect(out.ms).toBeLessThan(5000);
    await noReceipt();
    await waitText('Pending Orders', 5000);
  });
});
