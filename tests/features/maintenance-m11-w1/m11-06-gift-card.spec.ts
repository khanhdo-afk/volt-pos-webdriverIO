/**
 * Maintenance 2026-Q4-M11-W1 — gift cards:
 *   VP-4894 unknown code refused + Scan Again; an active card is still accepted
 *           (inactive-card case dropped on request: no inactive card syncs to the till)
 *   VP-3788 split check paid by a gift card that runs short keeps the check's tip
 *           on the new check. It CONSUMES the card balance, so it runs only with a
 *           dedicated `giftCardLow` in the store profile.
 */
import { expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import {
  bodyText,
  buildOrder,
  click,
  completePayment,
  completeSplit,
  customerTip,
  passcodeIfPrompted,
  deleteDraft,
  dialogTexts,
  giftCard,
  mainText,
  openCheckout,
  openSplit,
  orderByCode,
  pause,
  payCheck,
  pickMethod,
  typeInto,
  waitText,
} from '../../../src/features/pos.js';
import { itNeeds, noteSkip } from '../../../src/features/spec.js';

const d = profile().data;
const drafts: string[] = [];

async function enterGiftCode(c: string): Promise<string> {
  // The scan dialog can be replaced for a moment by the customer tip step — answer it first.
  for (let i = 0; i < 30; i++) {
    await customerTip('No Tip').catch(() => false);
    await passcodeIfPrompted();
    if ((await dialogTexts()).some((t) => t.includes('Input Gift Card Code'))) break;
    await pause(500);
  }
  await click('Input Gift Card Code', { any: true, last: true });
  await pause(900);
  await typeInto('[role=dialog] input', c);
  await click('Confirm', { scope: 'dialog' });
  await pause(3500);
  return (await dialogTexts()).join('\n');
}

describe(`[${profile().target}] M11-W1 VP-4894 Gift card lookup`, () => {
  after(async () => {
    for (const c of drafts) await deleteDraft(c);
  });

  itNeeds(
    ['writes'],
    'TC-GC-06/04 Unknown code → "Gift card is not valid" + Scan Again back to the code screen',
    async () => {
      const code = await buildOrder([[d.staffA, [d.cheap]]]);
      drafts.push(code);
      await openCheckout();
      await pickMethod('Gift Card');
      expect((await completePayment('No Tip')).text).toContain('Input Gift Card Code');
      const t = await enterGiftCode('000000000001');
      expect(t).toContain('Gift card is not valid');
      expect(t).not.toContain('Gift Card Accepted');
      await click('Scan Again', { scope: 'dialog' });
      expect(await waitText('Input Gift Card Code', 8000)).toBe(true);
    },
  );

  itNeeds(
    ['writes'],
    'TC-GC-05 An active card is accepted (cancelled before paying — balance untouched)',
    async function () {
      if (!d.giftCardActive) {
        noteSkip(this.test?.title ?? '', `store ${profile().store} has no active gift card with a balance`);
        this.skip();
      }
      const before = await giftCard(d.giftCardActive);
      // The previous TC's dialog was closed by the afterEach Escape — reopen the Gift Card step.
      if (!(await dialogTexts()).some((x) => x.includes('Input Gift Card Code'))) {
        await pickMethod('Gift Card');
        await completePayment('No Tip');
      }
      const t = await enterGiftCode(d.giftCardActive);
      expect(t).toContain('Gift Card Accepted');
      expect(t).toContain(`****-****-${d.giftCardActive.slice(-4)}`);
      await click('Cancel', { scope: 'dialog', last: true });
      await pause(1500);
      expect((await giftCard(d.giftCardActive))?.currentBalance).toBe(before?.currentBalance);
    },
  );
});

describe(`[${profile().target}] M11-W1 VP-3788 Split + short gift card keeps the tip`, () => {
  after(async () => {
    for (const c of drafts) await deleteDraft(c);
  });

  itNeeds(
    ['writes'],
    'TC-VP3788-01..05 Short card → Create New Check keeps the $8 tip; Cash pays the rest',
    async function () {
      if (!d.giftCardLow) {
        // Consumes a real card balance, so it is never auto-discovered.
        noteSkip(
          this.test?.title ?? '',
          `needs a dedicated low-balance gift card — set giftCardLow in configs/profiles/${profile().target}.${profile().store}.json`,
        );
        this.skip();
      }
      const gc = await giftCard(d.giftCardLow);
      const bal = gc?.currentBalance ?? 0;
      // Build an order whose half is > balance + $1 so the card runs short.
      const per = 2500;
      const n = Math.max(4, Math.ceil(((bal + 200) * 2) / per) + 1);
      const code = await buildOrder([
        [d.staffA, Array.from({ length: n }, (_, i) => (i % 2 ? d.svc25b : d.svc25))],
      ]);
      drafts.push(code);
      const id = (await orderByCode(code))?.id ?? '';
      await openCheckout();
      await openSplit(id, 'By Amount');
      await click(`Select #${code}-1`, { scope: 'main' });
      await click('Tip', { scope: 'main' });
      await pause(1000);
      for (const k of ['8', '00']) await click(k, { scope: 'dialog' });
      await click('Add', { scope: 'dialog' });
      await pause(1500);
      expect(await mainText()).toContain('Tip\n$8.00');
      await click('Gift Card', { scope: 'main' });
      await click(/^Pay/, { scope: 'main', last: true });
      await pause(2000);
      await passcodeIfPrompted();
      const short = await enterGiftCode(d.giftCardLow);
      expect(short).toContain('Gift Card not Enough Balance');
      await click('Create New Check', { scope: 'dialog' });
      await pause(3000);
      await passcodeIfPrompted();
      const after = await mainText();
      expect(after).toContain('Tip\n$8.00');
      expect(after).toMatch(/Paid with Gift Card/);
      await payCheck(code, 3, 'Cash');
      await payCheck(code, 2, 'Cash');
      const succ = await completeSplit();
      expect(succ).toContain('Total Tip: $8.00');
      expect((await orderByCode(code))?.tipAmount).toBe(800);
      drafts.pop();
      void bodyText;
    },
  );
});
