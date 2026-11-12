/**
 * Maintenance 2026-Q4-M11-W1 — VP-5627 default Owner/Staff split for a Custom
 * promotion (POS part; the Portal side is verified separately).
 * The store's Custom / Available values are read first and restored in `after`.
 */
import { expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import {
  buildOrder,
  click,
  completePayment,
  deleteDraft,
  dialogTexts,
  mainText,
  noReceipt,
  openCheckout,
  orderByCode,
  pause,
  pickMethod,
  typeInto,
} from '../../../src/features/pos.js';
import {
  inputValue,
  openSettings,
  saveCard,
  saveDisabled,
  setInput,
} from '../../../src/features/settings.js';
import { itNeeds } from '../../../src/features/spec.js';
import { browser } from '@wdio/globals';

const d = profile().data;
const ID = {
  aOwner: '#discount-setting-available-owner',
  aStaff: '#discount-setting-available-staff',
  cOwner: '#discount-setting-custom-owner',
  cStaff: '#discount-setting-custom-staff',
};
const orig: Record<string, string> = {};
let code = '';

async function setCustom(owner: string, staff: string): Promise<string> {
  await openSettings('charge-fee');
  await setInput(ID.cOwner, owner);
  await setInput(ID.cStaff, staff);
  return saveCard('Discount Setting');
}

async function applyCustom(pct: string, split?: [string, string]): Promise<void> {
  await click('Promo & Rewards', { scope: 'main' });
  await pause(1500);
  await click('Percentage %', { scope: 'dialog', any: true });
  await typeInto('[role=dialog] input', pct);
  if (split) {
    await click('Order promotion discount setting', { scope: 'dialog', any: true });
    await pause(800);
    const ins = await browser.$$('[role=dialog] input').getElements();
    for (const [i, v] of [
      [1, split[0]],
      [2, split[1]],
    ] as const) {
      const el = ins[i];
      if (!el) throw new Error('split inputs not found');
      await el.click();
      await browser.keys(['Control', 'a']);
      await browser.keys(['Backspace']);
      await browser.keys(v.split(''));
    }
  }
  await click('Apply', { scope: 'dialog' });
  await pause(2000);
}

describe(`[${profile().target}] M11-W1 VP-5627 Custom promotion default split`, () => {
  before(async () => {
    await openSettings('charge-fee');
    for (const [k, css] of Object.entries(ID)) orig[k] = await inputValue(css);
  });
  after(async () => {
    if (code) await deleteDraft(code);
    if (orig.cOwner !== undefined) {
      await openSettings('charge-fee');
      if ((await inputValue(ID.cOwner)) !== orig.cOwner || (await inputValue(ID.cStaff)) !== orig.cStaff) {
        await setCustom(orig.cOwner ?? '100', orig.cStaff ?? '0');
      }
    }
  });

  it('TC-VP5627-01 Charge & Fee has Available + Custom splits, each summing to 100', () => {
    expect(Number(orig.aOwner) + Number(orig.aStaff)).toBe(100);
    expect(Number(orig.cOwner) + Number(orig.cStaff)).toBe(100);
  });

  itNeeds(
    ['settings'],
    'TC-VP5627-02 A split that is not 100% shows an error and cannot be saved',
    async () => {
      await openSettings('charge-fee');
      await setInput(ID.cOwner, '60');
      await setInput(ID.cStaff, '30');
      expect(await mainText()).toContain('Owner and staff percent must total 100%');
      expect(await saveDisabled('Discount Setting')).toBe(true);
    },
  );

  itNeeds(['settings'], 'TC-VP5627-03 Saving 60/40 persists and leaves Available untouched', async () => {
    expect(await setCustom('60', '40')).toContain('Discount setting updated');
    await openSettings('charge-fee');
    expect(await inputValue(ID.cOwner)).toBe('60');
    expect(await inputValue(ID.cStaff)).toBe('40');
    expect(await inputValue(ID.aOwner)).toBe(orig.aOwner);
    expect(await inputValue(ID.aStaff)).toBe(orig.aStaff);
  });

  itNeeds(
    ['settings', 'writes'],
    'TC-VP5627-13 Applying a Custom discount without opening the split stores 60/40',
    async () => {
      code = await buildOrder([
        [d.staffA, [d.cheap2]],
        [d.staffB, [d.cheap]],
      ]);
      await applyCustom('20');
      const o = await orderByCode(code);
      expect(o?.merchantPromotionPercent).toBe(60);
      expect(o?.staffPromotionPercent).toBe(40);
    },
  );

  itNeeds(['settings', 'writes'], 'TC-VP5627-11 The popup pre-fills the store split', async () => {
    await click('Promo & Rewards', { scope: 'main' });
    await pause(1500);
    await click('Order promotion discount setting', { scope: 'dialog', any: true });
    await pause(800);
    const vals = await browser.execute(() =>
      [...document.querySelectorAll('[role=dialog] input')].map((i) => (i as HTMLInputElement).value),
    );
    expect(vals.slice(1, 3)).toEqual(['60', '40']);
    await browser.keys(['Escape']);
    await pause(600);
    void dialogTexts;
  });

  itNeeds(['settings', 'writes'], 'TC-VP5627-12 A per-order 70/30 changes only that order', async () => {
    await applyCustom('20', ['70', '30']);
    const o = await orderByCode(code);
    expect([o?.merchantPromotionPercent, o?.staffPromotionPercent]).toEqual([70, 30]);
    await openSettings('charge-fee');
    expect([await inputValue(ID.cOwner), await inputValue(ID.cStaff)]).toEqual(['60', '40']);
  });

  itNeeds(
    ['settings', 'writes'],
    'TC-VP5627-14 A completed order keeps its split after the store setting changes',
    async () => {
      await (await import('../../../src/features/pos.js')).go('/home', 2500);
      await click(code, { scope: 'main', any: true });
      await pause(1500);
      await openCheckout();
      await pickMethod('Cash');
      expect((await completePayment('No Tip')).result).toBe('success');
      await noReceipt();
      expect(await setCustom('50', '50')).toContain('Discount setting updated');
      const o = await orderByCode(code);
      expect(o?.status).toBe('successful');
      expect([o?.merchantPromotionPercent, o?.staffPromotionPercent]).toEqual([70, 30]);
      code = '';
    },
  );
});
