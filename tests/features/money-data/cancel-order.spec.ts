/**
 * Verified-Production tasks — Cancel Order from Order History (writes: tiny orders).
 *
 *   VP-3335/3342  Cancelling a paid Cash order voids its payment; the order shows as
 *                 cancelled in Order History and the till's data
 *   VP-4376/3565  An order paid by gift card is cancelled without a false "insufficient
 *                 balance" block, and the card gets exactly its redeemed amount back
 */
import { browser, expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import {
  buildOrder,
  click,
  completePayment,
  customerTip,
  deleteDraft,
  dialogTexts,
  giftCard,
  noReceipt,
  openCheckout,
  openHistoryOrder,
  orderByCode,
  pause,
  passcodeIfPrompted,
  pickMethod,
  typeInto,
} from '../../../src/features/pos.js';
import { itNeeds } from '../../../src/features/spec.js';

const d = profile().data;
const drafts: string[] = [];

/** Order History → Cancel Order → first reason → Confirm Cancel. Returns the dialog text seen. */
async function cancelFromHistory(orderId: string): Promise<string> {
  await openHistoryOrder(orderId);
  await click('Cancel Order', { scope: 'main' });
  await pause(1500);
  await passcodeIfPrompted();
  await pause(800);
  const seen = (await dialogTexts()).join('\n');
  // The cancel dialog is an alertdialog; its reason picker is a combobox.
  await click('Select cancellation reason', { any: true, last: true });
  await pause(1000);
  const picked = await browser.execute(() => {
    const o = document.querySelector<HTMLElement>('[role=option]');
    o?.click();
    return o?.innerText ?? '';
  });
  console.log(`[cancel] reason "${picked}"`);
  await pause(800);
  await click(/^Confirm Cancel/, { any: true, last: true });
  await pause(4000);
  await passcodeIfPrompted();
  await pause(1500);
  return `${seen}\n${(await dialogTexts()).join('\n')}`;
}

async function waitStatus(code: string, re: RegExp, ms = 30_000): Promise<string> {
  let st = '';
  for (const end = Date.now() + ms; Date.now() < end; await pause(2000)) {
    st = (await orderByCode(code))?.status ?? '';
    if (re.test(st)) break;
  }
  return st;
}

describe(`[${profile().target} ${profile().store}] Cancel Order`, () => {
  after(async () => {
    await browser.keys(['Escape']).catch(() => undefined);
    for (const c of drafts) await deleteDraft(c);
  });

  itNeeds(
    ['writes'],
    'CA-01 (VP-3335/3342) Cancelling a paid Cash order voids it (status cancelled, shown in history)',
    async () => {
      const code = await buildOrder([[d.staffA, [d.cheap]]]);
      drafts.push(code);
      await openCheckout();
      await pickMethod('Cash');
      expect((await completePayment('No Tip')).result).toBe('success');
      await noReceipt();
      drafts.pop();
      const o = await orderByCode(code);
      const seen = await cancelFromHistory(o?.id ?? '');
      expect(seen).toContain('All payments will be voided');
      const st = await waitStatus(code, /cancel|void/i);
      expect(st).toMatch(/cancel|void/i);
      const t = await openHistoryOrder(o?.id ?? '');
      expect(t).toMatch(/Cancel|Void/i);
      expect(t).not.toContain('Re-Open Order');
    },
  );

  itNeeds(
    ['writes'],
    'CA-02 (VP-4376/3565) Gift-card paid order: redeem takes exactly the total, cancel gives it back (no false insufficient-balance block)',
    async () => {
      const before = (await giftCard(d.giftCardActive))?.currentBalance ?? 0;
      const code = await buildOrder([[d.staffA, [d.cheap]]]);
      drafts.push(code);
      await openCheckout();
      await pickMethod('Gift Card');
      const due = (await orderByCode(code))?.total ?? 0;
      await completePayment('No Tip');
      for (let i = 0; i < 20; i++) {
        await customerTip('No Tip').catch(() => false);
        await passcodeIfPrompted();
        if ((await dialogTexts()).some((t) => t.includes('Input Gift Card Code'))) break;
        await pause(500);
      }
      await click('Input Gift Card Code', { any: true, last: true });
      await pause(900);
      await typeInto('[role=dialog] input', d.giftCardActive);
      await click('Confirm', { scope: 'dialog' });
      await pause(3500);
      const accepted = (await dialogTexts()).join('\n');
      expect(accepted).toContain('Gift Card Accepted');
      // Redeem: the dialog's primary action after acceptance.
      await click(/^(Redeem|Pay|Confirm|Apply|Use Gift Card)/, { scope: 'dialog', last: true });
      for (let i = 0; i < 40 && (await orderByCode(code))?.status !== 'successful'; i++) {
        await passcodeIfPrompted();
        await pause(750);
      }
      await noReceipt();
      expect((await orderByCode(code))?.status).toBe('successful');
      drafts.pop();
      // The card balance reaches the till by sync — wait for it to move.
      let paid = before;
      for (let i = 0; i < 20 && paid === before; i++) {
        await pause(2000);
        paid = (await giftCard(d.giftCardActive))?.currentBalance ?? 0;
      }
      console.log(
        `[cancel] gift card order ${code}: balance ${String(before)} → ${String(paid)} (due ${String(due)})`,
      );
      expect(before - paid).toBe(due);
      const seen = await cancelFromHistory((await orderByCode(code))?.id ?? '');
      expect(seen).not.toMatch(/insufficient|not enough balance/i);
      expect(await waitStatus(code, /cancel|void/i)).toMatch(/cancel|void/i);
      let back = paid;
      for (let i = 0; i < 30 && back !== before; i++) {
        await pause(2000);
        back = (await giftCard(d.giftCardActive))?.currentBalance ?? 0;
      }
      expect(back).toBe(before);
    },
    ['staffA', 'cheap', 'giftCardActive'],
  );
});
