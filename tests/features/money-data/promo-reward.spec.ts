/**
 * Verified-Production tasks — Promo & Rewards on an order (writes: draft orders only,
 * every draft is removed; nothing is paid, so no reward is consumed).
 *
 *   VP-3564  Without a customer no reward can be applied ("No rewards available")
 *   VP-4802  With a customer the Promo & Rewards button shows how many are available
 *   VP-4375  A FIXED reward larger than the order is capped: discount = subtotal, Total $0.00
 *   VP-3797  Checkout explains Total Discount with its breakdown line
 */
import { browser, expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import {
  attachCustomer,
  buildOrder,
  click,
  deleteDraft,
  dialogTexts,
  mainText,
  money,
  openCheckout,
  pause,
  passcodeIfPrompted,
} from '../../../src/features/pos.js';
import { itNeeds, noteSkip } from '../../../src/features/spec.js';

const d = profile().data;
const drafts: string[] = [];

async function openPromo(): Promise<string> {
  await click('Promo & Rewards', { scope: 'main', any: true });
  await pause(2000);
  return (await dialogTexts()).join('\n');
}
/** Reward / promotion option lines listed between a section title and the next one. */
function section(t: string, title: string, next: string): string[] {
  const from = t.indexOf(`\n${title}\n`);
  if (from < 0) return [];
  const rest = t.slice(from + title.length + 2);
  const to = rest.indexOf(`\n${next}`);
  return (to >= 0 ? rest.slice(0, to) : rest)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/^No (promotions|rewards) available$/.test(l));
}

describe(`[${profile().target} ${profile().store}] Promo & Rewards`, () => {
  after(async () => {
    await browser.keys(['Escape']).catch(() => undefined);
    for (const c of drafts) await deleteDraft(c);
  });

  itNeeds(['writes'], 'PR-01 (VP-3564) Without a customer no reward is offered', async () => {
    drafts.push(await buildOrder([[d.staffA, [d.cheap]]]));
    const t = await openPromo();
    expect(t).toContain('Rewards');
    expect(t).toContain('No rewards available');
    await browser.keys(['Escape']);
    await pause(800);
  });

  itNeeds(
    ['writes'],
    'PR-02 (VP-4802) With a customer the button shows the number of available promotions + rewards',
    async () => {
      await attachCustomer(d.customer, d.customerSearch);
      const badge = Number((await mainText()).match(/\nPromo & Rewards\n(\d+)\n/)?.[1] ?? '0');
      const t = await openPromo();
      const promos = section(t, 'Promotions', 'Custom Discount');
      const rewards = section(t, 'Rewards', 'Apply');
      console.log(
        `[promo] badge ${String(badge)} · promotions ${JSON.stringify(promos)} · rewards ${JSON.stringify(rewards)}`,
      );
      expect(badge).toBe(promos.length + rewards.length);
      await browser.keys(['Escape']);
      await pause(800);
    },
    ['staffA', 'cheap', 'customer', 'customerSearch'],
  );

  itNeeds(
    ['writes'],
    'PR-03 (VP-4375/3797) A fixed reward bigger than the order is capped at the subtotal; Total $0.00',
    async function () {
      const t = await openPromo();
      const fixed = section(t, 'Rewards', 'Apply')
        .map((r) => ({
          r,
          cents: money(
            r
              .match(/(\d+(?:\.\d{1,2})?)\s*\$|\$\s*(\d+(?:\.\d{1,2})?)/)
              ?.slice(1)
              .find(Boolean) ?? '0',
          ),
        }))
        .filter((x) => x.cents > 0)
        .sort((a, b) => b.cents - a.cents);
      if (!fixed.length) {
        await browser.keys(['Escape']);
        noteSkip(
          this.test?.title ?? '',
          `customer ${d.customer} has no fixed-amount ($) reward on this store`,
        );
        this.skip();
      }
      const sub = money((await mainText()).match(/Subtotal\n(\$[\d,.]+)/)?.[1] ?? '0');
      expect(fixed[0]!.cents).toBeGreaterThan(sub);
      await click(fixed[0]!.r, { scope: 'dialog', any: true, exact: true });
      await pause(800);
      await click('Apply', { scope: 'dialog' });
      await pause(2500);
      await passcodeIfPrompted();
      await openCheckout();
      const c = await mainText();
      console.log(`[promo] checkout ${c.slice(c.indexOf('Subtotal')).replace(/\n/g, ' | ').slice(0, 200)}`);
      expect(c).toMatch(new RegExp(`Total Discount\\n- \\$${(sub / 100).toFixed(2).replace('.', '\\.')}`));
      expect(c).toMatch(/Reward Redemption\n- \$[\d.]+/);
      expect(c).toMatch(/\nTotal\n\$0\.00/);
      expect(c).not.toMatch(/-\$\d|\$-\d/);
      await browser.keys(['Escape']);
      await pause(800);
    },
    ['staffA', 'cheap', 'customer', 'customerSearch'],
  );
});
