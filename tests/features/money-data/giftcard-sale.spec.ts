/**
 * Verified-Production tasks — selling a gift card on an order (writes: an UNPAID draft
 * only — it is removed at the end, so no card is ever activated or charged).
 *
 *   VP-4434            Sell Gift Card → Add opens the order with the gift-card line
 *   VP-4160/3767/3827  A promotion / custom discount never reduces the gift-card line,
 *                      and the gift-card sale carries no Service Fee
 */
import { browser, expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import { priceOf } from '../../../src/features/discover.js';
import {
  click,
  clickService,
  currentOrderCode,
  deleteDraft,
  dialogTexts,
  go,
  mainText,
  methodCents,
  money,
  openCheckout,
  pause,
  passcodeIfPrompted,
  selectStaff,
  typeInto,
} from '../../../src/features/pos.js';
import { itNeeds } from '../../../src/features/spec.js';

const d = profile().data;
let code = '';
const GC_VALUE = 2500;

describe(`[${profile().target} ${profile().store}] Gift card sale on an order`, () => {
  after(async () => {
    await browser.keys(['Escape']).catch(() => undefined);
    if (code) await deleteDraft(code);
  });

  itNeeds(
    ['writes'],
    'GS-01 (VP-4434) Sell Gift Card → Add opens an order holding the gift-card line',
    async () => {
      await go('/order-pending', 2500);
      await go('/home', 2500);
      if (/#OD\d{6}-\d+/.test(await mainText()))
        throw new Error('an order is already selected on Home — refusing to add a gift card to it');
      await click('Gift Card', { scope: 'main', any: true });
      await pause(1500);
      await passcodeIfPrompted();
      await pause(800);
      expect((await dialogTexts()).join('\n')).toContain('Sell Gift Card');
      // Sell dialog only accepts a card the store knows; an UNPAID draft never changes its balance.
      const number = process.env.GC_SALE_CODE ?? d.giftCardActive;
      await typeInto('Enter gift card code', number);
      await pause(1500);
      console.log(
        `[gc-sale] after code: ${(await dialogTexts()).join(' ').replace(/\n/g, ' | ').slice(0, 300)}`,
      );
      await click('$25', { scope: 'dialog', exact: true });
      await pause(800);
      const dlg = (await dialogTexts()).join('\n');
      expect(dlg).toMatch(/Customer Pays\n\$25\.00/);
      await click('Add', { scope: 'dialog', exact: true });
      await pause(3000);
      await passcodeIfPrompted();
      code = await currentOrderCode();
      const t = await mainText();
      console.log(
        `[gc-sale] order ${code}: ${t.slice(t.indexOf(`#${code}`), t.indexOf(`#${code}`) + 300).replace(/\n/g, ' | ')}`,
      );
      // The line may be shown fee-inclusive (store setting), so check the card line itself.
      expect(t).toContain(`Gift Card [****-****-${number.slice(-4)}]`);
    },
  );

  itNeeds(
    ['writes'],
    'GS-02 (VP-4160/3767/3827) A 50% custom discount reduces only the service; the gift card stays full price, no fee',
    async () => {
      expect(code).not.toBe('');
      await selectStaff(d.staffA);
      await clickService(d.svc25);
      await pause(800);
      await click('Promo & Rewards', { scope: 'main', any: true });
      await pause(1500);
      await click('Percentage %', { scope: 'dialog', any: true });
      await typeInto('[role=dialog] input', '50');
      await click('Apply', { scope: 'dialog' });
      await pause(2500);
      await passcodeIfPrompted();
      await openCheckout();
      const c = await mainText();
      console.log(`[gc-sale] checkout ${c.slice(c.indexOf('Order #')).replace(/\n/g, ' | ').slice(0, 500)}`);
      const svc = priceOf(d.svc25);
      const disc = money(c.match(/Total Discount\n- ?\$([\d,.]+)/)?.[1] ?? '0');
      expect(disc).toBe(Math.round(svc / 2));
      // Discount is half the SERVICE only (half of service + gift card would be bigger).
      expect(disc).toBeLessThan(Math.round((svc + GC_VALUE) / 2));
      // Cash total = full gift card + discounted service, no Service Fee.
      expect(await methodCents('Cash')).toBe(GC_VALUE + svc - disc);
      // A gift card cannot pay for a gift card.
      expect(c).toContain('Cannot use Gift Card to buy a Gift Card');
      await browser.keys(['Escape']);
      await pause(800);
    },
    ['staffA', 'svc25'],
  );
});
