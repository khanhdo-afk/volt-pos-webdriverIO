/**
 * Project "Dark mode POS" (VP-3798 … VP-3896, VP-3457):
 *   VP-3800 Appearance (Light / Dark) under Accessibility
 *   VP-3798 / VP-3799 dark palette applied, remembered across reload, on BOTH windows
 *   VP-3806 customer display follows the theme
 *   VP-3801–3805 / 3816–3819 / 3896 screens readable in dark (text/background contrast)
 *   VP-3807 / VP-3814 icons follow the theme (no dark-on-dark icons)
 * The original theme is read first and restored in `after`.
 */
import { browser, expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import { customerEval } from '../../../src/features/customerCdp.js';
import {
  buildOrder,
  click,
  deleteDraft,
  go,
  mainText,
  openCheckout,
  pause,
} from '../../../src/features/pos.js';
import { htmlTheme, openSettings, setAppearance } from '../../../src/features/settings.js';
import { itNeeds } from '../../../src/features/spec.js';

const d = profile().data;
let original: 'Light' | 'Dark' = 'Light';
let draft = '';

/** Share of visible text elements whose contrast vs. their effective background is < `min`. */
async function lowContrast(min = 3): Promise<{ total: number; bad: number; samples: string[] }> {
  return browser.execute((m: number) => {
    // Resolve ANY CSS colour (rgb, oklab, oklch, color-mix…) to sRGB + alpha via a 1×1 canvas;
    // reading the numbers of an oklab() string as 0–255 would call near-white text "black".
    const cv = document.createElement('canvas');
    cv.width = 1;
    cv.height = 1;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    const parse = (c: string): number[] | null => {
      if (!ctx || !c || c === 'transparent') return null;
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#000';
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      if ((a ?? 0) === 0) return [0, 0, 0, 0];
      return [r ?? 0, g ?? 0, b ?? 0, (a ?? 255) / 255];
    };
    const lum = (rgb: number[]): number => {
      const f = (x: number): number => {
        const s = x / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(rgb[0] ?? 0) + 0.7152 * f(rgb[1] ?? 0) + 0.0722 * f(rgb[2] ?? 0);
    };
    const bgOf = (e: Element | null): number[] => {
      let p: Element | null = e;
      while (p) {
        const c = parse(getComputedStyle(p).backgroundColor);
        if (c && (c[3] === undefined || c[3] > 0.5)) return c;
        p = p.parentElement;
      }
      return document.documentElement.classList.contains('dark') ? [0, 0, 0] : [255, 255, 255];
    };
    const els = [...document.querySelectorAll('main *, header *')].filter((e) => {
      const r = e.getBoundingClientRect();
      const own = [...e.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim().length > 1);
      const st = getComputedStyle(e);
      return own && r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && Number(st.opacity) > 0.5;
    });
    let bad = 0;
    const samples: string[] = [];
    for (const e of els) {
      const fg = parse(getComputedStyle(e).color);
      if (!fg) continue;
      const bg = bgOf(e);
      // Saturated surfaces are the merchant's category/service colours and brand buttons —
      // identical in Light and Dark, not theme tokens — so they are out of scope here.
      if (Math.max(bg[0] ?? 0, bg[1] ?? 0, bg[2] ?? 0) - Math.min(bg[0] ?? 0, bg[1] ?? 0, bg[2] ?? 0) > 60)
        continue;
      // Semi-transparent text (e.g. 70% white) is seen blended over its background.
      const a = fg[3] ?? 1;
      const blended = [0, 1, 2].map((i) => (fg[i] ?? 0) * a + (bg[i] ?? 0) * (1 - a));
      const l1 = lum(blended);
      const l2 = lum(bg);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      if (ratio < m) {
        bad++;
        if (samples.length < 5)
          samples.push(`${(e as HTMLElement).innerText.trim().slice(0, 25)} (${ratio.toFixed(2)})`);
      }
    }
    return { total: els.length, bad, samples };
  }, min);
}

async function expectReadable(screen: string): Promise<void> {
  const r = await lowContrast(3);
  console.log(
    `[dark] ${screen}: ${String(r.bad)}/${String(r.total)} text elements below 3:1 ${r.samples.join(' | ')}`,
  );
  expect(r.total).toBeGreaterThan(0);
  expect(r.bad / r.total).toBeLessThan(0.05);
}

describe(`[${profile().target}] Dark mode POS`, () => {
  before(async () => {
    await openSettings('accessibility');
    original = (await htmlTheme()).includes('dark') ? 'Dark' : 'Light';
  });
  after(async () => {
    if (draft) await deleteDraft(draft);
    await setAppearance(original);
  });

  it('DM-01 (VP-3800) Accessibility has an Appearance setting with Light and Dark', async () => {
    await openSettings('accessibility');
    const t = await mainText();
    expect(t).toContain('Appearance');
    expect(t).toMatch(/Appearance[\s\S]{0,120}Light\nDark/);
  });

  itNeeds(['settings'], 'DM-02 (VP-3798) Dark applies at once to the staff window', async () => {
    await setAppearance('Dark');
    expect(await htmlTheme()).toContain('dark');
    const card = await browser.execute(() => {
      const c = document.querySelector('[data-slot=card]');
      return c ? getComputedStyle(c).backgroundColor : '';
    });
    const rgb = card.match(/\d+/g)?.map(Number) ?? [255, 255, 255];
    expect(Math.max(...rgb.slice(0, 3))).toBeLessThan(90);
  });

  itNeeds(['settings'], 'DM-03 (VP-3799/3806) The customer display follows the theme', async () => {
    expect(await customerEval<string>('document.documentElement.className')).toContain('dark');
  });

  itNeeds(['settings'], 'DM-04 (VP-3799) The choice survives a reload', async () => {
    await browser.refresh();
    await pause(3000);
    expect(await htmlTheme()).toContain('dark');
  });

  itNeeds(['settings'], 'DM-05 (VP-3804/3819) Settings readable in dark', async () => {
    await openSettings('accessibility');
    await expectReadable('Settings / Accessibility');
    await openSettings('receipt');
    await expectReadable('Settings / Receipt');
  });

  itNeeds(['settings'], 'DM-06 (VP-3802/3817) Home and Pending readable in dark', async () => {
    await go('/home', 2500);
    await expectReadable('Home');
    await go('/order-pending', 2500);
    await expectReadable('Pending Orders');
  });

  itNeeds(['settings'], 'DM-07 (VP-3805) Order History readable in dark', async () => {
    await go('/order-history', 3000);
    await expectReadable('Order History');
  });

  itNeeds(['settings', 'writes'], 'DM-08 (VP-3803/3818) Order and Checkout readable in dark', async () => {
    draft = await buildOrder([[d.staffA, [d.cheap]]]);
    await expectReadable('Order (cart)');
    await openCheckout();
    await expectReadable('Checkout');
  });

  itNeeds(
    ['settings'],
    'DM-09 (VP-3807/3814) Header icons follow the theme (light strokes in dark)',
    async () => {
      await go('/home', 2500);
      // Icons are SVGs or icon-font glyphs (`icon-*`); resolve their colour through a canvas.
      const read = (): Promise<number[]> =>
        browser.execute(() => {
          const cv = document.createElement('canvas').getContext('2d');
          return [...document.querySelectorAll('header svg, header [class*="icon-"]')]
            .filter((s) => s.getBoundingClientRect().width > 0)
            .map((s) => {
              if (!cv) return 255;
              cv.fillStyle = '#000';
              cv.fillStyle = getComputedStyle(s).color;
              cv.fillRect(0, 0, 1, 1);
              const [r, g, b] = cv.getImageData(0, 0, 1, 1).data;
              return Math.max(r ?? 0, g ?? 0, b ?? 0);
            });
        });
      let dark = await read();
      for (let i = 0; i < 10 && dark.length === 0; i++) {
        await pause(500);
        dark = await read();
      }
      expect(dark.length).toBeGreaterThan(0);
      expect(dark.filter((m) => m < 60).length).toBe(0);
    },
  );

  itNeeds(['settings'], 'DM-10 Back to Light restores both windows', async () => {
    await setAppearance('Light');
    expect(await htmlTheme()).not.toContain('dark');
    expect(await customerEval<string>('document.documentElement.className')).not.toContain('dark');
    void click;
  });
});
