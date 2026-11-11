/**
 * Verified-Production tasks — checkout amounts (Cash / Other / Gift Card) and loyalty points.
 * Writes: tiny Cash orders on the store's cheapest services (+ one $25 order for points).
 *
 *   VP-2912/4083/3827  Other / Cash / Gift Card amounts carry no Service Fee or Cash Discount;
 *                      Card is the only method that may add a fee
 *   VP-3431/3566       Total Paid / Remaining values are at least as prominent as their labels
 *   VP-3593/3437       Quick-cash presets replace the amount instead of adding up
 *   VP-4792/3200/3979  Paying with a customer adds points + one visit
 *   VP-5112            Customer display says "1 point" (singular) / "N points"
 *   VP-5357/4444       After Cash success the till returns to an empty order
 */
import { browser, expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import { customerText } from '../../../src/features/customerCdp.js';
import {
  attachCustomer,
  buildOrder,
  click,
  completePayment,
  customerByName,
  deleteDraft,
  mainText,
  methodCents,
  money,
  noReceipt,
  openCheckout,
  orderByCode,
  pause,
  pickMethod,
  waitCustomer,
} from '../../../src/features/pos.js';
import { itNeeds, noteSkip } from '../../../src/features/spec.js';

const d = profile().data;
const drafts: string[] = [];

async function settled(name: string): Promise<{ points: number; visits: number }> {
  const read = async (): Promise<{ points: number; visits: number }> => {
    const c = await customerByName(name);
    return { points: c?.pointBalance ?? 0, visits: c?.visitCount ?? 0 };
  };
  let prev = await read();
  for (let i = 0; i < 6; i++) {
    await pause(8000);
    const cur = await read();
    if (cur.points === prev.points && cur.visits === prev.visits) return cur;
    prev = cur;
  }
  return prev;
}

describe(`[${profile().target} ${profile().store}] Checkout amounts & loyalty`, () => {
  after(async () => {
    for (const c of drafts) await deleteDraft(c);
  });

  itNeeds(
    ['writes'],
    'CO-01 (VP-2912/4083/3827) Other, Cash and Gift Card amounts have no Service Fee; Card ≥ them',
    async () => {
      const code = await buildOrder([[d.staffA, [d.cheap, d.cheap2]]]);
      drafts.push(code);
      await openCheckout();
      const [card, cash, other, gc] = [
        await methodCents('Card'),
        await methodCents('Cash'),
        await methodCents('Other'),
        await methodCents('Gift Card'),
      ];
      console.log(
        `[checkout] card ${String(card)} cash ${String(cash)} other ${String(other)} gift ${String(gc)}`,
      );
      expect(other).toBe(cash);
      expect(gc).toBe(cash);
      expect(card).toBeGreaterThanOrEqual(cash);
      const t = await mainText();
      // Without tax on the order, the non-card amount is exactly the sum of the line prices.
      if (!/\nTax\n/.test(t)) {
        const sub = money(t.match(/Subtotal\n(\$[\d,.]+)/)?.[1] ?? '0');
        const fee = card - cash;
        expect(cash).toBe(sub - fee);
      }
    },
  );

  itNeeds(
    ['writes'],
    'CO-02 (VP-3431/3566) Total Paid / Remaining amounts are as large and bold as their labels',
    async () => {
      // Same draft as CO-01 (still on checkout).
      const st = await browser.execute(() => {
        const leaf = (txt: string): HTMLElement | undefined =>
          [...document.querySelectorAll('main *')].find(
            (e) => e.childElementCount === 0 && (e as HTMLElement).innerText?.trim() === txt,
          ) as HTMLElement | undefined;
        return ['Total Paid', 'Remaining'].map((label) => {
          const l = leaf(label);
          const v = l?.parentElement?.querySelector(':scope > :last-child') as HTMLElement | null;
          const cs = (e: Element | null | undefined): [number, number] =>
            e
              ? [Number.parseFloat(getComputedStyle(e).fontSize), Number(getComputedStyle(e).fontWeight)]
              : [0, 0];
          return { label, l: cs(l), v: cs(v), vText: v?.innerText ?? '' };
        });
      });
      console.log(`[checkout] ${JSON.stringify(st)}`);
      for (const s of st) {
        expect(s.vText).toMatch(/^\$/);
        expect(s.v[0]).toBeGreaterThanOrEqual(s.l[0]);
        expect(s.v[1]).toBeGreaterThanOrEqual(600);
      }
    },
  );

  itNeeds(
    ['writes'],
    'CO-03 (VP-3593/3437) Two quick-cash presets: the amount is the LAST preset, not the sum',
    async function () {
      await pickMethod('Cash');
      const presets = await browser.execute(() =>
        [...document.querySelectorAll('main button')]
          .map((b) => (b as HTMLElement).innerText.trim())
          .filter((x) => /^\$\d+(\.\d{2})?$/.test(x)),
      );
      if (presets.length < 2) {
        noteSkip(this.test?.title ?? '', 'this store shows fewer than 2 quick-cash presets');
        this.skip();
      }
      const [p1, p2] = [presets[0]!, presets[1]!];
      await click(p1, { scope: 'main', exact: true });
      await pause(500);
      await click(p2, { scope: 'main', exact: true });
      await pause(800);
      const amount = (await mainText()).match(/Enter Amount\n(\$[\d,.]+)/)?.[1] ?? '';
      expect(money(amount)).toBe(money(p2));
      await browser.keys(['Escape']);
    },
  );

  itNeeds(
    ['writes'],
    'CO-04 (VP-4792/3200/3979/5112/5357/4444) Cash with a customer: points + 1 visit, success at once, display grammar',
    async () => {
      const before = await settled(d.customer);
      const code = await buildOrder([[d.staffA, [d.svc25]]]);
      drafts.push(code);
      await attachCustomer(d.customer, d.customerSearch);
      expect(await mainText()).toContain(d.customer);
      await openCheckout();
      await pickMethod('Cash');
      const t0 = Date.now();
      const out = await completePayment('No Tip');
      expect(out.result).toBe('success');
      console.log(`[checkout] cash success after ${String(Date.now() - t0)} ms`);
      const shown = await customerText().catch(() => '');
      const earned = shown.match(/earned (\d+) (points?)/i);
      if (earned) expect(earned[2]).toBe(Number(earned[1]) === 1 ? 'point' : 'points');
      await noReceipt();
      expect((await orderByCode(code))?.status).toBe('successful');
      drafts.pop();
      expect(await mainText()).not.toContain(`#${code}`);
      const after = await waitCustomer(
        d.customer,
        (s) => s.visits === before.visits + 1 && s.points > before.points,
      );
      expect(after.visits).toBe(before.visits + 1);
      expect(after.points).toBeGreaterThan(before.points);
    },
    ['staffA', 'svc25', 'customer', 'customerSearch'],
  );
});
